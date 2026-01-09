// File: src/database/connection.js

const knex = require('knex');
const config = require('../config/database');
const logger = require('../utils/logger');

// 1. Read DB_TYPE and configure
const dbType = process.env.DB_TYPE || 'sqlite';
let dbConfig;

if (process.env.NODE_ENV === 'test') {
  dbConfig = config.test;
} else if (config[dbType]) {
  // If user provided 'development' or 'production' as DB_TYPE (unlikely but possible)
  dbConfig = config[dbType];
} else {
  // Fallback to active config calculated in config/database.js
  dbConfig = config.active;
}

// 2. Initialize Knex instance
const db = knex(dbConfig);

// 3. Test connection on startup
db.raw('SELECT 1')
  .then(() => {
    logger.info(`✅ Database connected successfully (${dbType})`);
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
