/**
 * Scheduled Report Service
 *
 * Manage scheduled report delivery
 */

const reportBuilderService = require('./reportBuilderService');
const reportExporter = require('../utils/reportExporter');
const dashboardService = require('./dashboardService');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class ScheduledReportService {
  /**
   * Create scheduled report
   * @param {Object} scheduleData - Schedule configuration
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async createSchedule(scheduleData, userId) {
    try {
      const knex = require('../database/connection');

      // Validate schedule data
      this._validateSchedule(scheduleData);

      // Calculate next run date
      const nextRunDate = this._calculateNextRun(
        scheduleData.frequency,
        scheduleData.dayOfWeek,
        scheduleData.dayOfMonth,
        scheduleData.timeOfDay
      );

      const [id] = await knex('scheduled_reports')
        .insert({
          report_id: scheduleData.reportId || null,
          created_by: userId,
          frequency: scheduleData.frequency,
          day_of_week: scheduleData.dayOfWeek || null,
          day_of_month: scheduleData.dayOfMonth || null,
          time_of_day: scheduleData.timeOfDay || '09:00:00',
          recipients: JSON.stringify(scheduleData.recipients),
          delivery_method: scheduleData.deliveryMethod || 'whatsapp',
          export_format: scheduleData.exportFormat || 'excel',
          status: 'active',
          next_run_date: nextRunDate,
        })
        .returning('id');

      logger.info('Scheduled report created', { scheduleId: id, userId });

      return await this.getSchedule(id);
    } catch (error) {
      logger.error('Error creating schedule', { error: error.message });
      throw error;
    }
  }

  /**
   * Get schedule by ID
   * @param {number} id - Schedule ID
   * @returns {Promise<Object>}
   */
  async getSchedule(id) {
    try {
      const knex = require('../database/connection');

      const schedule = await knex('scheduled_reports').where({ id }).first();

      if (schedule && schedule.recipients) {
        schedule.recipients = JSON.parse(schedule.recipients);
      }

      return schedule;
    } catch (error) {
      logger.error('Error getting schedule', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user's schedules
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserSchedules(userId) {
    try {
      const knex = require('../database/connection');

      const schedules = await knex('scheduled_reports')
        .where({ created_by: userId })
        .orderBy('next_run_date', 'asc');

      return schedules.map((s) => ({
        ...s,
        recipients: JSON.parse(s.recipients),
      }));
    } catch (error) {
      logger.error('Error getting user schedules', { error: error.message });
      throw error;
    }
  }

  /**
   * Process due schedules
   * @returns {Promise<Object>} Processing results
   */
  async processDueSchedules() {
    try {
      const knex = require('../database/connection');

      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

      // Get due schedules
      const dueSchedules = await knex('scheduled_reports')
        .where('status', 'active')
        .where('next_run_date', '<=', now);

      logger.info('Processing due schedules', { count: dueSchedules.length });

      const results = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
      };

      for (const schedule of dueSchedules) {
        results.processed++;

        try {
          await this._executeSchedule(schedule);
          results.succeeded++;

          // Update next run date
          const nextRunDate = this._calculateNextRun(
            schedule.frequency,
            schedule.day_of_week,
            schedule.day_of_month,
            schedule.time_of_day
          );

          await knex('scheduled_reports')
            .where({ id: schedule.id })
            .update({
              last_run_date: knex.fn.now(),
              next_run_date: nextRunDate,
              total_runs: knex.raw('total_runs + 1'),
            });
        } catch (error) {
          results.failed++;
          results.errors.push({
            scheduleId: schedule.id,
            error: error.message,
          });

          logger.error('Error executing schedule', {
            scheduleId: schedule.id,
            error: error.message,
          });
        }
      }

      logger.info('Schedule processing complete', results);

      return results;
    } catch (error) {
      logger.error('Error processing schedules', { error: error.message });
      throw error;
    }
  }

  /**
   * Update schedule
   * @param {number} id - Schedule ID
   * @param {Object} updates - Updates
   * @returns {Promise<Object>}
   */
  async updateSchedule(id, updates) {
    try {
      const knex = require('../database/connection');

      if (updates.recipients) {
        updates.recipients = JSON.stringify(updates.recipients);
      }

      await knex('scheduled_reports').where({ id }).update(updates);

      return await this.getSchedule(id);
    } catch (error) {
      logger.error('Error updating schedule', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete schedule
   * @param {number} id - Schedule ID
   * @returns {Promise<boolean>}
   */
  async deleteSchedule(id) {
    try {
      const knex = require('../database/connection');

      await knex('scheduled_reports').where({ id }).delete();

      logger.info('Schedule deleted', { scheduleId: id });

      return true;
    } catch (error) {
      logger.error('Error deleting schedule', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute schedule
   * @private
   */
  async _executeSchedule(schedule) {
    const recipients = JSON.parse(schedule.recipients);

    // Build filters for report
    const filters = this._buildFiltersForSchedule(schedule);

    // Generate report based on format
    let reportPath;

    if (schedule.export_format === 'pdf') {
      const pdfGenerator = require('../utils/pdfGenerator');
      const reportData = await reportBuilderService.executeReport(
        schedule.report_id,
        filters,
        schedule.created_by
      );
      reportPath = await pdfGenerator.generatePDF(reportData, {
        title: 'Scheduled Report',
      });
    } else if (schedule.export_format === 'dashboard') {
      reportPath = await dashboardService.generateDashboard(filters);
    } else {
      const reportData = await reportBuilderService.executeReport(
        schedule.report_id,
        filters,
        schedule.created_by
      );
      const result = await reportExporter.export(reportData, 'excel');
      reportPath = result.filepath;
    }

    // Deliver to recipients
    await this._deliverReport(reportPath, recipients, schedule);

    logger.info('Schedule executed', { scheduleId: schedule.id });
  }

  /**
   * Deliver report
   * @private
   */
  async _deliverReport(reportPath, recipients, schedule) {
    // // const { MessageMedia } = require('whatsapp-web.js');

    // Get WhatsApp client (this would need to be passed from bot instance)
    // For now, log the delivery
    logger.info('Report delivery', {
      reportPath,
      recipients: recipients.length,
      method: schedule.delivery_method,
    });

    // In production, you would send via WhatsApp or email
    // Implementation depends on your bot architecture
  }

  /**
   * Build filters for schedule
   * @private
   */
  _buildFiltersForSchedule(schedule) {
    const now = dayjs();

    switch (schedule.frequency) {
      case 'daily':
        return {
          startDate: now.startOf('day').toDate(),
          endDate: now.endOf('day').toDate(),
        };

      case 'weekly':
        return {
          startDate: now.startOf('week').toDate(),
          endDate: now.endOf('week').toDate(),
        };

      case 'monthly':
        return {
          startDate: now.startOf('month').toDate(),
          endDate: now.endOf('month').toDate(),
        };

      default:
        return {
          startDate: now.subtract(30, 'day').toDate(),
          endDate: now.toDate(),
        };
    }
  }

  /**
   * Calculate next run date
   * @private
   */
  _calculateNextRun(frequency, dayOfWeek, dayOfMonth, timeOfDay) {
    const now = dayjs();
    const [hours, minutes] = (timeOfDay || '09:00:00').split(':');

    let nextRun;

    switch (frequency) {
      case 'daily':
        nextRun = now.add(1, 'day').hour(hours).minute(minutes).second(0);
        break;

      case 'weekly':
        nextRun = now.add(1, 'week');
        if (dayOfWeek) {
          const dayMap = {
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
            sunday: 0,
          };
          nextRun = nextRun.day(dayMap[dayOfWeek.toLowerCase()]);
        }
        nextRun = nextRun.hour(hours).minute(minutes).second(0);
        break;

      case 'monthly':
        nextRun = now.add(1, 'month');
        if (dayOfMonth) {
          nextRun = nextRun.date(dayOfMonth);
        }
        nextRun = nextRun.hour(hours).minute(minutes).second(0);
        break;

      default:
        nextRun = now.add(1, 'day').hour(hours).minute(minutes).second(0);
    }

    return nextRun.format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Validate schedule
   * @private
   */
  _validateSchedule(scheduleData) {
    if (!scheduleData.frequency) {
      throw new Error('Frequency is required');
    }

    if (!['daily', 'weekly', 'monthly'].includes(scheduleData.frequency)) {
      throw new Error('Invalid frequency');
    }

    if (!scheduleData.recipients || scheduleData.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }
  }
}

module.exports = new ScheduledReportService();
