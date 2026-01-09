/**
 * Daily Report Scheduler
 *
 * Automatically sends daily reports to admins
 * Runs at configured time (default: 18:00)
 */

const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const config = require('../config/app');
const dayjs = require('dayjs');

class DailyReportScheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    try {
      // Parse time from config (format: HH:mm)
      const [hour, minute] = config.business.dailyReportTime.split(':');

      // Create cron expression (minute hour * * *)
      const cronExpression = `${minute} ${hour} * * *`;

      logger.info('Starting daily report scheduler', {
        schedule: cronExpression,
        time: config.business.dailyReportTime,
      });

      // Schedule task
      this.task = cron.schedule(
        cronExpression,
        async () => {
          await this.runDailyReport();
        },
        {
          timezone: config.business.timezone,
        }
      );

      this.isRunning = true;
      logger.info('Daily report scheduler started successfully');
    } catch (error) {
      logger.error('Failed to start daily report scheduler', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Run daily report generation and distribution
   */
  async runDailyReport() {
    try {
      logger.info('Running daily report.. .');

      const yesterday = dayjs().subtract(1, 'day').toDate();

      // Send daily report
      await notificationService.sendDailyReport(yesterday);

      logger.info('Daily report completed successfully');
    } catch (error) {
      logger.error('Error running daily report', {
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
      logger.info('Daily report scheduler stopped');
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
    logger.info('Manually triggering daily report');
    await this.runDailyReport();
  }
}

module.exports = new DailyReportScheduler();
