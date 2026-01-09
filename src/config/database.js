// File: src/config/database.js

/**
 * Database Configuration
 *
 * Purpose: Knex.js configuration for SQLite and PostgreSQL.
 * defines connection settings, migrations, and seeds locations.
 *
 * @module config/database
 */

require('dotenv').config();
const path = require('path');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const MIGRATION_PATH = path.join(__dirname, '../database/migrations');
const SEED_PATH = path.join(__dirname, '../database/seeds');

// Common configuration
const commonConfig = {
  migrations: {
    directory: MIGRATION_PATH,
  },
  seeds: {
    directory: SEED_PATH,
  },
  useNullAsDefault: true,
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, cb) => {
      if (DB_TYPE === 'sqlite') {
        conn.run('PRAGMA foreign_keys = ON', cb);
      } else {
        cb(null, conn);
      }
    },
  },
};

// Configuration by environment/type
const config = {
  // Development (SQLite)
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_PATH || './storage/database.sqlite',
    },
    ...commonConfig,
  },

  // Production (PostgreSQL)
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'cashflow_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    ...commonConfig,
  },

  // Test (In-Memory SQLite)
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    ...commonConfig,
    pool: { min: 1, max: 1 },
  },
};

// Export based on active type or specific env request
// In runtime, we usually select based on DB_TYPE
const activeConfig = DB_TYPE === 'postgresql' ? config.production : config.development;

module.exports = {
  ...config, // Export full config object for knex cli
  active: activeConfig, // Export active config for app usage
};
