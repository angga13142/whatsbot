#!/usr/bin/env node

/**
 * Database Migration Script
 *
 * Runs database migrations to create/update database schema.
 *
 * Usage:
 *   node scripts/migrate.js
 *   npm run migrate
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Colors for console output
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
 * Database configuration based on DB_TYPE
 */
function getDatabaseConfig() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'sqlite') {
    return {
      client: 'sqlite3',
      connection: {
        filename: process.env.DB_PATH || './storage/database.sqlite',
      },
      useNullAsDefault: true,
      migrations: {
        directory: path.join(__dirname, '../src/database/migrations'),
        tableName: 'knex_migrations',
      },
    };
  }

  if (dbType === 'postgresql') {
    return {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cashflow_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: parseInt(process.env.DB_POOL_MIN) || 2,
        max: parseInt(process.env.DB_POOL_MAX) || 10,
      },
      migrations: {
        directory: path.join(__dirname, '../src/database/migrations'),
        tableName: 'knex_migrations',
      },
    };
  }

  throw new Error(`Unsupported database type: ${dbType}`);
}

/**
 * Run migrations
 */
async function runMigrations() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🗄️  Database Migration                             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Check if migrations directory exists
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      log.warning('Migrations directory does not exist');
      log.info('Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      log.success('Migrations directory created');
    }

    // Get database configuration
    const config = getDatabaseConfig();
    log.info(`Database type: ${process.env.DB_TYPE || 'sqlite'}`);

    // Initialize Knex
    const knex = require('knex')(config);

    // Check connection
    log.step('Testing database connection...');
    await knex.raw('SELECT 1');
    log.success('Database connection successful');

    // Get migration files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.js'))
      .sort();

    if (migrationFiles.length === 0) {
      log.warning('No migration files found');
      log.info('Create migration files in:  src/database/migrations/');
      await knex.destroy();
      return;
    }

    log.info(`Found ${migrationFiles.length} migration file(s)`);
    console.log('');

    // Run migrations
    log.step('Running migrations...');
    const [batchNo, migrationsList] = await knex.migrate.latest();

    console.log('');

    if (migrationsList.length === 0) {
      log.success('Database is already up to date');
    } else {
      log.success(`Batch ${batchNo} run:  ${migrationsList.length} migration(s)`);
      migrationsList.forEach((migration) => {
        log.success(`  - ${migration}`);
      });
    }

    console.log('');
    log.success('Migration completed successfully!');

    // Close database connection
    await knex.destroy();
  } catch (error) {
    console.log('');
    log.error('Migration failed! ');
    log.error(error.message);
    console.log('');

    if (process.env.DEBUG === 'true') {
      console.error(error);
    }

    process.exit(1);
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  try {
    const config = getDatabaseConfig();
    const knex = require('knex')(config);

    const [completed, pending] = await Promise.all([
      knex.migrate.list(),
      knex.migrate.list().then(([comp, pend]) => pend),
    ]);

    console.log('');
    console.log('Migration Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (completed[0].length > 0) {
      console.log('');
      log.success(`Completed: ${completed[0].length}`);
      completed[0].forEach((name) => {
        console.log(`  ✓ ${name}`);
      });
    }

    if (pending && pending.length > 0) {
      console.log('');
      log.warning(`Pending: ${pending.length}`);
      pending.forEach((name) => {
        console.log(`  ○ ${name}`);
      });
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await knex.destroy();
  } catch (error) {
    log.error('Failed to get migration status');
    log.error(error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Run appropriate command
if (command === 'status') {
  showStatus();
} else {
  runMigrations();
}
