// File: src/config/app.js

/**
 * Application Configuration
 *
 * Purpose: Load and validate environment variables.
 * specific configuration for business logic, and bot settings.
 *
 * @module config/app
 */

require('dotenv').config();

const config = {
  // Application Info
  app: {
    name: process.env.APP_NAME || 'WhatsApp Cashflow Bot',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
  },

  // WhatsApp Bot Settings
  bot: {
    phoneNumber: process.env.BOT_PHONE_NUMBER,
    authMethod: process.env.AUTH_METHOD || 'pairing', // 'qr' or 'pairing'
    puppeteer: {
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      args: (process.env.PUPPETEER_ARGS || '').split(','),
    },
  },

  // Database Settings
  database: {
    type: process.env.DB_TYPE || 'sqlite', // 'sqlite' or 'postgresql'
  },

  // Security Settings
  security: {
    twoFaEnabled: process.env.TWO_FA_ENABLED === 'true',
    twoFaPinLength: parseInt(process.env.TWO_FA_PIN_LENGTH, 10) || 6,
    encryptionKey: process.env.ENCRYPTION_KEY,
    sessionSecret: process.env.SESSION_SECRET,
  },

  // Business Logic
  business: {
    autoApprovalThreshold: parseInt(process.env.AUTO_APPROVAL_THRESHOLD, 10) || 1000000,
    dailyReportTime: process.env.DAILY_REPORT_TIME || '18:00',
    timezone: process.env.TIMEZONE || 'Asia/Jakarta',
    currency: process.env.CURRENCY || 'IDR',
  },

  // Backup Settings
  backup: {
    enabled: process.env.AUTO_BACKUP_ENABLED === 'true',
    intervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS, 10) || 24,
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30,
    path: process.env.BACKUP_PATH || './storage/backups',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    path: process.env.LOG_PATH || './storage/logs',
  },
};

// Basic validation for required fields
if (!config.bot.phoneNumber) {
  console.warn('⚠️ WARNING: BOT_PHONE_NUMBER is not set in .env');
}

module.exports = config;
