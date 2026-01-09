/**
 * Recurring Transaction Repository
 *
 * CRUD operations for recurring transactions
 */

const knex = require('../connection');
const dayjs = require('dayjs');

module.exports = {
  /**
   * Find by ID
   */
  async findById(id) {
    return await knex('recurring_transactions').where({ id }).first();
  },

  /**
   * Find by user
   */
  async findByUser(userId, status = null) {
    let query = knex('recurring_transactions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where('status', status);
    }

    return await query;
  },

  /**
   * Find active recurring transactions
   */
  async findActive() {
    return await knex('recurring_transactions')
      .where({ status: 'active' })
      .orderBy('next_run_date', 'asc');
  },

  /**
   * Find due recurring transactions
   */
  async findDue(date = null) {
    const checkDate = date || dayjs().format('YYYY-MM-DD');

    return await knex('recurring_transactions')
      .where({ status: 'active' })
      .where('next_run_date', '<=', checkDate)
      .orderBy('next_run_date', 'asc');
  },

  /**
   * Find upcoming (to notify)
   */
  async findUpcoming(daysAhead = 7) {
    const today = dayjs().format('YYYY-MM-DD');
    const futureDate = dayjs().add(daysAhead, 'day').format('YYYY-MM-DD');

    return await knex('recurring_transactions')
      .where({ status: 'active', notify_before: true })
      .whereBetween('next_run_date', [today, futureDate])
      .orderBy('next_run_date', 'asc');
  },

  /**
   * Create recurring transaction
   */
  async create(data) {
    const nextRunDate = data.next_run_date || data.start_date;

    const [result] = await knex('recurring_transactions')
      .insert({
        ...data,
        next_run_date: nextRunDate,
      })
      .returning('id');

    const id = typeof result === 'object' ? result.id : result;
    return await this.findById(id);
  },

  /**
   * Update recurring transaction
   */
  async update(id, data) {
    await knex('recurring_transactions')
      .where({ id })
      .update({ ...data, updated_at: knex.fn.now() });
    return await this.findById(id);
  },

  /**
   * Delete recurring transaction
   */
  async delete(id) {
    return await knex('recurring_transactions').where({ id }).del();
  },

  /**
   * Pause recurring transaction
   */
  async pause(id) {
    return await this.update(id, { status: 'paused' });
  },

  /**
   * Resume recurring transaction
   */
  async resume(id) {
    const recurring = await this.findById(id);
    if (!recurring || recurring.status !== 'paused') {
      return null;
    }

    // Recalculate next run date if it's in the past
    let nextRunDate = recurring.next_run_date;
    const today = dayjs();

    while (dayjs(nextRunDate).isBefore(today)) {
      nextRunDate = this.calculateNextRunDate(recurring, nextRunDate);
    }

    return await this.update(id, { status: 'active', next_run_date: nextRunDate });
  },

  /**
   * Cancel recurring transaction
   */
  async cancel(id) {
    return await this.update(id, { status: 'cancelled' });
  },

  /**
   * Mark as run and update next date
   */
  async markRun(id, transactionId = null) {
    const recurring = await this.findById(id);
    if (!recurring) return null;

    const today = dayjs().format('YYYY-MM-DD');
    const nextRunDate = this.calculateNextRunDate(recurring);
    const totalRuns = recurring.total_runs + 1;

    // Check if completed (max occurrences or past end date)
    let newStatus = recurring.status;
    if (recurring.occurrences && totalRuns >= recurring.occurrences) {
      newStatus = 'completed';
    } else if (recurring.end_date && dayjs(nextRunDate).isAfter(recurring.end_date)) {
      newStatus = 'completed';
    }

    await this.update(id, {
      last_run_date: today,
      next_run_date: nextRunDate,
      total_runs: totalRuns,
      status: newStatus,
    });

    // Log to history
    if (transactionId) {
      await this.logHistory(id, transactionId, recurring.next_run_date, today, 'success');
    }

    return await this.findById(id);
  },

  /**
   * Calculate next run date based on frequency
   */
  calculateNextRunDate(recurring, fromDate = null) {
    const baseDate = dayjs(fromDate || recurring.next_run_date);
    const interval = recurring.interval || 1;

    let nextDate;

    switch (recurring.frequency) {
      case 'daily':
        nextDate = baseDate.add(interval, 'day');
        break;

      case 'weekly':
        nextDate = baseDate.add(interval, 'week');
        // Adjust to specific day of week if set
        if (recurring.day_of_week) {
          const dayMap = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
          };
          const targetDay = dayMap[recurring.day_of_week.toLowerCase()];
          if (targetDay !== undefined) {
            nextDate = nextDate.day(targetDay);
          }
        }
        break;

      case 'monthly':
        nextDate = baseDate.add(interval, 'month');
        // Adjust to specific day of month if set
        if (recurring.day_of_month) {
          const maxDay = nextDate.daysInMonth();
          const targetDay = Math.min(recurring.day_of_month, maxDay);
          nextDate = nextDate.date(targetDay);
        }
        break;

      case 'yearly':
        nextDate = baseDate.add(interval, 'year');
        break;

      default:
        nextDate = baseDate.add(1, 'month');
    }

    return nextDate.format('YYYY-MM-DD');
  },

  /**
   * Log to history
   */
  async logHistory(
    recurringTransactionId,
    transactionId,
    scheduledDate,
    createdDate,
    status,
    notes = null
  ) {
    return await knex('recurring_transaction_history').insert({
      recurring_transaction_id: recurringTransactionId,
      transaction_id: transactionId,
      scheduled_date: scheduledDate,
      created_date: createdDate,
      status,
      notes,
    });
  },

  /**
   * Get history for recurring transaction
   */
  async getHistory(recurringTransactionId, limit = 10) {
    return await knex('recurring_transaction_history')
      .where({ recurring_transaction_id: recurringTransactionId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  /**
   * Get statistics for recurring transaction
   */
  async getStats(recurringTransactionId) {
    const recurring = await this.findById(recurringTransactionId);
    if (!recurring) return null;

    const history = await knex('recurring_transaction_history').where({
      recurring_transaction_id: recurringTransactionId,
    });

    const successful = history.filter((h) => h.status === 'success').length;
    const failed = history.filter((h) => h.status === 'failed').length;
    const skipped = history.filter((h) => h.status === 'skipped').length;

    return {
      total_runs: recurring.total_runs,
      successful,
      failed,
      skipped,
      next_run_date: recurring.next_run_date,
      last_run_date: recurring.last_run_date,
      total_amount: recurring.total_runs * recurring.amount,
    };
  },
};
