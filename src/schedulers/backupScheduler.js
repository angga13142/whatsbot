/**
 * Backup Scheduler
 *
 * Automatically backs up database
 * Runs at configured interval (default: daily)
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const config = require('../config/app');

const execAsync = promisify(exec);

class BackupScheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    try {
      // Only start if auto backup is enabled
      if (!config.backup.enabled) {
        logger.info('Auto backup is disabled');
        return;
      }

      const intervalHours = config.backup.intervalHours;

      // Convert hours to cron expression
      let cronExpression;
      if (intervalHours === 24) {
        // Daily at 2 AM
        cronExpression = '0 2 * * *';
      } else if (intervalHours === 12) {
        // Twice daily at 2 AM and 2 PM
        cronExpression = '0 2,14 * * *';
      } else {
        // Every N hours
        cronExpression = `0 */${intervalHours} * * *`;
      }

      logger.info('Starting backup scheduler', {
        schedule: cronExpression,
        intervalHours,
      });

      this.task = cron.schedule(
        cronExpression,
        async () => {
          await this.runBackup();
        },
        {
          timezone: config.business.timezone,
        }
      );

      this.isRunning = true;
      logger.info('Backup scheduler started successfully');
    } catch (error) {
      logger.error('Failed to start backup scheduler', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Run backup
   */
  async runBackup() {
    try {
      logger.info('Running database backup...');

      // Run backup script
      const { stdout, stderr } = await execAsync('node scripts/backup.js');

      if (stderr) {
        logger.warn('Backup script warnings', { stderr });
      }

      logger.info('Database backup completed successfully', { stdout });
    } catch (error) {
      logger.error('Error running backup', {
        error: error.message,
      });
      // Don't throw - let scheduler continue
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.isRunning = false;
      logger.info('Backup scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   * @returns {boolean} True if running
   */
  getStatus() {
    return this.isRunning;
  }

  /**
   * Manual trigger (for testing)
   */
  async triggerManually() {
    logger.info('Manually triggering backup');
    await this.runBackup();
  }
}

module.exports = new BackupScheduler();
