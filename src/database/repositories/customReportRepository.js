/**
 * Custom Report Repository
 *
 * Manage saved report configurations
 */

const knex = require('../connection');

module.exports = {
  /**
   * Find report by ID
   */
  async findById(id) {
    return await knex('custom_reports').where({ id }).first();
  },

  /**
   * Find user's reports
   */
  async findByUser(userId, options = {}) {
    let query = knex('custom_reports')
      .where({ created_by: userId })
      .orderBy('last_used_at', 'desc');

    if (options.favorites) {
      query = query.where({ is_favorite: true });
    }

    if (options.templates) {
      query = query.where({ is_template: true });
    }

    if (options.reportType) {
      query = query.where({ report_type: options.reportType });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  },

  /**
   * Find public templates
   */
  async findTemplates() {
    return await knex('custom_reports')
      .where({ is_template: true, visibility: 'public' })
      .orderBy('usage_count', 'desc');
  },

  /**
   * Find shared reports
   */
  async findShared(userId) {
    return await knex('custom_reports')
      .where(function () {
        this.where({ visibility: 'shared' }).orWhere({ visibility: 'public' });
      })
      .whereNot({ created_by: userId })
      .orderBy('usage_count', 'desc');
  },

  /**
   * Create report
   */
  async create(data) {
    const [result] = await knex('custom_reports').insert(data).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return await this.findById(id);
  },

  /**
   * Update report
   */
  async update(id, data) {
    await knex('custom_reports')
      .where({ id })
      .update({ ...data, updated_at: knex.fn.now() });
    return await this.findById(id);
  },

  /**
   * Delete report
   */
  async delete(id) {
    await knex('custom_reports').where({ id }).del();
    return true;
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(id) {
    const report = await this.findById(id);
    if (!report) return null;

    await knex('custom_reports')
      .where({ id })
      .update({ is_favorite: !report.is_favorite, updated_at: knex.fn.now() });

    return await this.findById(id);
  },

  /**
   * Increment usage count
   */
  async incrementUsage(id) {
    await knex('custom_reports')
      .where({ id })
      .increment('usage_count', 1)
      .update({ last_used_at: knex.fn.now() });
  },

  /**
   * Log report execution
   */
  async logExecution(data) {
    const [result] = await knex('report_executions').insert(data).returning('id');
    const id = typeof result === 'object' ? result.id : result;

    return await knex('report_executions').where({ id }).first();
  },

  /**
   * Update execution status
   */
  async updateExecution(id, data) {
    await knex('report_executions').where({ id }).update(data);
    return await knex('report_executions').where({ id }).first();
  },

  /**
   * Get execution history
   */
  async getExecutionHistory(reportId, limit = 10) {
    return await knex('report_executions')
      .where({ report_id: reportId })
      .orderBy('started_at', 'desc')
      .limit(limit);
  },

  /**
   * Get user's recent executions
   */
  async getUserExecutions(userId, limit = 20) {
    return await knex('report_executions')
      .leftJoin('custom_reports', 'report_executions.report_id', 'custom_reports.id')
      .where({ 'report_executions.executed_by': userId })
      .select('report_executions.*', 'custom_reports.name as report_name')
      .orderBy('report_executions.started_at', 'desc')
      .limit(limit);
  },

  /**
   * Cleanup old executions
   */
  async cleanupOldExecutions(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await knex('report_executions').where('started_at', '<', cutoffDate).del();

    return deleted;
  },

  // ============ Scheduled Reports ============

  /**
   * Create scheduled report
   */
  async createSchedule(data) {
    const [result] = await knex('scheduled_reports').insert(data).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return await this.findScheduleById(id);
  },

  /**
   * Find schedule by ID
   */
  async findScheduleById(id) {
    return await knex('scheduled_reports')
      .leftJoin('custom_reports', 'scheduled_reports.report_id', 'custom_reports.id')
      .where({ 'scheduled_reports.id': id })
      .select(
        'scheduled_reports.*',
        'custom_reports.name as report_name',
        'custom_reports.config as report_config'
      )
      .first();
  },

  /**
   * Find user's schedules
   */
  async findUserSchedules(userId) {
    return await knex('scheduled_reports')
      .leftJoin('custom_reports', 'scheduled_reports.report_id', 'custom_reports.id')
      .where({ 'scheduled_reports.created_by': userId })
      .select('scheduled_reports.*', 'custom_reports.name as report_name')
      .orderBy('scheduled_reports.next_run_date', 'asc');
  },

  /**
   * Find due schedules
   */
  async findDueSchedules() {
    const today = new Date().toISOString().split('T')[0];

    return await knex('scheduled_reports')
      .leftJoin('custom_reports', 'scheduled_reports.report_id', 'custom_reports.id')
      .where({ 'scheduled_reports.status': 'active' })
      .where('scheduled_reports.next_run_date', '<=', today)
      .select(
        'scheduled_reports.*',
        'custom_reports.name as report_name',
        'custom_reports.config as report_config'
      );
  },

  /**
   * Update schedule
   */
  async updateSchedule(id, data) {
    await knex('scheduled_reports')
      .where({ id })
      .update({ ...data, updated_at: knex.fn.now() });
    return await this.findScheduleById(id);
  },

  /**
   * Delete schedule
   */
  async deleteSchedule(id) {
    await knex('scheduled_reports').where({ id }).del();
    return true;
  },

  /**
   * Pause schedule
   */
  async pauseSchedule(id) {
    return await this.updateSchedule(id, { status: 'paused' });
  },

  /**
   * Resume schedule
   */
  async resumeSchedule(id) {
    return await this.updateSchedule(id, { status: 'active' });
  },

  /**
   * Mark schedule as run
   */
  async markScheduleRun(id, nextRunDate) {
    await knex('scheduled_reports').where({ id }).increment('total_runs', 1).update({
      last_run_date: knex.fn.now(),
      next_run_date: nextRunDate,
      updated_at: knex.fn.now(),
    });
  },
};
