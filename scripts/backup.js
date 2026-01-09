#!/usr/bin/env node

/**
 * Database Backup Script
 *
 * Creates a backup of the database and stores it in storage/backups/
 *
 * Usage:
 *   node scripts/backup.js
 *   npm run backup
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const dotenv = require('dotenv');
const dayjs = require('dayjs');

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}▶  ${msg}${colors.reset}`),
};

/**
 * Ensure backup directory exists
 */
function ensureBackupDirectory() {
  const backupDir = process.env.BACKUP_PATH || './storage/backups';

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log.info(`Created backup directory: ${backupDir}`);
  }

  return backupDir;
}

/**
 * Generate backup filename
 */
function generateBackupFilename(prefix = 'backup') {
  const timestamp = dayjs().format('YYYYMMDD-HHmmss');
  return `${prefix}-${timestamp}`;
}

/**
 * Backup SQLite database
 */
async function backupSQLite() {
  log.step('Backing up SQLite database...');

  const sourcePath = process.env.DB_PATH || './storage/database.sqlite';
  const backupDir = ensureBackupDirectory();
  const filename = generateBackupFilename('sqlite');
  const backupPath = path.join(backupDir, `${filename}.sqlite`);

  // Check if source database exists
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Database file not found: ${sourcePath}`);
  }

  // Copy database file
  fs.copyFileSync(sourcePath, backupPath);

  // Get file size
  const stats = fs.statSync(backupPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  log.success(`Backup created: ${backupPath}`);
  log.info(`  Size: ${fileSizeInMB} MB`);

  // Compress backup if enabled
  if (process.env.BACKUP_COMPRESS === 'true') {
    log.step('Compressing backup...');

    try {
      await execAsync(`gzip "${backupPath}"`);
      log.success(`Backup compressed:  ${backupPath}.gz`);
      return `${backupPath}.gz`;
    } catch (error) {
      log.warning('Compression failed, keeping uncompressed backup');
      return backupPath;
    }
  }

  return backupPath;
}

/**
 * Backup PostgreSQL database
 */
async function backupPostgreSQL() {
  log.step('Backing up PostgreSQL database...');

  const backupDir = ensureBackupDirectory();
  const filename = generateBackupFilename('postgres');
  const backupPath = path.join(backupDir, `${filename}.sql`);

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || 'cashflow_db';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD;

  // Set PGPASSWORD environment variable
  const env = { ...process.env, PGPASSWORD: dbPassword };

  // Run pg_dump
  const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${backupPath}"`;

  try {
    await execAsync(command, { env });

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    log.success(`Backup created: ${backupPath}`);
    log.info(`  Size: ${fileSizeInMB} MB`);

    // Compress backup if enabled
    if (process.env.BACKUP_COMPRESS === 'true') {
      log.step('Compressing backup...');

      try {
        await execAsync(`gzip "${backupPath}"`);
        log.success(`Backup compressed: ${backupPath}.gz`);
        return `${backupPath}.gz`;
      } catch (error) {
        log.warning('Compression failed, keeping uncompressed backup');
        return backupPath;
      }
    }

    return backupPath;
  } catch (error) {
    throw new Error(`PostgreSQL backup failed: ${error.message}`);
  }
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;

  if (retentionDays <= 0) {
    log.info('Backup retention is disabled');
    return;
  }

  log.step(`Cleaning backups older than ${retentionDays} days...`);

  const backupDir = process.env.BACKUP_PATH || './storage/backups';
  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  const files = fs.readdirSync(backupDir);
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      deletedCount++;
      log.info(`  Deleted old backup: ${file}`);
    }
  }

  if (deletedCount === 0) {
    log.info('  No old backups to clean');
  } else {
    log.success(`Cleaned ${deletedCount} old backup(s)`);
  }
}

/**
 * Main backup function
 */
async function runBackup() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     💾 Database Backup                                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    const dbType = process.env.DB_TYPE || 'sqlite';
    log.info(`Database type: ${dbType}`);

    console.log('');

    let backupPath;

    if (dbType === 'sqlite') {
      backupPath = await backupSQLite();
    } else if (dbType === 'postgresql') {
      backupPath = await backupPostgreSQL();
    } else {
      throw new Error(`Unsupported database type: ${dbType}`);
    }

    console.log('');

    // Clean old backups
    await cleanOldBackups();

    console.log('');
    log.success('Backup completed successfully!');
    console.log('');

    // Show backup info
    console.log('Backup Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  File: ${path.basename(backupPath)}`);
    console.log(`  Location: ${path.dirname(backupPath)}`);
    console.log(`  Time: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (error) {
    console.log('');
    log.error('Backup failed!');
    log.error(error.message);
    console.log('');

    if (process.env.DEBUG === 'true') {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run backup
runBackup();
