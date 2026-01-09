/**
 * Transaction Service
 *
 * Business logic for transaction management including:
 * - Transaction creation with validation
 * - Auto-approval logic based on threshold
 * - Manual approval workflow
 * - Transaction rejection
 * - Transaction ID generation (TRX-YYYYMMDD-NNN)
 * - Transaction queries and summaries
 */

const transactionRepository = require('../database/repositories/transactionRepository');
const userRepository = require('../database/repositories/userRepository');
const auditRepository = require('../database/repositories/auditRepository');
const logger = require('../utils/logger');
const validator = require('../utils/validator');
const { formatDate } = require('../utils/formatter');
const { TRANSACTION_TYPES, TRANSACTION_STATUS, ROLES } = require('../utils/constants');
const config = require('../config/app');
const dayjs = require('dayjs');

class TransactionService {
  /**
   * Create new transaction
   * @param {number} userId - User ID
   * @param {string} type - Transaction type
   * @param {number} amount - Amount
   * @param {string} description - Description
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(userId, type, amount, description, metadata = {}) {
    try {
      // 1. Get user
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      // 2. Check permission
      if (user.role === ROLES.INVESTOR) {
        throw new Error('Investor tidak dapat membuat transaksi');
      }

      // 3. Validate transaction data
      const validation = validator.validateTransactionData({
        type,
        amount,
        description,
        customer_name: metadata.customer_name,
        image_url: metadata.image_url,
      });

      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // 4-6. Generate ID and Create (with retry for concurrency)
      let transaction;
      let transactionId;
      let status;
      let retries = 3;

      while (retries > 0) {
        try {
          transactionId = await this._generateTransactionId();

          const shouldAutoApprove = this.shouldAutoApprove(amount);
          status = shouldAutoApprove ? TRANSACTION_STATUS.APPROVED : TRANSACTION_STATUS.PENDING;

          const transactionData = {
            transaction_id: transactionId,
            user_id: userId,
            type,
            category: this._getCategoryFromType(type),
            amount,
            description,
            customer_name: metadata.customer_name || null,
            legacy_image_url: metadata.image_url || null,
            status,
            approved_by: shouldAutoApprove ? userId : null,
            approved_at: shouldAutoApprove ? new Date() : null,
            transaction_date: new Date(),
            created_at: new Date(),
            metadata: metadata,
          };

          transaction = await transactionRepository.create(transactionData);
          break; // Success
        } catch (error) {
          if (
            error.message.includes('UNIQUE constraint failed') ||
            error.message.includes('unique constraint')
          ) {
            retries--;
            if (retries === 0) throw error;
            await new Promise((r) => setTimeout(r, 100)); // Wait before retry
          } else {
            throw error;
          }
        }
      }

      // 7. Log activity
      await auditRepository.log(userId, 'create_transaction', 'transaction', transaction.id, {
        transactionId,
        type,
        amount,
        status,
      });

      logger.info('Transaction created', {
        transactionId,
        userId,
        type,
        amount,
        status,
      });

      return transaction;
    } catch (error) {
      // Note: transactionId/status might be undefined here if error occurred before assignment
      logger.error('Error creating transaction', {
        userId,
        type,
        amount,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object|null>} Transaction or null
   */
  async getTransaction(transactionId) {
    try {
      return await transactionRepository.findByTransactionId(transactionId);
    } catch (error) {
      logger.error('Error getting transaction', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get pending transactions
   * @returns {Promise<Array>} Pending transactions
   */
  async getPendingTransactions() {
    try {
      return await transactionRepository.findPending();
    } catch (error) {
      logger.error('Error getting pending transactions', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Approve transaction
   * @param {string} transactionId - Transaction ID
   * @param {number} approvedBy - Approver user ID
   * @returns {Promise<Object>} Updated transaction
   */
  async approveTransaction(transactionId, approvedBy) {
    try {
      // 1. Get transaction
      const transaction = await transactionRepository.findByTransactionId(transactionId);
      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // 2. Check if already approved/rejected
      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        throw new Error(`Transaksi sudah ${transaction.status}`);
      }

      // 3. Get approver
      const approver = await userRepository.findById(approvedBy);
      if (!approver) {
        throw new Error('Approver tidak ditemukan');
      }

      // 4. Check permission (admin or superadmin)
      if (![ROLES.ADMIN, ROLES.SUPERADMIN].includes(approver.role)) {
        throw new Error('Hanya admin/superadmin yang dapat approve transaksi');
      }

      // 5. Update transaction
      const updatedTransaction = await transactionRepository.updateStatus(
        transaction.id,
        TRANSACTION_STATUS.APPROVED,
        approvedBy
      );

      // 6. Log activity
      await auditRepository.log(approvedBy, 'approve_transaction', 'transaction', transaction.id, {
        transactionId,
        amount: transaction.amount,
      });

      logger.info('Transaction approved', {
        transactionId,
        approvedBy,
      });

      return updatedTransaction;
    } catch (error) {
      logger.error('Error approving transaction', {
        transactionId,
        approvedBy,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Reject transaction
   * @param {string} transactionId - Transaction ID
   * @param {number} rejectedBy - Rejector user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated transaction
   */
  async rejectTransaction(transactionId, rejectedBy, reason) {
    try {
      const transaction = await transactionRepository.findByTransactionId(transactionId);
      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        throw new Error(`Transaksi sudah ${transaction.status}`);
      }

      const rejecter = await userRepository.findById(rejectedBy);
      if (!rejecter) {
        throw new Error('Rejecter tidak ditemukan');
      }

      if (![ROLES.ADMIN, ROLES.SUPERADMIN].includes(rejecter.role)) {
        throw new Error('Hanya admin/superadmin yang dapat reject transaksi');
      }

      const updatedTransaction = await transactionRepository.updateStatus(
        transaction.id,
        TRANSACTION_STATUS.REJECTED,
        rejectedBy
      );

      await auditRepository.log(rejectedBy, 'reject_transaction', 'transaction', transaction.id, {
        transactionId,
        reason,
      });

      logger.info('Transaction rejected', {
        transactionId,
        rejectedBy,
        reason,
      });

      return updatedTransaction;
    } catch (error) {
      logger.error('Error rejecting transaction', {
        transactionId,
        rejectedBy,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user transactions
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Transactions
   */
  async getUserTransactions(userId, filters = {}) {
    try {
      return await transactionRepository.findByUser(userId, filters);
    } catch (error) {
      logger.error('Error getting user transactions', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate daily summary
   * @param {Date} date - Date to calculate
   * @returns {Promise<Object>} Daily summary
   */
  async calculateDailySummary(date = new Date()) {
    try {
      const startDate = dayjs(date).startOf('day').toDate();
      const endDate = dayjs(date).endOf('day').toDate();

      const transactions = await transactionRepository.findByDateRange(startDate, endDate, {
        status: TRANSACTION_STATUS.APPROVED,
      });

      const summary = {
        date: formatDate(date, 'DD MMMM YYYY'),
        total_transactions: transactions.length,
        income: 0,
        expense: 0,
        by_type: {
          [TRANSACTION_TYPES.PAKET]: 0,
          [TRANSACTION_TYPES.UTANG]: 0,
          [TRANSACTION_TYPES.JAJAN]: 0,
        },
        by_user: {},
        transactions: transactions,
      };

      for (const trx of transactions) {
        // Calculate totals
        if (trx.type === TRANSACTION_TYPES.PAKET || trx.type === TRANSACTION_TYPES.UTANG) {
          summary.income += parseFloat(trx.amount);
        } else if (trx.type === TRANSACTION_TYPES.JAJAN) {
          summary.expense += parseFloat(trx.amount);
        }

        // By type
        summary.by_type[trx.type] += parseFloat(trx.amount);

        // By user
        if (!summary.by_user[trx.user_id]) {
          summary.by_user[trx.user_id] = {
            user_name: trx.user_name || 'Unknown',
            count: 0,
            total: 0,
          };
        }
        summary.by_user[trx.user_id].count++;
        summary.by_user[trx.user_id].total += parseFloat(trx.amount);
      }

      summary.net = summary.income - summary.expense;

      return summary;
    } catch (error) {
      logger.error('Error calculating daily summary', {
        date,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate user summary
   * @param {number} userId - User ID
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} User summary
   */
  async calculateUserSummary(userId, dateRange = {}) {
    try {
      const startDate = dateRange.startDate || dayjs().startOf('day').toDate();
      const endDate = dateRange.endDate || dayjs().endOf('day').toDate();

      const transactions = await transactionRepository.findByUser(userId, {
        startDate,
        endDate,
        status: TRANSACTION_STATUS.APPROVED,
      });

      const user = await userRepository.findById(userId);

      const summary = {
        user_id: userId,
        user_name: user?.full_name || 'Unknown',
        period: {
          start: formatDate(startDate, 'DD MMM YYYY'),
          end: formatDate(endDate, 'DD MMM YYYY'),
        },
        total_transactions: transactions.length,
        by_type: {
          [TRANSACTION_TYPES.PAKET]: { count: 0, total: 0 },
          [TRANSACTION_TYPES.UTANG]: { count: 0, total: 0 },
          [TRANSACTION_TYPES.JAJAN]: { count: 0, total: 0 },
        },
        total_amount: 0,
        transactions: transactions,
      };

      for (const trx of transactions) {
        const amount = parseFloat(trx.amount);
        summary.by_type[trx.type].count++;
        summary.by_type[trx.type].total += amount;
        summary.total_amount += amount;
      }

      return summary;
    } catch (error) {
      logger.error('Error calculating user summary', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if transaction should be auto-approved
   * @param {number} amount - Transaction amount
   * @returns {boolean} True if should auto-approve
   */
  shouldAutoApprove(amount) {
    const threshold = config.business?.autoApprovalThreshold || 1000000;
    return amount < threshold;
  }

  /**
   * Generate unique transaction ID
   * @returns {Promise<string>} Transaction ID (TRX-YYYYMMDD-XXXXXXXX)
   * @private
   *
   * Uses crypto random to avoid race conditions during concurrent operations.
   * Format: TRX-YYYYMMDD-XXXXXXXX (8 hex characters for uniqueness)
   */
  async _generateTransactionId() {
    const crypto = require('crypto');
    const today = dayjs().format('YYYYMMDD');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();

    return `TRX-${today}-${random}`;
  }

  /**
   * Get category from transaction type
   * @param {string} type - Transaction type
   * @returns {string} Category
   * @private
   */
  _getCategoryFromType(type) {
    const categoryMap = {
      [TRANSACTION_TYPES.PAKET]: 'Penjualan',
      [TRANSACTION_TYPES.UTANG]: 'Piutang',
      [TRANSACTION_TYPES.JAJAN]: 'Pengeluaran',
    };
    return categoryMap[type] || 'Lain-lain';
  }

  /**
   * Detect transaction anomalies
   * @param {Object} transaction - Transaction object
   * @returns {Object} { hasAnomaly: boolean, reasons: Array }
   */
  detectAnomalies(transaction) {
    const anomalies = [];

    // Check for unusually high amount
    if (transaction.amount > 10000000) {
      anomalies.push('Jumlah transaksi sangat besar (> Rp 10 juta)');
    }

    // Check for duplicate in short time
    // (Would need to query recent transactions)

    return {
      hasAnomaly: anomalies.length > 0,
      reasons: anomalies,
    };
  }
}

module.exports = new TransactionService();
