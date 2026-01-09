// File: src/database/repositories/transactionRepository.js

const db = require('../connection');

module.exports = {
  /**
   * Find transaction by ID
   * @param {number} id - Transaction ID
   * @returns {Promise<Object|null>} Transaction or null
   */
  async findById(id) {
    try {
      const trx = await db('transactions')
        .join('users', 'transactions.user_id', 'users.id')
        .select('transactions.*', 'users.full_name as user_name', 'users.role as user_role')
        .where('transactions.id', id)
        .first();
      return trx || null;
    } catch (error) {
      throw new Error(`Failed to find transaction: ${error.message}`);
    }
  },

  /**
   * Find transaction by transaction_id
   * @param {string} transactionId - Transaction ID (TRX-YYYYMMDD-NNN)
   * @returns {Promise<Object|null>} Transaction or null
   */
  async findByTransactionId(transactionId) {
    try {
      const trx = await db('transactions')
        .join('users', 'transactions.user_id', 'users.id')
        .select('transactions.*', 'users.full_name as user_name', 'users.role as user_role')
        .where('transactions.transaction_id', transactionId)
        .first();
      return trx || null;
    } catch (error) {
      throw new Error(`Failed to find transaction by Ref ID: ${error.message}`);
    }
  },

  /**
   * Find transactions by user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options (type, status, dateRange)
   * @returns {Promise<Array>} Transactions
   */
  async findByUser(userId, filters = {}) {
    try {
      const query = db('transactions').where('transactions.user_id', userId);

      if (filters.startDate && filters.endDate) {
        query.whereBetween('transaction_date', [filters.startDate, filters.endDate]);
      }
      if (filters.type) {
        query.where('type', filters.type);
      }
      if (filters.status) {
        query.where('status', filters.status);
      }
      if (filters.limit) {
        query.limit(filters.limit);
      }

      return await query.orderBy('transaction_date', 'desc');
    } catch (error) {
      throw new Error(`Failed to find user transactions: ${error.message}`);
    }
  },

  /**
   * Find pending transactions
   * @returns {Promise<Array>} Pending transactions
   */
  async findPending() {
    try {
      return await db('transactions')
        .join('users', 'transactions.user_id', 'users.id')
        .select('transactions.*', 'users.full_name as user_name')
        .where('transactions.status', 'pending')
        .orderBy('transaction_date', 'asc');
    } catch (error) {
      throw new Error(`Failed to find pending transactions: ${error.message}`);
    }
  },

  /**
   * Create transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async create(transactionData) {
    try {
      const [id] = await db('transactions').insert(transactionData).returning('id');
      const newId = typeof id === 'object' ? id.id : id;
      return this.findById(newId);
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  },

  /**
   * Update transaction status
   * @param {number} id - Transaction ID
   * @param {string} status - New status
   * @param {number} approvedBy - Approver user ID
   * @returns {Promise<Object>} Updated transaction
   */
  async updateStatus(id, status, approvedBy) {
    try {
      const updateData = { status };
      if (status === 'approved') {
        updateData.approved_by = approvedBy;
        updateData.approved_at = db.fn.now();
      }
      await db('transactions').where({ id }).update(updateData);
      return this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  },

  /**
   * Find transactions by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Transactions
   */
  async findByDateRange(startDate, endDate, filters = {}) {
    try {
      const query = db('transactions')
        .join('users', 'transactions.user_id', 'users.id')
        .select('transactions.*', 'users.full_name as user_name')
        .whereBetween('transaction_date', [startDate, endDate]);

      if (filters.status) {
        query.where('transactions.status', filters.status);
      }
      if (filters.type) {
        query.where('transactions.type', filters.type);
      }

      return await query.orderBy('transaction_date', 'desc');
    } catch (error) {
      throw new Error(`Failed to find transactions by date: ${error.message}`);
    }
  },

  /**
   * Get total amount by user
   * @param {number} userId - User ID
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} Totals by type
   */
  async getTotalByUser(userId, dateRange) {
    try {
      const result = await db('transactions')
        .where('user_id', userId)
        .whereBetween('transaction_date', [dateRange.startDate, dateRange.endDate])
        .where('status', 'approved')
        .groupBy('type')
        .select('type', db.raw('SUM(amount) as total'));

      const totals = { paket: 0, utang: 0, jajan: 0 };
      result.forEach((row) => {
        totals[row.type] = parseFloat(row.total || 0);
      });
      return totals;
    } catch (error) {
      throw new Error(`Failed to get totals by user: ${error.message}`);
    }
  },

  /**
   * Get total amount by type
   * @param {string} type - Transaction type
   * @param {Object} dateRange - Date range
   * @returns {Promise<number>} Total amount
   */
  async getTotalByType(type, dateRange) {
    try {
      const result = await db('transactions')
        .where('type', type)
        .whereBetween('transaction_date', [dateRange.startDate, dateRange.endDate])
        .where('status', 'approved')
        .sum('amount as total')
        .first();
      return parseFloat(result.total || 0);
    } catch (error) {
      throw new Error(`Failed to get total by type: ${error.message}`);
    }
  },

  /**
   * Get statistics
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(dateRange) {
    try {
      const baseQuery = db('transactions').whereBetween('transaction_date', [
        dateRange.startDate,
        dateRange.endDate,
      ]);

      const totalAmount = await baseQuery
        .clone()
        .where('status', 'approved')
        .sum('amount as total')
        .first();

      const count = await baseQuery.clone().count('* as count').first();

      const byTypeRaw = await baseQuery
        .clone()
        .groupBy('type')
        .select('type', db.raw('count(*) as count'));
      const byType = {};
      byTypeRaw.forEach((r) => (byType[r.type] = r.count));

      return {
        count: parseInt(count.count, 10),
        total_amount: parseFloat(totalAmount.total || 0),
        by_type: byType,
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  },
};
