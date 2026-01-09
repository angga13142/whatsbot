/**
 * Report Data Repository
 *
 * Execute report queries and fetch data
 */

const knex = require('../connection');

module.exports = {
  /**
   * Execute custom report query
   * @param {Object} filters - Report filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async executeReport(filters, options = {}) {
    let query = knex('transactions')
      .select('transactions.*')
      .where({ 'transactions.status': 'approved' });

    // Apply filters
    query = this._applyFilters(query, filters);

    // Join category if needed
    if (options.includeCategory) {
      query = query
        .leftJoin('categories', 'transactions.category_id', 'categories.id')
        .select('categories.name as category_name', 'categories.icon as category_icon');
    }

    // Join user if needed
    if (options.includeUser) {
      query = query
        .leftJoin('users', 'transactions.user_id', 'users.id')
        .select('users.full_name as user_name', 'users.phone_number as user_phone');
    }

    // Apply sorting
    if (options.sortBy) {
      const sortColumn = options.sortBy.includes('.')
        ? options.sortBy
        : `transactions.${options.sortBy}`;
      query = query.orderBy(sortColumn, options.sortOrder || 'desc');
    } else {
      query = query.orderBy('transactions.transaction_date', 'desc');
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  },

  /**
   * Get report summary statistics
   */
  async getReportSummary(filters) {
    let query = knex('transactions').where({ status: 'approved' });

    query = this._applyFilters(query, filters);

    const summary = await query
      .select(
        knex.raw('COUNT(*) as total_transactions'),
        knex.raw(
          "SUM(CASE WHEN type IN ('paket', 'utang') THEN amount ELSE 0 END) as total_income"
        ),
        knex.raw("SUM(CASE WHEN type = 'jajan' THEN amount ELSE 0 END) as total_expense"),
        knex.raw('AVG(amount) as avg_amount'),
        knex.raw('MIN(amount) as min_amount'),
        knex.raw('MAX(amount) as max_amount'),
        knex.raw('MIN(transaction_date) as first_date'),
        knex.raw('MAX(transaction_date) as last_date')
      )
      .first();

    const totalIncome = parseFloat(summary.total_income) || 0;
    const totalExpense = parseFloat(summary.total_expense) || 0;

    return {
      total_transactions: parseInt(summary.total_transactions) || 0,
      total_income: totalIncome,
      total_expense: totalExpense,
      net: totalIncome - totalExpense,
      avg_amount: parseFloat(summary.avg_amount) || 0,
      min_amount: parseFloat(summary.min_amount) || 0,
      max_amount: parseFloat(summary.max_amount) || 0,
      first_date: summary.first_date,
      last_date: summary.last_date,
    };
  },

  /**
   * Get total count for pagination
   */
  async getReportCount(filters) {
    let query = knex('transactions').where({ status: 'approved' });

    query = this._applyFilters(query, filters);

    const result = await query.count('* as count').first();
    return parseInt(result.count) || 0;
  },

  /**
   * Group data by specified dimension
   */
  async getGroupedData(filters, groupBy) {
    let query = knex('transactions').where({ status: 'approved' });

    query = this._applyFilters(query, filters);

    switch (groupBy) {
      case 'date':
        return await this._groupByDate(query);

      case 'week':
        return await this._groupByWeek(query);

      case 'month':
        return await this._groupByMonth(query);

      case 'category':
        return await this._groupByCategory(query);

      case 'type':
        return await this._groupByType(query);

      case 'user':
        return await this._groupByUser(query);

      case 'tag':
        return await this._groupByTag(query);

      default:
        throw new Error(`Invalid groupBy: ${groupBy}`);
    }
  },

  /**
   * Get trend data (time series)
   */
  async getTrendData(filters, interval = 'day') {
    let query = knex('transactions').where({ status: 'approved' });

    query = this._applyFilters(query, filters);

    let dateFormat;
    switch (interval) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-W%W';
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
    }

    return await query
      .select(
        knex.raw(`strftime('${dateFormat}', transaction_date) as period`),
        knex.raw("SUM(CASE WHEN type IN ('paket', 'utang') THEN amount ELSE 0 END) as income"),
        knex.raw("SUM(CASE WHEN type = 'jajan' THEN amount ELSE 0 END) as expense"),
        knex.raw('COUNT(*) as count')
      )
      .groupByRaw(`strftime('${dateFormat}', transaction_date)`)
      .orderBy('period', 'asc');
  },

  /**
   * Get comparison data between periods
   */
  async getComparisonData(filters, currentPeriod, previousPeriod) {
    // Current period
    const currentFilters = {
      ...filters,
      startDate: currentPeriod.start,
      endDate: currentPeriod.end,
    };
    const current = await this.getReportSummary(currentFilters);

    // Previous period
    const previousFilters = {
      ...filters,
      startDate: previousPeriod.start,
      endDate: previousPeriod.end,
    };
    const previous = await this.getReportSummary(previousFilters);

    // Calculate changes
    const calculateChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      previous,
      changes: {
        transactions: calculateChange(current.total_transactions, previous.total_transactions),
        income: calculateChange(current.total_income, previous.total_income),
        expense: calculateChange(current.total_expense, previous.total_expense),
        net: calculateChange(current.net, previous.net),
      },
    };
  },

  /**
   * Get top items (categories, users, etc.)
   */
  async getTopItems(filters, dimension, limit = 10) {
    let query = knex('transactions').where({ status: 'approved' });

    query = this._applyFilters(query, filters);

    switch (dimension) {
      case 'categories':
        return await query
          .leftJoin('categories', 'transactions.category_id', 'categories.id')
          .select(
            'categories.id',
            'categories.name',
            'categories.icon',
            knex.raw('SUM(transactions.amount) as total')
          )
          .groupBy('categories.id', 'categories.name', 'categories.icon')
          .orderBy('total', 'desc')
          .limit(limit);

      case 'users':
        return await query
          .leftJoin('users', 'transactions.user_id', 'users.id')
          .select(
            'users.id',
            'users.full_name as name',
            knex.raw('SUM(transactions.amount) as total')
          )
          .groupBy('users.id', 'users.full_name')
          .orderBy('total', 'desc')
          .limit(limit);

      case 'days':
        return await query
          .select(
            knex.raw('strftime("%w", transaction_date) as day_of_week'),
            knex.raw('SUM(amount) as total'),
            knex.raw('COUNT(*) as count')
          )
          .groupByRaw('strftime("%w", transaction_date)')
          .orderBy('total', 'desc')
          .limit(limit);

      default:
        return [];
    }
  },

  /**
   * Apply filters to query
   * @private
   */
  _applyFilters(query, filters) {
    // Date range
    if (filters.startDate) {
      query = query.where('transaction_date', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('transaction_date', '<=', filters.endDate);
    }

    // Transaction type
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        query = query.whereIn('type', filters.type);
      } else {
        query = query.where('type', filters.type);
      }
    }

    // Category
    if (filters.categoryId) {
      if (Array.isArray(filters.categoryId)) {
        query = query.whereIn('category_id', filters.categoryId);
      } else {
        query = query.where('category_id', filters.categoryId);
      }
    }

    // User
    if (filters.userId) {
      if (Array.isArray(filters.userId)) {
        query = query.whereIn('user_id', filters.userId);
      } else {
        query = query.where('user_id', filters.userId);
      }
    }

    // Amount range
    if (filters.minAmount !== undefined && filters.minAmount !== null) {
      query = query.where('amount', '>=', filters.minAmount);
    }
    if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
      query = query.where('amount', '<=', filters.maxAmount);
    }

    // Status (override default)
    if (filters.status) {
      query = query.where('status', filters.status);
    }

    // Tags (if filter includes tags)
    if (filters.tags && filters.tags.length > 0) {
      query = query.whereExists(function () {
        this.select(knex.raw(1))
          .from('transaction_tags')
          .join('tags', 'transaction_tags.tag_id', 'tags.id')
          .whereRaw('transaction_tags.transaction_id = transactions.id')
          .whereIn('tags.name', filters.tags);
      });
    }

    // Text search in description
    if (filters.search) {
      query = query.where('description', 'like', `%${filters.search}%`);
    }

    // Customer name
    if (filters.customerName) {
      query = query.where('customer_name', 'like', `%${filters.customerName}%`);
    }

    // Currency
    if (filters.currency) {
      query = query.where('currency', filters.currency);
    }

    return query;
  },

  /**
   * Group by date
   * @private
   */
  async _groupByDate(query) {
    return await query
      .select(
        knex.raw('DATE(transaction_date) as date'),
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(amount) as total'),
        knex.raw("SUM(CASE WHEN type IN ('paket', 'utang') THEN amount ELSE 0 END) as income"),
        knex.raw("SUM(CASE WHEN type = 'jajan' THEN amount ELSE 0 END) as expense")
      )
      .groupByRaw('DATE(transaction_date)')
      .orderBy('date', 'desc');
  },

  /**
   * Group by week
   * @private
   */
  async _groupByWeek(query) {
    return await query
      .select(
        knex.raw("strftime('%Y-W%W', transaction_date) as week"),
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(amount) as total'),
        knex.raw("SUM(CASE WHEN type IN ('paket', 'utang') THEN amount ELSE 0 END) as income"),
        knex.raw("SUM(CASE WHEN type = 'jajan' THEN amount ELSE 0 END) as expense")
      )
      .groupByRaw("strftime('%Y-W%W', transaction_date)")
      .orderBy('week', 'desc');
  },

  /**
   * Group by month
   * @private
   */
  async _groupByMonth(query) {
    return await query
      .select(
        knex.raw("strftime('%Y-%m', transaction_date) as month"),
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(amount) as total'),
        knex.raw("SUM(CASE WHEN type IN ('paket', 'utang') THEN amount ELSE 0 END) as income"),
        knex.raw("SUM(CASE WHEN type = 'jajan' THEN amount ELSE 0 END) as expense")
      )
      .groupByRaw("strftime('%Y-%m', transaction_date)")
      .orderBy('month', 'desc');
  },

  /**
   * Group by category
   * @private
   */
  async _groupByCategory(query) {
    return await query
      .leftJoin('categories', 'transactions.category_id', 'categories.id')
      .select(
        'categories.id as category_id',
        'categories.name as category_name',
        'categories.icon as category_icon',
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(transactions.amount) as total'),
        knex.raw('AVG(transactions.amount) as avg_amount')
      )
      .groupBy('categories.id', 'categories.name', 'categories.icon')
      .orderBy('total', 'desc');
  },

  /**
   * Group by type
   * @private
   */
  async _groupByType(query) {
    return await query
      .select(
        'type',
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(amount) as total'),
        knex.raw('AVG(amount) as avg_amount')
      )
      .groupBy('type')
      .orderBy('total', 'desc');
  },

  /**
   * Group by user
   * @private
   */
  async _groupByUser(query) {
    return await query
      .join('users', 'transactions.user_id', 'users.id')
      .select(
        'users.id as user_id',
        'users.full_name as user_name',
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(transactions.amount) as total'),
        knex.raw('AVG(transactions.amount) as avg_amount')
      )
      .groupBy('users.id', 'users.full_name')
      .orderBy('total', 'desc');
  },

  /**
   * Group by tag
   * @private
   */
  async _groupByTag(query) {
    return await query
      .join('transaction_tags', 'transactions.id', 'transaction_tags.transaction_id')
      .join('tags', 'transaction_tags.tag_id', 'tags.id')
      .select(
        'tags.id as tag_id',
        'tags.name as tag_name',
        'tags.color as tag_color',
        knex.raw('COUNT(DISTINCT transactions.id) as count'),
        knex.raw('SUM(transactions.amount) as total')
      )
      .groupBy('tags.id', 'tags.name', 'tags.color')
      .orderBy('total', 'desc');
  },
};
