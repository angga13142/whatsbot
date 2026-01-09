// File: src/services/transactionService.js

/**
 * Transaction Service
 *
 * Purpose: Business logic for Transactions (Create, Approve, Summary).
 *
 * @module services/transactionService
 */

const transactionRepository = require('../database/repositories/transactionRepository');
const auditRepository = require('../database/repositories/auditRepository');
const { validateTransactionData } = require('../utils/validator');
const { TRANSACTION_STATUS, AUDIT_ACTIONS } = require('../utils/constants');
const config = require('../config/app');
const dayjs = require('dayjs');

class TransactionService {
  async createTransaction(userId, data) {
    const validation = validateTransactionData(data);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const cleanData = validation.value;

    // Auto-approval logic
    let status = TRANSACTION_STATUS.PENDING;
    let approvedBy = null;
    let approvedAt = null;

    if (cleanData.amount < config.business.autoApprovalThreshold) {
      status = TRANSACTION_STATUS.APPROVED;
      approvedBy = null; // System auto-approve
      approvedAt = new Date();
    }

    const transactionId = this.generateTransactionId();

    const transaction = {
      user_id: userId,
      transaction_id: transactionId,
      ...cleanData,
      status,
      approved_by: approvedBy,
      approved_at: approvedAt,
    };

    const id = await transactionRepository.create(transaction);

    await auditRepository.log(userId, AUDIT_ACTIONS.TRANSACTION_CREATED, 'transaction', id, {
      amount: cleanData.amount,
      type: cleanData.type,
      status,
    });

    return { id, ...transaction };
  }

  async approveTransaction(id, approverId) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) throw new Error('Transaksi tidak ditemukan');

    if (transaction.status !== TRANSACTION_STATUS.PENDING) {
      throw new Error('Transaksi tidak dalam status pending.');
    }

    await transactionRepository.updateStatus(id, TRANSACTION_STATUS.APPROVED, approverId);

    await auditRepository.log(approverId, AUDIT_ACTIONS.TRANSACTION_APPROVED, 'transaction', id);

    return { ...transaction, status: TRANSACTION_STATUS.APPROVED };
  }

  async rejectTransaction(id, rejectorId) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) throw new Error('Transaksi tidak ditemukan');

    await transactionRepository.updateStatus(id, TRANSACTION_STATUS.REJECTED, rejectorId);

    await auditRepository.log(rejectorId, AUDIT_ACTIONS.TRANSACTION_REJECTED, 'transaction', id);
    return { ...transaction, status: TRANSACTION_STATUS.REJECTED };
  }

  async getUserSummary() {
    // Simple summary for user
    // Implementation deferred for brevity, would use repo aggregation
    return { total: 0 };
  }

  generateTransactionId() {
    const date = dayjs().format('YYYYMMDD');
    const random = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0');
    return `TRX-${date}-${random}`;
  }
}

module.exports = new TransactionService();
