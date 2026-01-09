/**
 * Database Configuration
 *
 * Provides knex configuration based on environment
 */

const path = require('path');

module.exports = {
  /**
   * Get database configuration
   * @returns {Object} Knex configuration
   */
  getDatabaseConfig() {
    const dbType = process.env.DB_TYPE || 'sqlite';

    // Development / SQLite (Using 'sqlite3' as tested working driver)
    if (dbType === 'sqlite') {
      return {
        client: 'sqlite3',
        connection: {
          filename: process.env.DB_PATH || './storage/database.sqlite',
        },
        useNullAsDefault: true,
        migrations: {
          directory: path.join(__dirname, '../database/migrations'),
          tableName: 'knex_migrations',
        },
        seeds: {
          directory: path.join(__dirname, '../database/seeds'),
        },
      };
    }

    // Production / PostgreSQL
    if (dbType === 'postgresql') {
      return {
        client: 'pg',
        connection: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
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
          directory: path.join(__dirname, '../database/migrations'),
          tableName: 'knex_migrations',
        },
        seeds: {
          directory: path.join(__dirname, '../database/seeds'),
        },
      };
    }

    throw new Error(`Unsupported database type: ${dbType}`);
  },
};
