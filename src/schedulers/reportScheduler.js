/**
 * Report Scheduler
 *
 * Cron job for scheduled report delivery
 */

const cron = require('node-cron');
const scheduledReportService = require('../services/scheduledReportService');
const recurringTransactionService = require('../services/recurringTransactionService');
const logger = require('../utils/logger');

class ReportScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    logger.info('Starting report scheduler...');

    // Process scheduled reports every hour
    this.scheduleReportProcessing();

    // Process recurring transactions every hour
    this.scheduleRecurringProcessing();

    // Send daily summary reports (8 AM)
    this.scheduleDailySummary();

    // Weekly digest (Monday 9 AM)
    this.scheduleWeeklyDigest();

    // Monthly report (1st of month, 9 AM)
    this.scheduleMonthlyReport();

    logger.info('Report scheduler started', {
      activeJobs: this.jobs.length,
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    logger.info('Report scheduler stopped');
  }

  /**
   * Schedule report processing (every hour)
   * @private
   */
  scheduleReportProcessing() {
    const job = cron.schedule('0 * * * *', async () => {
      logger.info('Processing due scheduled reports...');

      try {
        const results = await scheduledReportService.processDueSchedules();

        logger.info('Scheduled reports processed', results);
      } catch (error) {
        logger.error('Error processing scheduled reports', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Report processing job scheduled (hourly)');
  }

  /**
   * Schedule recurring transaction processing
   * @private
   */
  scheduleRecurringProcessing() {
    const job = cron.schedule('0 * * * *', async () => {
      logger.info('Processing due recurring transactions...');

      try {
        const results = await recurringTransactionService.processDueRecurringTransactions();

        logger.info('Recurring transactions processed', results);

        // Send reminders
        await recurringTransactionService.sendUpcomingReminders();
      } catch (error) {
        logger.error('Error processing recurring transactions', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Recurring transaction processing job scheduled (hourly)');
  }

  /**
   * Schedule daily summary (8 AM)
   * @private
   */
  scheduleDailySummary() {
    const job = cron.schedule('0 8 * * *', async () => {
      logger.info('Generating daily summaries...');

      try {
        // Get all active daily schedules
        const knex = require('../database/connection');

        const dailySchedules = await knex('scheduled_reports').where({
          frequency: 'daily',
          status: 'active',
        });

        for (const schedule of dailySchedules) {
          try {
            await scheduledReportService._executeSchedule(schedule);
            logger.info('Daily summary sent', { scheduleId: schedule.id });
          } catch (error) {
            logger.error('Error sending daily summary', {
              scheduleId: schedule.id,
              error: error.message,
            });
          }
        }
      } catch (error) {
        logger.error('Error in daily summary job', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Daily summary job scheduled (8 AM)');
  }

  /**
   * Schedule weekly digest (Monday 9 AM)
   * @private
   */
  scheduleWeeklyDigest() {
    const job = cron.schedule('0 9 * * 1', async () => {
      logger.info('Generating weekly digests...');

      try {
        const knex = require('../database/connection');

        const weeklySchedules = await knex('scheduled_reports').where({
          frequency: 'weekly',
          status: 'active',
        });

        for (const schedule of weeklySchedules) {
          try {
            await scheduledReportService._executeSchedule(schedule);
            logger.info('Weekly digest sent', { scheduleId: schedule.id });
          } catch (error) {
            logger.error('Error sending weekly digest', {
              scheduleId: schedule.id,
              error: error.message,
            });
          }
        }
      } catch (error) {
        logger.error('Error in weekly digest job', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Weekly digest job scheduled (Monday 9 AM)');
  }

  /**
   * Schedule monthly report (1st of month, 9 AM)
   * @private
   */
  scheduleMonthlyReport() {
    const job = cron.schedule('0 9 1 * *', async () => {
      logger.info('Generating monthly reports...');

      try {
        const knex = require('../database/connection');

        const monthlySchedules = await knex('scheduled_reports').where({
          frequency: 'monthly',
          status: 'active',
        });

        for (const schedule of monthlySchedules) {
          try {
            await scheduledReportService._executeSchedule(schedule);
            logger.info('Monthly report sent', { scheduleId: schedule.id });
          } catch (error) {
            logger.error('Error sending monthly report', {
              scheduleId: schedule.id,
              error: error.message,
            });
          }
        }
      } catch (error) {
        logger.error('Error in monthly report job', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Monthly report job scheduled (1st of month, 9 AM)');
  }

  /**
   * Get job status
   * @returns {Object} Status info
   */
  getStatus() {
    return {
      running: this.jobs.length > 0,
      activeJobs: this.jobs.length,
      jobs: [
        { name: 'Report Processing', schedule: 'Hourly', status: 'active' },
        { name: 'Recurring Transactions', schedule: 'Hourly', status: 'active' },
        { name: 'Daily Summary', schedule: '8:00 AM', status: 'active' },
        { name: 'Weekly Digest', schedule: 'Monday 9:00 AM', status: 'active' },
        { name: 'Monthly Report', schedule: '1st of month 9:00 AM', status: 'active' },
      ],
    };
  }
}

// Create singleton instance
const reportScheduler = new ReportScheduler();

// Start scheduler if not in test environment
if (process.env.NODE_ENV !== 'test') {
  reportScheduler.start();
}

module.exports = reportScheduler;
