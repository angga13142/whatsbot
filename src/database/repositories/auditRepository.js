// File: src/database/repositories/auditRepository.js

const db = require('../connection');

module.exports = {
  /**
   * Log activity
   * @param {number} userId - User ID
   * @param {string} action - Action name
   * @param {string} entityType - Entity type (optional)
   * @param {number} entityId - Entity ID (optional)
   * @param {Object} details - Additional details (optional)
   * @returns {Promise<Object>} Created log
   */
  async log(userId, action, entityType = null, entityId = null, details = {}) {
    try {
      const [id] = await db('audit_logs')
        .insert({
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details: JSON.stringify(details),
          created_at: db.fn.now(),
        })
        .returning('id');

      // We generally don't wait to fetch the log back to save perf, but for pattern consistency:
      const newId = typeof id === 'object' ? id.id : id;
      return { id: newId, action };
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Ensure we don't return null so destructuring doesn't fail, but log is basically void
      return {};
    }
  },

  /**
   * Find logs by user
   * @param {number} userId - User ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Audit logs
   */
  async findByUser(userId, limit = 100) {
    try {
      return await db('audit_logs')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .limit(limit);
    } catch (error) {
      throw new Error(`Failed to find user logs: ${error.message}`);
    }
  },

  /**
   * Find logs by action
   * @param {string} action - Action name
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Audit logs
   */
  async findByAction(action, limit = 100) {
    try {
      return await db('audit_logs')
        .join('users', 'audit_logs.user_id', 'users.id')
        .select('audit_logs.*', 'users.full_name', 'users.phone_number')
        .where({ action })
        .orderBy('created_at', 'desc')
        .limit(limit);
    } catch (error) {
      throw new Error(`Failed to find logs by action: ${error.message}`);
    }
  },

  /**
   * Find logs by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Audit logs
   */
  async findByDateRange(startDate, endDate) {
    try {
      return await db('audit_logs')
        .whereBetween('created_at', [startDate, endDate])
        .orderBy('created_at', 'desc');
    } catch (error) {
      throw new Error(`Failed to find logs by date: ${error.message}`);
    }
  },

  /**
   * Find critical actions
   * @returns {Promise<Array>} Critical audit logs
   */
  async findCriticalActions() {
    const criticalActions = [
      'delete_user',
      'delete_transaction',
      'change_role',
      'suspend_user',
      'execute_sql',
    ];
    try {
      return await db('audit_logs')
        .join('users', 'audit_logs.user_id', 'users.id')
        .select('audit_logs.*', 'users.full_name')
        .whereIn('action', criticalActions)
        .orderBy('created_at', 'desc')
        .limit(50);
    } catch (error) {
      throw new Error(`Failed to find critical actions: ${error.message}`);
    }
  },
};
