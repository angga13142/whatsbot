// File: src/schedulers/dailyReportScheduler.js

/**
 * Daily Report Scheduler
 *
 * Purpose: Schedule automatic daily reports generation and sending.
 *
 * @module schedulers/dailyReportScheduler
 */

const cron = require('node-cron');
const config = require('../config/app');
const logger = require('../utils/logger');
const reportService = require('../services/reportService');
const { dailyReportSummary } = require('../templates/messages/reportTemplate');
const { ROLES } = require('../utils/constants');
const userRepository = require('../database/repositories/userRepository');
const notificationService = require('../services/notificationService');

module.exports = {
  initialize() {
    const time = config.business.dailyReportTime; // e.g., '18:00'
    const [hour, minute] = time.split(':');

    // Schedule: "MM HH * * *"
    const cronExpression = `${minute} ${hour} * * *`;

    logger.info(`Scheduling Daily Report at ${time} (${config.business.timezone})`);

    cron.schedule(
      cronExpression,
      async () => {
        logger.info('⏳ Running Daily Report Job...');

        try {
          // 1. Generate Report
          const reportData = await reportService.generateDailyReport();
          const message = dailyReportSummary(reportData);

          // 2. Get Recipients (Admins & Superadmins)
          // In real app, maybe only active ones
          // Fetch admins
          const admins = await userRepository.listAll({ role: ROLES.ADMIN });
          const superadmins = await userRepository.listAll({ role: ROLES.SUPERADMIN });
          const recipients = [...admins, ...superadmins];

          logger.info(`Sending daily report to ${recipients.length} admins`);

          // 3. Send
          for (const user of recipients) {
            await notificationService.sendToUser(user.phone_number, message);
          }

          logger.info('✅ Daily Report Job Completed');
        } catch (error) {
          logger.error('Failed to run daily report job', { error: error.message });
        }
      },
      {
        timezone: config.business.timezone,
      }
    );
  },
};
