/**
 * Cleanup Scheduler
 *
 * Automatic cleanup of old files and expired data
 * Runs daily to prevent storage bloat
 */

const cron = require('node-cron');
const imageGenerator = require('../utils/imageGenerator');
const pdfGenerator = require('../utils/pdfGenerator');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// Optional service - may not exist in all installations
let reportExportService = null;
try {
  reportExportService = require('../services/reportExportService');
} catch (e) {
  logger.debug('reportExportService not available');
}

class CleanupScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Start all cleanup jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Cleanup scheduler already running');
      return;
    }

    logger.info('Starting cleanup scheduler...');

    // Daily cleanup at 2 AM
    this.scheduleDailyCleanup();

    // Hourly cache cleanup
    this.scheduleHourlyCache();

    // Weekly deep cleanup (Sundays at 3 AM)
    this.scheduleWeeklyDeepCleanup();

    this.isRunning = true;
    logger.info('Cleanup scheduler started', { jobs: this.jobs.length });
  }

  /**
   * Stop all cleanup jobs
   */
  stop() {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Cleanup scheduler stopped');
  }

  /**
   * Schedule daily cleanup
   * @private
   */
  scheduleDailyCleanup() {
    // Run daily at 2 AM
    const job = cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily cleanup...');

      try {
        const results = await this.runDailyCleanup();
        logger.info('Daily cleanup completed', results);
      } catch (error) {
        logger.error('Daily cleanup failed', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Daily cleanup job scheduled (2:00 AM)');
  }

  /**
   * Schedule hourly cache cleanup
   * @private
   */
  scheduleHourlyCache() {
    // Run every hour at minute 30
    const job = cron.schedule('30 * * * *', () => {
      logger.debug('Running hourly cache cleanup...');

      try {
        const stats = cache.getStats();
        logger.debug('Cache stats before cleanup', stats);

        // Cache cleanup happens automatically via node-cache
        // Just log the stats

        logger.debug('Hourly cache cleanup completed');
      } catch (error) {
        logger.error('Cache cleanup failed', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Hourly cache cleanup scheduled');
  }

  /**
   * Schedule weekly deep cleanup
   * @private
   */
  scheduleWeeklyDeepCleanup() {
    // Run Sundays at 3 AM
    const job = cron.schedule('0 3 * * 0', async () => {
      logger.info('Running weekly deep cleanup...');

      try {
        const results = await this.runWeeklyCleanup();
        logger.info('Weekly deep cleanup completed', results);
      } catch (error) {
        logger.error('Weekly cleanup failed', { error: error.message });
      }
    });

    this.jobs.push(job);
    logger.info('Weekly deep cleanup scheduled (Sunday 3:00 AM)');
  }

  /**
   * Run daily cleanup tasks
   * @returns {Promise<Object>} Cleanup results
   */
  async runDailyCleanup() {
    const results = {
      charts: 0,
      pdfs: 0,
      exports: 0,
      errors: [],
    };

    try {
      // Clean old chart files (older than 7 days)
      results.charts = await imageGenerator.cleanOldCharts(7);
    } catch (error) {
      results.errors.push({ task: 'charts', error: error.message });
      logger.error('Failed to clean charts', { error: error.message });
    }

    try {
      // Clean old PDF files (older than 7 days)
      results.pdfs = await pdfGenerator.cleanOldPDFs(7);
    } catch (error) {
      results.errors.push({ task: 'pdfs', error: error.message });
      logger.error('Failed to clean PDFs', { error: error.message });
    }

    try {
      // Clean old export files (older than 7 days) - if service available
      if (reportExportService) {
        results.exports = await reportExportService.cleanOldExports(7);
      }
    } catch (error) {
      results.errors.push({ task: 'exports', error: error.message });
      logger.error('Failed to clean exports', { error: error.message });
    }

    // Clear cache during cleanup

    return results;
  }

  /**
   * Run weekly cleanup tasks
   * @returns {Promise<Object>} Cleanup results
   */
  async runWeeklyCleanup() {
    const results = {
      ...(await this.runDailyCleanup()),
      oldLogs: 0,
      orphanedFiles: 0,
    };

    try {
      // Clean old audit logs (older than 90 days)
      results.oldLogs = await this.cleanOldLogs(90);
    } catch (error) {
      results.errors.push({ task: 'logs', error: error.message });
      logger.error('Failed to clean logs', { error: error.message });
    }

    try {
      // Clean orphaned transaction attachments
      results.orphanedFiles = await this.cleanOrphanedAttachments();
    } catch (error) {
      results.errors.push({ task: 'attachments', error: error.message });
      logger.error('Failed to clean orphaned attachments', { error: error.message });
    }

    // Flush entire cache
    cache.flush();

    // Optimize database
    await this.optimizeDatabase();

    return results;
  }

  /**
   * Clean old audit logs
   * @param {number} daysOld - Days to keep
   * @returns {Promise<number>} Number of deleted logs
   * @private
   */
  async cleanOldLogs(daysOld) {
    try {
      const knex = require('../database/connection');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await knex('audit_logs').where('created_at', '<', cutoffDate).delete();

      logger.info('Old audit logs cleaned', { deleted, daysOld });

      return deleted;
    } catch (error) {
      logger.error('Error cleaning audit logs', { error: error.message });
      return 0;
    }
  }

  /**
   * Clean orphaned file attachments
   * @returns {Promise<number>}
   * @private
   */
  async cleanOrphanedAttachments() {
    try {
      const knex = require('../database/connection');
      const fs = require('fs').promises;
      // // const path = require('path');

      // Get all attachment records
      const attachments = await knex('transaction_attachments').select('*');

      let cleaned = 0;

      for (const attachment of attachments) {
        // Check if transaction exists
        const transaction = await knex('transactions')
          .where({ id: attachment.transaction_id })
          .first();

        if (!transaction) {
          // Transaction deleted, remove attachment file and record
          try {
            await fs.unlink(attachment.file_path);
          } catch (err) {
            // File might already be deleted
          }

          await knex('transaction_attachments').where({ id: attachment.id }).delete();

          cleaned++;
        }
      }

      logger.info('Orphaned attachments cleaned', { cleaned });

      return cleaned;
    } catch (error) {
      logger.error('Error cleaning orphaned attachments', { error: error.message });
      return 0;
    }
  }

  /**
   * Optimize database
   * @private
   */
  async optimizeDatabase() {
    try {
      const knex = require('../database/connection');

      // SQLite optimization
      await knex.raw('VACUUM');
      await knex.raw('ANALYZE');

      logger.info('Database optimized');
    } catch (error) {
      logger.error('Database optimization failed', { error: error.message });
    }
  }

  /**
   * Run manual cleanup (for testing or admin trigger)
   * @returns {Promise<Object>}
   */
  async runManualCleanup() {
    logger.info('Running manual cleanup...');

    const results = await this.runDailyCleanup();

    logger.info('Manual cleanup completed', results);

    return results;
  }

  /**
   * Get cleanup statistics
   * @returns {Object}
   */
  getStats() {
    return {
      running: this.isRunning,
      scheduledJobs: this.jobs.length,
      jobs: [
        { name: 'Daily Cleanup', schedule: '2: 00 AM daily', status: 'active' },
        { name: 'Cache Cleanup', schedule: 'Every hour at : 30', status: 'active' },
        { name: 'Weekly Deep Cleanup', schedule: 'Sunday 3:00 AM', status: 'active' },
      ],
    };
  }
}

// Create singleton
const cleanupScheduler = new CleanupScheduler();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  cleanupScheduler.start();
}

module.exports = cleanupScheduler;
