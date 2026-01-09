// File: src/app.js

/**
 * Main Application
 *
 * Purpose: Entry point. Initialize Database, Bot, and Schedulers.
 */

const config = require('./config/app');
const logger = require('./utils/logger');
require('./database/connection');
const botClient = require('./bot/client');
const notificationService = require('./services/notificationService');

// Schedulers
const dailyReportScheduler = require('./schedulers/dailyReportScheduler');
const backupScheduler = require('./schedulers/backupScheduler');

// Global Error Handling
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { error: err.message });
  process.exit(1);
});

const start = async () => {
  try {
    // 1. Startup Banner
    console.log('══════════════════════════════════════════════════════════');
    console.log(`🤖 ${config.app.name} v${config.app.version}`);
    console.log(`🌍 Environment: ${config.app.env}`);
    console.log(`📱 Bot Phone: ${config.bot.phoneNumber}`);
    console.log(`🔄 Auth Method: ${config.bot.authMethod.toUpperCase()}`);
    console.log('══════════════════════════════════════════════════════════');

    // 2. Check Database Connection
    // (Managed by connection.js automatically on require, but we can double check)
    // await db.raw('SELECT 1'); // handled in connection.js

    // 3. Initialize WhatsApp Client
    const client = botClient.initialize();

    // 4. Link Notification Service
    notificationService.setClient(client);

    // 5. Initialize Schedulers
    dailyReportScheduler.initialize();
    backupScheduler.initialize();

    // 6. Ready
    logger.info('🚀 System initialization completed. Waiting for WhatsApp authentication...');
  } catch (error) {
    logger.error('❌ Failed to start application', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

start();

// Graceful Shutdown
const shutdown = () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  // client.destroy(); // if supported
  // db.destroy();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
