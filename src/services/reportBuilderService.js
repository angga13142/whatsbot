/**
 * Report Builder Service
 *
 * Business logic for custom reports
 */

const customReportRepository = require('../database/repositories/customReportRepository');
const reportDataRepository = require('../database/repositories/reportDataRepository');
const auditRepository = require('../database/repositories/auditRepository');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

module.exports = {
  // ============ Report Management ============

  /**
   * Create a new custom report
   */
  async createReport(data, userId) {
    try {
      // Validate config
      this._validateReportConfig(data.config);

      const reportData = {
        name: data.name,
        description: data.description || null,
        created_by: userId,
        config: JSON.stringify(data.config),
        report_type: data.report_type || 'standard',
        visibility: data.visibility || 'private',
        is_template: data.is_template || false,
        is_favorite: data.is_favorite || false,
      };

      const report = await customReportRepository.create(reportData);

      // Log audit
      await auditRepository.log({
        user_id: userId,
        action: 'REPORT_CREATED',
        entity_type: 'custom_report',
        entity_id: report.id,
        new_values: { name: data.name, type: data.report_type },
      });

      logger.info('Custom report created', { reportId: report.id, userId });

      return this._formatReport(report);
    } catch (error) {
      logger.error('Error creating report', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Get report by ID
   */
  async getReport(reportId, userId) {
    const report = await customReportRepository.findById(reportId);

    if (!report) {
      throw new Error('Report tidak ditemukan');
    }

    // Check access
    if (report.visibility === 'private' && report.created_by !== userId) {
      throw new Error('Tidak memiliki akses ke report ini');
    }

    return this._formatReport(report);
  },

  /**
   * Get user's reports
   */
  async getUserReports(userId, options = {}) {
    const reports = await customReportRepository.findByUser(userId, options);
    return reports.map((r) => this._formatReport(r));
  },

  /**
   * Get public templates
   */
  async getPublicTemplates() {
    const templates = await customReportRepository.findTemplates();
    return templates.map((r) => this._formatReport(r));
  },

  /**
   * Update report
   */
  async updateReport(reportId, data, userId) {
    const report = await customReportRepository.findById(reportId);

    if (!report) {
      throw new Error('Report tidak ditemukan');
    }

    if (report.created_by !== userId) {
      throw new Error('Tidak memiliki akses untuk mengubah report ini');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.config) {
      this._validateReportConfig(data.config);
      updateData.config = JSON.stringify(data.config);
    }
    if (data.report_type) updateData.report_type = data.report_type;
    if (data.visibility) updateData.visibility = data.visibility;
    if (data.is_template !== undefined) updateData.is_template = data.is_template;
    if (data.is_favorite !== undefined) updateData.is_favorite = data.is_favorite;

    const updated = await customReportRepository.update(reportId, updateData);

    logger.info('Report updated', { reportId, userId });

    return this._formatReport(updated);
  },

  /**
   * Delete report
   */
  async deleteReport(reportId, userId) {
    const report = await customReportRepository.findById(reportId);

    if (!report) {
      throw new Error('Report tidak ditemukan');
    }

    if (report.created_by !== userId) {
      throw new Error('Tidak memiliki akses untuk menghapus report ini');
    }

    await customReportRepository.delete(reportId);

    await auditRepository.log({
      user_id: userId,
      action: 'REPORT_DELETED',
      entity_type: 'custom_report',
      entity_id: reportId,
      old_values: { name: report.name },
    });

    logger.info('Report deleted', { reportId, userId });

    return true;
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(reportId, userId) {
    const report = await customReportRepository.findById(reportId);

    if (!report) {
      throw new Error('Report tidak ditemukan');
    }

    if (report.created_by !== userId) {
      throw new Error('Tidak dapat memfavoritkan report orang lain');
    }

    const updated = await customReportRepository.toggleFavorite(reportId);
    return this._formatReport(updated);
  },

  // ============ Report Execution ============

  /**
   * Execute a saved report
   */
  async executeReport(reportId, userId, options = {}) {
    const startTime = Date.now();

    // Log execution start
    const execution = await customReportRepository.logExecution({
      report_id: reportId,
      executed_by: userId,
      filters: JSON.stringify(options.overrideFilters || {}),
      status: 'running',
    });

    try {
      const report = await this.getReport(reportId, userId);
      const config = report.config;

      // Merge filters
      const filters = { ...config.filters, ...(options.overrideFilters || {}) };

      // Execute based on report type
      let result;
      switch (report.report_type) {
        case 'trend':
          result = await this._executeTrendReport(filters, config);
          break;
        case 'comparison':
          result = await this._executeComparisonReport(filters, config);
          break;
        case 'summary':
          result = await this._executeSummaryReport(filters, config);
          break;
        default:
          result = await this._executeStandardReport(filters, config);
      }

      // Update execution record
      const executionTime = Date.now() - startTime;
      await customReportRepository.updateExecution(execution.id, {
        status: 'completed',
        results_summary: JSON.stringify(result.summary),
        result_count: result.data ? result.data.length : 0,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString(),
      });

      // Increment usage
      await customReportRepository.incrementUsage(reportId);

      logger.info('Report executed', {
        reportId,
        userId,
        executionTime,
        resultCount: result.data?.length,
      });

      return {
        report,
        execution_id: execution.id,
        execution_time_ms: executionTime,
        ...result,
      };
    } catch (error) {
      // Log failure
      await customReportRepository.updateExecution(execution.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });

      logger.error('Report execution failed', { reportId, error: error.message });
      throw error;
    }
  },

  /**
   * Execute ad-hoc report (without saving)
   */
  async executeAdHocReport(config, userId) {
    const startTime = Date.now();

    this._validateReportConfig(config);

    // Log execution
    const execution = await customReportRepository.logExecution({
      report_id: null,
      executed_by: userId,
      filters: JSON.stringify(config.filters || {}),
      status: 'running',
    });

    try {
      const filters = config.filters || {};
      const reportType = config.report_type || 'standard';

      let result;
      switch (reportType) {
        case 'trend':
          result = await this._executeTrendReport(filters, config);
          break;
        case 'comparison':
          result = await this._executeComparisonReport(filters, config);
          break;
        case 'summary':
          result = await this._executeSummaryReport(filters, config);
          break;
        default:
          result = await this._executeStandardReport(filters, config);
      }

      const executionTime = Date.now() - startTime;
      await customReportRepository.updateExecution(execution.id, {
        status: 'completed',
        results_summary: JSON.stringify(result.summary),
        result_count: result.data ? result.data.length : 0,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString(),
      });

      return {
        execution_id: execution.id,
        execution_time_ms: executionTime,
        ...result,
      };
    } catch (error) {
      await customReportRepository.updateExecution(execution.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });

      throw error;
    }
  },

  /**
   * Get execution history
   */
  async getExecutionHistory(reportId, limit = 10) {
    return await customReportRepository.getExecutionHistory(reportId, limit);
  },

  /**
   * Get user's recent executions
   */
  async getUserExecutions(userId, limit = 20) {
    return await customReportRepository.getUserExecutions(userId, limit);
  },

  // ============ Scheduled Reports ============

  /**
   * Create scheduled report
   */
  async createSchedule(reportId, scheduleData, userId) {
    const report = // eslint-disable-line no-unused-vars
      // eslint-disable-line no-unused-vars
      await this.getReport(reportId, userId);

    const nextRunDate = this._calculateNextRunDate(scheduleData.frequency, scheduleData);

    const schedule = await customReportRepository.createSchedule({
      report_id: reportId,
      created_by: userId,
      frequency: scheduleData.frequency,
      day_of_week: scheduleData.day_of_week || null,
      day_of_month: scheduleData.day_of_month || null,
      time_of_day: scheduleData.time_of_day || '09:00:00',
      recipients: JSON.stringify(scheduleData.recipients || [userId]),
      delivery_method: scheduleData.delivery_method || 'whatsapp',
      export_format: scheduleData.export_format || 'excel',
      next_run_date: nextRunDate,
    });

    logger.info('Report schedule created', { scheduleId: schedule.id, reportId, userId });

    return schedule;
  },

  /**
   * Get user's schedules
   */
  async getUserSchedules(userId) {
    return await customReportRepository.findUserSchedules(userId);
  },

  /**
   * Update schedule
   */
  async updateSchedule(scheduleId, data, userId) {
    const schedule = await customReportRepository.findScheduleById(scheduleId);

    if (!schedule || schedule.created_by !== userId) {
      throw new Error('Schedule tidak ditemukan');
    }

    const updateData = {};
    if (data.frequency) updateData.frequency = data.frequency;
    if (data.day_of_week !== undefined) updateData.day_of_week = data.day_of_week;
    if (data.day_of_month !== undefined) updateData.day_of_month = data.day_of_month;
    if (data.time_of_day) updateData.time_of_day = data.time_of_day;
    if (data.recipients) updateData.recipients = JSON.stringify(data.recipients);
    if (data.delivery_method) updateData.delivery_method = data.delivery_method;
    if (data.export_format) updateData.export_format = data.export_format;

    // Recalculate next run if frequency changed
    if (data.frequency) {
      updateData.next_run_date = this._calculateNextRunDate(data.frequency, data);
    }

    return await customReportRepository.updateSchedule(scheduleId, updateData);
  },

  /**
   * Pause schedule
   */
  async pauseSchedule(scheduleId, userId) {
    const schedule = await customReportRepository.findScheduleById(scheduleId);

    if (!schedule || schedule.created_by !== userId) {
      throw new Error('Schedule tidak ditemukan');
    }

    return await customReportRepository.pauseSchedule(scheduleId);
  },

  /**
   * Resume schedule
   */
  async resumeSchedule(scheduleId, userId) {
    const schedule = await customReportRepository.findScheduleById(scheduleId);

    if (!schedule || schedule.created_by !== userId) {
      throw new Error('Schedule tidak ditemukan');
    }

    // Recalculate next run
    await customReportRepository.updateSchedule(scheduleId, {
      next_run_date: this._calculateNextRunDate(schedule.frequency, schedule),
    });

    return await customReportRepository.resumeSchedule(scheduleId);
  },

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId, userId) {
    const schedule = await customReportRepository.findScheduleById(scheduleId);

    if (!schedule || schedule.created_by !== userId) {
      throw new Error('Schedule tidak ditemukan');
    }

    return await customReportRepository.deleteSchedule(scheduleId);
  },

  /**
   * Process due scheduled reports
   */
  async processDueSchedules() {
    const dueSchedules = await customReportRepository.findDueSchedules();

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    for (const schedule of dueSchedules) {
      results.processed++;

      try {
        // Execute report
        const result = await this.executeReport(schedule.report_id, schedule.created_by);

        // Export if needed
        if (schedule.export_format) {
          const reportExporter = require('../utils/reportExporter');
          await reportExporter.export(result, schedule.export_format, {
            scheduleId: schedule.id,
          });
        }

        // TODO: Send to recipients via delivery_method

        // Update schedule
        const nextRunDate = this._calculateNextRunDate(schedule.frequency, schedule);
        await customReportRepository.markScheduleRun(schedule.id, nextRunDate);

        results.succeeded++;

        logger.info('Scheduled report processed', { scheduleId: schedule.id });
      } catch (error) {
        results.failed++;
        results.errors.push({
          scheduleId: schedule.id,
          error: error.message,
        });

        logger.error('Scheduled report failed', {
          scheduleId: schedule.id,
          error: error.message,
        });
      }
    }

    return results;
  },

  // ============ Private Methods ============

  /**
   * Execute standard report
   * @private
   */
  async _executeStandardReport(filters, config) {
    const options = {
      includeCategory: true,
      includeUser: config.includeUser || false,
      sortBy: config.sortBy || 'transaction_date',
      sortOrder: config.sortOrder || 'desc',
      limit: config.limit || 100,
      offset: config.offset || 0,
    };

    const [data, summary, count] = await Promise.all([
      reportDataRepository.executeReport(filters, options),
      reportDataRepository.getReportSummary(filters),
      reportDataRepository.getReportCount(filters),
    ]);

    // Get grouped data if specified
    let groupedData = null;
    if (config.groupBy) {
      groupedData = await reportDataRepository.getGroupedData(filters, config.groupBy);
    }

    return {
      data,
      summary,
      grouped: groupedData,
      pagination: {
        total: count,
        limit: options.limit,
        offset: options.offset,
      },
    };
  },

  /**
   * Execute trend report
   * @private
   */
  async _executeTrendReport(filters, config) {
    const interval = config.interval || 'day';

    const [trendData, summary] = await Promise.all([
      reportDataRepository.getTrendData(filters, interval),
      reportDataRepository.getReportSummary(filters),
    ]);

    return {
      data: trendData,
      summary,
      chart_type: 'line',
      interval,
    };
  },

  /**
   * Execute comparison report
   * @private
   */
  async _executeComparisonReport(filters, config) {
    // eslint-disable-line no-unused-vars
    // Determine periods
    const currentEnd = dayjs(filters.endDate || new Date());
    const currentStart = dayjs(filters.startDate || currentEnd.subtract(30, 'day'));
    const periodLength = currentEnd.diff(currentStart, 'day');

    const currentPeriod = {
      start: currentStart.format('YYYY-MM-DD'),
      end: currentEnd.format('YYYY-MM-DD'),
    };

    const previousPeriod = {
      start: currentStart.subtract(periodLength, 'day').format('YYYY-MM-DD'),
      end: currentStart.subtract(1, 'day').format('YYYY-MM-DD'),
    };

    const comparison = await reportDataRepository.getComparisonData(
      filters,
      currentPeriod,
      previousPeriod
    );

    return {
      data: comparison,
      summary: comparison.current,
      periods: { current: currentPeriod, previous: previousPeriod },
    };
  },

  /**
   * Execute summary report
   * @private
   */
  async _executeSummaryReport(filters, config) {
    const [summary, byCategory, byType, byUser, topItems] = await Promise.all([
      reportDataRepository.getReportSummary(filters),
      reportDataRepository.getGroupedData(filters, 'category'),
      reportDataRepository.getGroupedData(filters, 'type'),
      config.includeUser ? reportDataRepository.getGroupedData(filters, 'user') : null,
      reportDataRepository.getTopItems(filters, 'categories', 5),
    ]);

    return {
      data: {
        by_category: byCategory,
        by_type: byType,
        by_user: byUser,
        top_categories: topItems,
      },
      summary,
    };
  },

  /**
   * Validate report config
   * @private
   */
  _validateReportConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Config report tidak valid');
    }

    // Validate filters if present
    if (config.filters) {
      const { startDate, endDate } = config.filters;
      if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
        throw new Error('Tanggal mulai tidak boleh setelah tanggal akhir');
      }
    }

    return true;
  },

  /**
   * Calculate next run date for schedule
   * @private
   */
  _calculateNextRunDate(frequency, config) {
    let next = dayjs();

    switch (frequency) {
      case 'daily':
        next = next.add(1, 'day');
        break;

      case 'weekly': {
        const dayOfWeek = config.day_of_week || 'monday';
        const dayMap = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const targetDay = dayMap[dayOfWeek.toLowerCase()] || 1;
        next = next.day(targetDay);
        if (next.isBefore(dayjs()) || next.isSame(dayjs(), 'day')) {
          next = next.add(1, 'week');
        }
        break;
      }

      case 'monthly': {
        const dayOfMonth = config.day_of_month || 1;
        next = next.date(dayOfMonth);
        if (next.isBefore(dayjs()) || next.isSame(dayjs(), 'day')) {
          next = next.add(1, 'month');
        }
        break;
      }

      default:
        next = next.add(1, 'day');
    }

    return next.format('YYYY-MM-DD');
  },

  /**
   * Format report for output
   * @private
   */
  _formatReport(report) {
    if (!report) return null;

    return {
      ...report,
      config: typeof report.config === 'string' ? JSON.parse(report.config) : report.config,
    };
  },
};
