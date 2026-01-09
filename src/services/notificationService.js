/**
 * Notification Service
 *
 * Business logic for sending notifications to users
 */

const whatsappClient = require('../bot/client');
const logger = require('../utils/logger');
const transactionTemplate = require('../templates/messages/transactionTemplate');
const reportTemplate = require('../templates/messages/reportTemplate');
const userRepository = require('../database/repositories/userRepository');
const { ROLES } = require('../utils/constants');

class NotificationService {
  /**
   * Notify transaction created
   * @param {Object} transaction - Transaction object
   */
  async notifyTransactionCreated(transaction) {
    try {
      const user = await userRepository.findById(transaction.user_id);
      if (!user) {
        return;
      }

      const message = transactionTemplate.transactionCreated(transaction);
      // Ensure client is ready before sending
      if (whatsappClient.isClientReady()) {
        await whatsappClient.sendMessage(user.phone_number, message);
        logger.info('Transaction created notification sent', {
          transactionId: transaction.transaction_id,
          userId: user.id,
        });
      } else {
        logger.warn('Client not ready, skipping notification', { userId: user.id });
      }
    } catch (error) {
      logger.error('Error sending transaction created notification', {
        error: error.message,
      });
      // Don't throw - notification failures shouldn't break the flow
    }
  }

  /**
   * Notify transaction approved
   * @param {Object} transaction - Transaction object
   */
  async notifyTransactionApproved(transaction) {
    try {
      const user = await userRepository.findById(transaction.user_id);
      if (!user) {
        return;
      }

      const message = transactionTemplate.transactionApproved(transaction);
      if (whatsappClient.isClientReady()) {
        await whatsappClient.sendMessage(user.phone_number, message);
        logger.info('Transaction approved notification sent', {
          transactionId: transaction.transaction_id,
          userId: user.id,
        });
      }
    } catch (error) {
      logger.error('Error sending transaction approved notification', {
        error: error.message,
      });
    }
  }

  /**
   * Notify transaction rejected
   * @param {Object} transaction - Transaction object
   * @param {string} reason - Rejection reason
   */
  async notifyTransactionRejected(transaction, reason) {
    try {
      const user = await userRepository.findById(transaction.user_id);
      if (!user) {
        return;
      }

      const message = transactionTemplate.transactionRejected(transaction, reason);
      if (whatsappClient.isClientReady()) {
        await whatsappClient.sendMessage(user.phone_number, message);
        logger.info('Transaction rejected notification sent', {
          transactionId: transaction.transaction_id,
          userId: user.id,
        });
      }
    } catch (error) {
      logger.error('Error sending transaction rejected notification', {
        error: error.message,
      });
    }
  }

  /**
   * Send daily report to admins
   * @param {Date} date - Report date
   */
  async sendDailyReport(date) {
    try {
      const reportService = require('./reportService');
      const report = await reportService.generateDailyReport(date);

      // Get all admins and superadmins
      const admins = await userRepository.findByRole(ROLES.ADMIN);
      const superadmins = await userRepository.findByRole(ROLES.SUPERADMIN);
      const recipients = [...admins, ...superadmins];

      const message = reportTemplate.dailyReportSummary(report);

      if (whatsappClient.isClientReady()) {
        for (const user of recipients) {
          await whatsappClient.sendMessage(user.phone_number, message);
          logger.info('Daily report sent', { userId: user.id, date });
        }
      }
    } catch (error) {
      logger.error('Error sending daily report', {
        date,
        error: error.message,
      });
    }
  }

  /**
   * Send alert to specific user
   * @param {number} userId - User ID
   * @param {string} message - Alert message
   */
  async sendAlert(userId, message) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const alertMessage = `🚨 *ALERT*\n\n${message}`;
      if (whatsappClient.isClientReady()) {
        await whatsappClient.sendMessage(user.phone_number, alertMessage);
        logger.info('Alert sent', { userId, message });
      }
    } catch (error) {
      logger.error('Error sending alert', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Notify user suspended
   * @param {number} userId - User ID
   * @param {string} reason - Suspension reason
   */
  async notifyUserSuspended(userId, reason) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return;
      }

      const message =
        `⚠️ *AKUN DITANGGUHKAN*\n\n` +
        `Akun Anda telah ditangguhkan.\n` +
        `Alasan: ${reason}\n\n` +
        `Hubungi admin untuk informasi lebih lanjut.`;

      if (whatsappClient.isClientReady()) {
        await whatsappClient.sendMessage(user.phone_number, message);
        logger.info('User suspended notification sent', { userId });
      }
    } catch (error) {
      logger.error('Error sending user suspended notification', {
        error: error.message,
      });
    }
  }

  /**
   * Notify role changed
   * @param {number} userId - User ID
   * @param {string} oldRole - Old role
   * @param {string} newRole - New role
   */
  async notifyRoleChanged(userId, oldRole, newRole) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return;
      }

      const message =
        `✅ *ROLE BERUBAH*\n\n` +
        `Role Anda telah diubah:\n` +
        `• Sebelumnya: ${oldRole}\n` +
        `• Sekarang: ${newRole}\n\n` +
        `Ketik /help untuk melihat perintah yang tersedia.`;

      if (whatsappClient.isClientReady()) {
        await whatsappClient.sendMessage(user.phone_number, message);
        logger.info('Role changed notification sent', { userId, oldRole, newRole });
      }
    } catch (error) {
      logger.error('Error sending role changed notification', {
        error: error.message,
      });
    }
  }
}

module.exports = new NotificationService();
