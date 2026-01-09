#!/usr/bin/env node

/**
 * Database Seeding Script
 *
 * Seeds the database with initial/test data.
 *
 * Usage:
 *   node scripts/seed.js
 *   npm run seed
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

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
 * Database configuration
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
    };
  }

  throw new Error(`Unsupported database type: ${dbType}`);
}

/**
 * Create default superadmin user
 */
async function createSuperadmin(knex) {
  log.step('Creating default superadmin...');

  const phoneNumber = process.env.SUPERADMIN_PHONE || '628123456789';
  const name = process.env.SUPERADMIN_NAME || 'Administrator';
  const pin = process.env.SUPERADMIN_PIN || '123456';

  // Check if superadmin already exists
  const existing = await knex('users').where({ phone_number: phoneNumber }).first();

  if (existing) {
    log.warning(`Superadmin already exists: ${phoneNumber}`);
    return;
  }

  // Hash PIN
  const hashedPin = await bcrypt.hash(pin, 10);

  // Insert superadmin
  await knex('users').insert({
    phone_number: phoneNumber,
    full_name: name,
    role: 'superadmin',
    status: 'active',
    pin: hashedPin,
    created_at: new Date(),
    updated_at: new Date(),
  });

  log.success(`Superadmin created: ${phoneNumber}`);
  log.info(`  Name: ${name}`);
  log.info(`  Role: superadmin`);
  log.info(`  PIN: ${pin} (Change this in production!)`);
}

/**
 * Create sample data (for development/testing)
 */
async function createSampleData(knex) {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    log.warning('Skipping sample data in production environment');
    return;
  }

  log.step('Creating sample data for development...');

  // Sample users
  const sampleUsers = [
    {
      phone_number: '628111111111',
      full_name: 'Budi Santoso',
      role: 'karyawan',
      status: 'active',
    },
    {
      phone_number: '628222222222',
      full_name: 'Siti Nurhaliza',
      role: 'karyawan',
      status: 'active',
    },
    {
      phone_number: '628333333333',
      full_name: 'Ahmad Dahlan',
      role: 'admin',
      status: 'active',
    },
    {
      phone_number: '628444444444',
      full_name: 'Investor Pertama',
      role: 'investor',
      status: 'active',
    },
  ];

  for (const user of sampleUsers) {
    const existing = await knex('users').where({ phone_number: user.phone_number }).first();

    if (!existing) {
      await knex('users').insert({
        ...user,
        created_at: new Date(),
        updated_at: new Date(),
      });
      log.success(`  Created user: ${user.full_name} (${user.role})`);
    }
  }

  log.success('Sample data created');
}

/**
 * Run seeds
 */
async function runSeeds() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🌱 Database Seeding                                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Get database configuration
    const config = getDatabaseConfig();
    log.info(`Database type: ${process.env.DB_TYPE || 'sqlite'}`);

    // Initialize Knex
    const knex = require('knex')(config);

    // Check connection
    log.step('Testing database connection...');
    await knex.raw('SELECT 1');
    log.success('Database connection successful');

    console.log('');

    // Create default superadmin
    await createSuperadmin(knex);

    console.log('');

    // Create sample data (only in development)
    await createSampleData(knex);

    console.log('');
    log.success('Seeding completed successfully!');

    // Close database connection
    await knex.destroy();
  } catch (error) {
    console.log('');
    log.error('Seeding failed!');
    log.error(error.message);
    console.log('');

    if (process.env.DEBUG === 'true') {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run seeds
runSeeds();
