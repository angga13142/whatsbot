// File: src/schedulers/backupScheduler.js

/**
 * Backup Scheduler
 *
 * Purpose: Schedule database backups.
 *
 * @module schedulers/backupScheduler
 */

const cron = require('node-cron');
const config = require('../config/app');
const logger = require('../utils/logger');
const { exec } = require('child_process');
const path = require('path');

module.exports = {
  initialize() {
    if (!config.backup.enabled) {
      logger.info('Backup scheduler is disabled.');
      return;
    }

    const intervalHours = config.backup.intervalHours;
    // Simple cron: run every N hours (e.g. "0 */24 * * *")
    // If 24, run at midnight
    const cronExpression = `0 */${intervalHours} * * *`;

    logger.info(`Scheduling Auto-Backup every ${intervalHours} hours`);

    cron.schedule(
      cronExpression,
      async () => {
        logger.info('⏳ Running Auto-Backup Job...');

        // Execute existing backup script
        const scriptPath = path.join(__dirname, '../../scripts/backup.js');

        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
          if (error) {
            logger.error(`Backup job failed: ${error.message}`);
            return;
          }
          if (stderr) {
            // logger.warn(`Backup stderr: ${stderr}`); // scripts might log to stderr for info
          }
          logger.info('✅ Auto-Backup Job Completed', { output: stdout.trim() });
        });
      },
      {
        timezone: config.business.timezone,
      }
    );
  },
};
