/**
 * Recurring Transaction Service
 *
 * Scheduled transaction automation and management
 */

const recurringTransactionRepository = require('../database/repositories/recurringTransactionRepository');
const auditRepository = require('../database/repositories/auditRepository');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class RecurringTransactionService {
  /**
   * Create recurring transaction
   * @param {Object} data - Recurring transaction data
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async createRecurringTransaction(data, userId) {
    try {
      // Validate required fields
      this._validateRecurringData(data);

      // Calculate first run date
      const nextRunDate = data.start_date;

      // Create recurring transaction
      const recurring = await recurringTransactionRepository.create({
        name: data.name,
        user_id: userId,
        type: data.type,
        category_id: data.category_id || null,
        amount: data.amount,
        currency: data.currency || 'IDR',
        description: data.description,
        frequency: data.frequency,
        interval: data.interval || 1,
        day_of_week: data.day_of_week || null,
        day_of_month: data.day_of_month || null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        occurrences: data.occurrences || null,
        status: 'active',
        next_run_date: nextRunDate,
        notify_before: data.notify_before !== false,
        notify_days_before: data.notify_days_before || 1,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      });

      // Log activity
      await auditRepository.log(
        userId,
        'create_recurring_transaction',
        'recurring_transaction',
        recurring.id,
        { name: recurring.name, frequency: recurring.frequency }
      );

      logger.info('Recurring transaction created', {
        recurringId: recurring.id,
        userId,
        frequency: recurring.frequency,
      });

      return recurring;
    } catch (error) {
      logger.error('Error creating recurring transaction', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get recurring transaction by ID
   * @param {number} id - Recurring transaction ID
   * @returns {Promise<Object>}
   */
  async getRecurringTransaction(id) {
    try {
      const recurring = await recurringTransactionRepository.findById(id);

      if (!recurring) {
        throw new Error('Transaksi berulang tidak ditemukan');
      }

      // Get history
      const history = await recurringTransactionRepository.getHistory(id, 10);

      return {
        ...recurring,
        history,
      };
    } catch (error) {
      logger.error('Error getting recurring transaction', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user's recurring transactions
   * @param {number} userId - User ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async getUserRecurringTransactions(userId, status = null) {
    try {
      return await recurringTransactionRepository.findByUser(userId, status);
    } catch (error) {
      logger.error('Error getting user recurring transactions', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update recurring transaction
   * @param {number} id - Recurring transaction ID
   * @param {Object} updates - Data to update
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async updateRecurringTransaction(id, updates, userId) {
    try {
      const recurring = await recurringTransactionRepository.findById(id);

      if (!recurring) {
        throw new Error('Transaksi berulang tidak ditemukan');
      }

      // Verify ownership
      if (recurring.user_id !== userId) {
        throw new Error('Anda tidak memiliki izin untuk mengupdate transaksi ini');
      }

      // Update
      const updated = await recurringTransactionRepository.update(id, updates);

      // Log activity
      await auditRepository.log(
        userId,
        'update_recurring_transaction',
        'recurring_transaction',
        id,
        {
          updates,
        }
      );

      logger.info('Recurring transaction updated', { recurringId: id, userId });

      return updated;
    } catch (error) {
      logger.error('Error updating recurring transaction', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Pause recurring transaction
   * @param {number} id - Recurring transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async pauseRecurringTransaction(id, userId) {
    try {
      const recurring = await recurringTransactionRepository.findById(id);

      if (!recurring) {
        throw new Error('Transaksi berulang tidak ditemukan');
      }

      if (recurring.user_id !== userId) {
        throw new Error('Anda tidak memiliki izin');
      }

      if (recurring.status !== 'active') {
        throw new Error('Transaksi ini tidak dalam status active');
      }

      const paused = await recurringTransactionRepository.pause(id);

      // Log activity
      await auditRepository.log(
        userId,
        'pause_recurring_transaction',
        'recurring_transaction',
        id,
        { name: recurring.name }
      );

      logger.info('Recurring transaction paused', { recurringId: id, userId });

      return paused;
    } catch (error) {
      logger.error('Error pausing recurring transaction', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Resume recurring transaction
   * @param {number} id - Recurring transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async resumeRecurringTransaction(id, userId) {
    try {
      const recurring = await recurringTransactionRepository.findById(id);

      if (!recurring) {
        throw new Error('Transaksi berulang tidak ditemukan');
      }

      if (recurring.user_id !== userId) {
        throw new Error('Anda tidak memiliki izin');
      }

      if (recurring.status !== 'paused') {
        throw new Error('Transaksi ini tidak dalam status paused');
      }

      const resumed = await recurringTransactionRepository.resume(id);

      // Log activity
      await auditRepository.log(
        userId,
        'resume_recurring_transaction',
        'recurring_transaction',
        id,
        { name: recurring.name }
      );

      logger.info('Recurring transaction resumed', { recurringId: id, userId });

      return resumed;
    } catch (error) {
      logger.error('Error resuming recurring transaction', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Cancel recurring transaction
   * @param {number} id - Recurring transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async cancelRecurringTransaction(id, userId) {
    try {
      const recurring = await recurringTransactionRepository.findById(id);

      if (!recurring) {
        throw new Error('Transaksi berulang tidak ditemukan');
      }

      if (recurring.user_id !== userId) {
        throw new Error('Anda tidak memiliki izin');
      }

      const cancelled = await recurringTransactionRepository.cancel(id);

      // Log activity
      await auditRepository.log(
        userId,
        'cancel_recurring_transaction',
        'recurring_transaction',
        id,
        { name: recurring.name }
      );

      logger.info('Recurring transaction cancelled', { recurringId: id, userId });

      return cancelled;
    } catch (error) {
      logger.error('Error cancelling recurring transaction', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process due recurring transactions
   * This should be called by a scheduler (cron job)
   * @returns {Promise<Object>}
   */
  async processDueRecurringTransactions() {
    try {
      logger.info('Processing due recurring transactions...');

      const dueRecurring = await recurringTransactionRepository.findDue();

      const results = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        completed: 0,
        errors: [],
      };

      // Lazy load transactionService to avoid circular dependency
      const transactionService = require('./transactionService');

      for (const recurring of dueRecurring) {
        results.processed++;

        try {
          // Create actual transaction
          const transaction = await transactionService.createTransaction(
            recurring.user_id,
            recurring.type,
            recurring.amount,
            recurring.description,
            {
              category_id: recurring.category_id,
              currency: recurring.currency,
            }
          );

          // Mark as run and update next date
          await recurringTransactionRepository.markRun(recurring.id, transaction.id);

          results.succeeded++;

          logger.info('Recurring transaction processed', {
            recurringId: recurring.id,
            transactionId: transaction.id,
          });
        } catch (error) {
          results.failed++;
          results.errors.push({
            recurring_id: recurring.id,
            error: error.message,
          });

          // Log failed history
          await recurringTransactionRepository.logHistory(
            recurring.id,
            null,
            recurring.next_run_date,
            dayjs().format('YYYY-MM-DD'),
            'failed',
            error.message
          );

          logger.error('Error processing recurring transaction', {
            recurringId: recurring.id,
            error: error.message,
          });
        }
      }

      logger.info('Recurring transaction processing complete', results);

      return results;
    } catch (error) {
      logger.error('Error in recurring transaction processor', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send reminders for upcoming recurring transactions
   * @returns {Promise<Object>}
   */
  async sendUpcomingReminders() {
    try {
      logger.info('Sending recurring transaction reminders...');

      const upcoming = await recurringTransactionRepository.findUpcoming(3);

      const results = {
        sent: 0,
        failed: 0,
        errors: [],
      };

      // Lazy load to avoid circular dependency
      const notificationService = require('./notificationService');

      for (const recurring of upcoming) {
        try {
          const daysUntil = dayjs(recurring.next_run_date).diff(dayjs(), 'day');

          // Check if we should send reminder
          if (daysUntil <= recurring.notify_days_before) {
            // Send notification
            await notificationService.sendReminder(
              recurring.user_id,
              `Pengingat: "${recurring.name}" akan dijalankan dalam ${daysUntil} hari (${recurring.next_run_date})`
            );

            results.sent++;

            logger.info('Reminder sent', {
              recurringId: recurring.id,
              daysUntil,
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            recurring_id: recurring.id,
            error: error.message,
          });

          logger.error('Error sending reminder', {
            recurringId: recurring.id,
            error: error.message,
          });
        }
      }

      logger.info('Reminders sent', results);

      return results;
    } catch (error) {
      logger.error('Error sending reminders', { error: error.message });
      throw error;
    }
  }

  /**
   * Get statistics
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Object>}
   */
  async getStatistics(userId = null) {
    try {
      const knex = require('../database/connection');

      let query = knex('recurring_transactions');

      if (userId) {
        query = query.where({ user_id: userId });
      }

      const result = await query.select('status').count('* as count').groupBy('status');

      const stats = {
        active: 0,
        paused: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      };

      result.forEach((row) => {
        stats[row.status] = parseInt(row.count);
        stats.total += parseInt(row.count);
      });

      return stats;
    } catch (error) {
      logger.error('Error getting statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate recurring transaction data
   * @param {Object} data - Data to validate
   * @throws {Error}
   * @private
   */
  _validateRecurringData(data) {
    if (!data.name || data.name.trim().length < 3) {
      throw new Error('Nama transaksi berulang minimal 3 karakter');
    }

    if (!data.type || !['paket', 'utang', 'jajan'].includes(data.type)) {
      throw new Error('Tipe transaksi tidak valid');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Jumlah harus lebih dari 0');
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new Error('Deskripsi minimal 3 karakter');
    }

    if (!data.frequency || !['daily', 'weekly', 'monthly', 'yearly'].includes(data.frequency)) {
      throw new Error('Frekuensi tidak valid');
    }

    if (!data.start_date) {
      throw new Error('Tanggal mulai wajib diisi');
    }

    // Validate interval
    if (data.interval && (data.interval < 1 || data.interval > 365)) {
      throw new Error('Interval harus antara 1-365');
    }

    // Validate day_of_week for weekly
    if (data.frequency === 'weekly' && data.day_of_week) {
      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      if (!validDays.includes(data.day_of_week.toLowerCase())) {
        throw new Error('Hari tidak valid');
      }
    }

    // Validate day_of_month for monthly
    if (data.frequency === 'monthly' && data.day_of_month) {
      if (data.day_of_month < 1 || data.day_of_month > 31) {
        throw new Error('Tanggal harus antara 1-31');
      }
    }
  }
}

module.exports = new RecurringTransactionService();
