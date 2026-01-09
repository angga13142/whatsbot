/**
 * Main Application Entry Point
 *
 * Initializes all components and starts the bot
 */

const dotenv = require('dotenv');
const chalk = require('chalk');
const boxen = require('boxen');

// Load environment variables first
dotenv.config();

// Import modules
const config = require('./config/app');
const logger = require('./utils/logger');
const dbConnection = require('./database/connection');
const whatsappClient = require('./bot/client');
const dailyReportScheduler = require('./schedulers/dailyReportScheduler');
const backupScheduler = require('./schedulers/backupScheduler');
const reportScheduler = require('./schedulers/reportScheduler');
const cleanupScheduler = require('./schedulers/cleanupScheduler');

/**
 * Display startup banner
 */
function displayBanner() {
  console.log('\n');
  console.log(
    boxen(
      chalk.bold.cyan('💰 WHATSAPP CASHFLOW BOT\n\n') +
        chalk.white(`Version: ${config.app.version}\n`) +
        chalk.gray(`Environment: ${config.app.environment}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    )
  );
  console.log('\n');
}

/**
 * Initialize database
 */
async function initializeDatabase() {
  try {
    logger.info('Initializing database.. .');
    console.log(chalk.cyan('📦 Initializing database...'));

    // Test connection
    await dbConnection.raw('SELECT 1');

    // Run migrations
    try {
      const [batchNo, migrations] = await dbConnection.migrate.latest();
      if (migrations.length > 0) {
        logger.info(`Ran ${migrations.length} migration(s) in batch ${batchNo}`);
        console.log(chalk.green(`   ✅ Ran ${migrations.length} migration(s)`));
      } else {
        console.log(chalk.green('   ✅ Database is up to date'));
      }
    } catch (migrationError) {
      logger.warn('Migration check failed (may be normal on first run)', {
        error: migrationError.message,
      });
    }

    logger.info('Database initialized successfully');
    console.log(chalk.green('✅ Database ready\n'));

    return true;
  } catch (error) {
    logger.error('Failed to initialize database', { error: error.message });
    console.log(chalk.red('❌ Database initialization failed'));
    console.log(chalk.red(`   Error: ${error.message}\n`));
    throw error;
  }
}

/**
 * Initialize WhatsApp client
 */
async function initializeWhatsApp() {
  try {
    logger.info('Initializing WhatsApp client...');
    console.log(chalk.cyan('📱 Initializing WhatsApp client...'));

    await whatsappClient.initialize();

    logger.info('WhatsApp client initialized');

    return true;
  } catch (error) {
    logger.error('Failed to initialize WhatsApp client', { error: error.message });
    console.log(chalk.red('❌ WhatsApp initialization failed'));
    console.log(chalk.red(`   Error: ${error.message}\n`));
    throw error;
  }
}

/**
 * Initialize schedulers
 */
function initializeSchedulers() {
  try {
    logger.info('Initializing schedulers...');
    console.log(chalk.cyan('⏰ Initializing schedulers... '));

    // Start daily report scheduler
    dailyReportScheduler.start();
    console.log(chalk.green(`   ✅ Daily report:  ${config.business.dailyReportTime}`));

    // Start general    // Start schedulers
    reportScheduler.start();
    cleanupScheduler.start();
    console.log(chalk.green('   ✅ Report Scheduler: Active'));

    // Start backup scheduler (if enabled)
    if (config.backup.enabled) {
      backupScheduler.start();
      console.log(chalk.green(`   ✅ Auto backup: Every ${config.backup.intervalHours}h`));
    } else {
      console.log(chalk.gray('   ⏭️  Auto backup:  Disabled'));
    }

    console.log(chalk.green('✅ Schedulers ready\n'));

    logger.info('Schedulers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize schedulers', { error: error.message });
    console.log(chalk.yellow('⚠️  Schedulers initialization failed (non-critical)\n'));
    // Don't throw - schedulers are non-critical
  }
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log('\n');
    logger.info(`Received ${signal}, shutting down gracefully...`);
    console.log(chalk.yellow(`\n⚠️  Received ${signal}, shutting down.. .\n`));

    try {
      // Stop schedulers
      console.log(chalk.cyan('⏰ Stopping schedulers... '));
      dailyReportScheduler.stop();
      reportScheduler.stop();
      backupScheduler.stop();
      console.log(chalk.green('✅ Schedulers stopped\n'));

      // Close WhatsApp client
      console.log(chalk.cyan('📱 Closing WhatsApp connection...'));
      await whatsappClient.destroy();
      console.log(chalk.green('✅ WhatsApp closed\n'));

      // Close database
      console.log(chalk.cyan('📦 Closing database connection...'));
      await dbConnection.destroy();
      console.log(chalk.green('✅ Database closed\n'));

      logger.info('Graceful shutdown completed');
      console.log(chalk.green('👋 Goodbye!\n'));

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      console.log(chalk.red('❌ Error during shutdown\n'));
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    console.log(chalk.red('\n❌ Uncaught exception: '), error.message);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    console.log(chalk.red('\n❌ Unhandled rejection:'), reason);
  });
}

/**
 * Main application startup
 */
async function start() {
  try {
    // Display banner
    displayBanner();

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Initialize components
    await initializeDatabase();
    await initializeWhatsApp();
    initializeSchedulers();

    // Display ready status (will be called by event handler)
    // displayReadyStatus() is called in eventHandler. onReady()

    logger.info('Application started successfully', {
      version: config.app.version,
      environment: config.app.environment,
    });
  } catch (error) {
    logger.error('Failed to start application', {
      error: error.message,
      stack: error.stack,
    });

    console.log('\n');
    console.log(
      boxen(
        chalk.bold.red('❌ STARTUP FAILED\n\n') +
          chalk.white('Error:\n') +
          chalk.gray(error.message),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'red',
        }
      )
    );
    console.log('\n');

    process.exit(1);
  }
}

// Start the application
start();
