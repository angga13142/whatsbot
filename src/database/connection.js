// File: src/database/connection.js

const knex = require('knex');
const config = require('../config/database');
const logger = require('../utils/logger');

// 1. Read DB_TYPE and configure
let dbConfig;

// If config module has getDatabaseConfig method, use it
if (typeof config.getDatabaseConfig === 'function') {
  dbConfig = config.getDatabaseConfig();

  // Override for test environment if needed
  if (process.env.NODE_ENV === 'test') {
    dbConfig.connection = {
      filename: ':memory:',
    };
  }
} else {
  // Fallback for legacy config structure (development/production keys)
  const env = process.env.NODE_ENV || 'development';
  dbConfig = config[env];
}

// 2. Initialize Knex instance
const db = knex(dbConfig);

// 2.5. Enable foreign keys for SQLite
if (dbConfig.client === 'sqlite3') {
  db.raw('PRAGMA foreign_keys = ON').catch((error) => {
    logger.warn('Failed to enable foreign keys', { error: error.message });
  });
}

// 3. Test connection on startup
db.raw('SELECT 1')
  .then(() => {
    logger.info(`✅ Database connected successfully (${dbConfig.client})`);
  })
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  });

/**
 * Health Check Function
 * @returns {Promise<boolean>}
 */
db.healthCheck = async function () {
  try {
    await this.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Health check failed:', error.message);
    return false;
  }
};

/**
 * Graceful Shutdown Function
 */
db.gracefulShutdown = async function () {
  try {
    await this.destroy();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await db.gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.gracefulShutdown();
  process.exit(0);
});

// 4. Export knex instance
module.exports = db;
