/**
 * Authorization Middleware
 *
 * Handles permissions and access control
 * Implements role-based and resource-based authorization
 */

const logger = require('../utils/logger');

class AuthorizationMiddleware {
  constructor() {
    // Role hierarchy (higher number = more permissions)
    this.roleHierarchy = {
      staff: 1,
      admin: 2,
      superadmin: 3,
    };

    // Permission definitions
    this.permissions = {
      // Transaction permissions
      'transaction:create': ['staff', 'admin', 'superadmin'],
      'transaction:edit:own': ['staff', 'admin', 'superadmin'],
      'transaction:edit:any': ['admin', 'superadmin'],
      'transaction:delete:own': ['admin', 'superadmin'],
      'transaction:delete:any': ['superadmin'],
      'transaction:approve': ['admin', 'superadmin'],

      // Report permissions
      'report:create': ['staff', 'admin', 'superadmin'],
      'report:view:own': ['staff', 'admin', 'superadmin'],
      'report:view:any': ['admin', 'superadmin'],
      'report:delete:own': ['staff', 'admin', 'superadmin'],
      'report:delete:any': ['admin', 'superadmin'],

      // User management
      'user:create': ['admin', 'superadmin'],
      'user:edit': ['superadmin'],
      'user:delete': ['superadmin'],
      'user:view:all': ['admin', 'superadmin'],

      // System operations
      'system:settings': ['superadmin'],
      'system:audit': ['admin', 'superadmin'],
      'system:backup': ['superadmin'],
    };
  }

  /**
   * Check if user has permission
   * @param {Object} user - User object
   * @param {string} permission - Permission string
   * @returns {boolean}
   */
  hasPermission(user, permission) {
    if (!user || !user.role) {
      logger.warn('Authorization check failed:  invalid user', { user });
      return false;
    }

    const allowedRoles = this.permissions[permission];

    if (!allowedRoles) {
      logger.warn('Unknown permission requested', { permission });
      return false;
    }

    return allowedRoles.includes(user.role);
  }

  /**
   * Require permission (throws if not authorized)
   * @param {Object} user - User object
   * @param {string} permission - Permission string
   * @throws {Error} If not authorized
   */
  requirePermission(user, permission) {
    if (!this.hasPermission(user, permission)) {
      logger.warn('Authorization denied', {
        userId: user.id,
        role: user.role,
        permission,
      });

      throw new Error('You do not have permission to perform this action.');
    }

    return true;
  }

  /**
   * Check if user can access report
   * @param {number} userId - User ID
   * @param {number} reportId - Report ID
   * @returns {Promise<Object>} { authorized: boolean, reason?: string }
   */
  async canAccessReport(userId, reportId) {
    try {
      const knex = require('../database/connection');

      // Get report
      const report = await knex('custom_reports').where({ id: reportId }).first();

      if (!report) {
        return { authorized: false, reason: 'Report not found' };
      }

      // Owner can always access
      if (report.created_by === userId) {
        return { authorized: true };
      }

      // Check visibility
      if (report.visibility === 'public') {
        return { authorized: true };
      }

      // Get user
      const user = await knex('users').where({ id: userId }).first();

      if (!user) {
        return { authorized: false, reason: 'User not found' };
      }

      // Admins can access all
      if (['admin', 'superadmin'].includes(user.role)) {
        return { authorized: true };
      }

      // Check if shared with user
      if (report.visibility === 'shared') {
        // TODO: Implement shared report recipients table
        // For now, deny access
        return { authorized: false, reason: 'Report not shared with you' };
      }

      return { authorized: false, reason: 'Access denied' };
    } catch (error) {
      logger.error('Error checking report access', {
        userId,
        reportId,
        error: error.message,
      });
      return { authorized: false, reason: 'Authorization check failed' };
    }
  }

  /**
   * Require report access (throws if not authorized)
   * @param {number} userId - User ID
   * @param {number} reportId - Report ID
   * @throws {Error} If not authorized
   */
  async requireReportAccess(userId, reportId) {
    const result = await this.canAccessReport(userId, reportId);

    if (!result.authorized) {
      throw new Error(result.reason || 'Access denied');
    }

    return true;
  }

  /**
   * Check if user can access transaction
   * @param {number} userId - User ID
   * @param {number} transactionId - Transaction ID
   * @param {string} action - Action (view, edit, delete)
   * @returns {Promise<Object>}
   */
  async canAccessTransaction(userId, transactionId, action = 'view') {
    try {
      const knex = require('../database/connection');

      // Get transaction
      const transaction = await knex('transactions').where({ id: transactionId }).first();

      if (!transaction) {
        return { authorized: false, reason: 'Transaction not found' };
      }

      // Get user
      const user = await knex('users').where({ id: userId }).first();

      if (!user) {
        return { authorized: false, reason: 'User not found' };
      }

      // Check based on action
      switch (action) {
        case 'view':
          // Users can view their own, admins can view all
          if (transaction.user_id === userId || ['admin', 'superadmin'].includes(user.role)) {
            return { authorized: true };
          }
          break;

        case 'edit':
          // Owner can edit own (if pending), admins can edit any
          if (transaction.user_id === userId && transaction.status === 'pending') {
            return { authorized: true };
          }
          if (['admin', 'superadmin'].includes(user.role)) {
            return { authorized: true };
          }
          break;

        case 'delete':
          // Only admins can delete
          if (['admin', 'superadmin'].includes(user.role)) {
            return { authorized: true };
          }
          break;

        case 'approve':
          // Only admins can approve
          if (['admin', 'superadmin'].includes(user.role)) {
            return { authorized: true };
          }
          break;

        default:
          return { authorized: false, reason: 'Invalid action' };
      }

      return { authorized: false, reason: 'Access denied' };
    } catch (error) {
      logger.error('Error checking transaction access', {
        userId,
        transactionId,
        action,
        error: error.message,
      });
      return { authorized: false, reason: 'Authorization check failed' };
    }
  }

  /**
   * Require transaction access
   * @param {number} userId - User ID
   * @param {number} transactionId - Transaction ID
   * @param {string} action - Action
   * @throws {Error} If not authorized
   */
  async requireTransactionAccess(userId, transactionId, action) {
    const result = await this.canAccessTransaction(userId, transactionId, action);

    if (!result.authorized) {
      throw new Error(result.reason || 'Access denied');
    }

    return true;
  }

  /**
   * Check if user can access schedule
   * @param {number} userId - User ID
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Object>}
   */
  async canAccessSchedule(userId, scheduleId) {
    try {
      const knex = require('../database/connection');

      const schedule = await knex('scheduled_reports').where({ id: scheduleId }).first();

      if (!schedule) {
        return { authorized: false, reason: 'Schedule not found' };
      }

      // Owner can access
      if (schedule.created_by === userId) {
        return { authorized: true };
      }

      // Admins can access all
      const user = await knex('users').where({ id: userId }).first();
      if (['admin', 'superadmin'].includes(user.role)) {
        return { authorized: true };
      }

      return { authorized: false, reason: 'Access denied' };
    } catch (error) {
      logger.error('Error checking schedule access', { error: error.message });
      return { authorized: false, reason: 'Authorization check failed' };
    }
  }

  /**
   * Require schedule access
   */
  async requireScheduleAccess(userId, scheduleId) {
    const result = await this.canAccessSchedule(userId, scheduleId);

    if (!result.authorized) {
      throw new Error(result.reason || 'Access denied');
    }

    return true;
  }

  /**
   * Check role level
   * @param {Object} user - User object
   * @param {string} requiredRole - Required role
   * @returns {boolean}
   */
  hasRoleLevel(user, requiredRole) {
    const userLevel = this.roleHierarchy[user.role] || 0;
    const requiredLevel = this.roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Require role level
   * @param {Object} user - User object
   * @param {string} requiredRole - Required role
   * @throws {Error} If insufficient role
   */
  requireRoleLevel(user, requiredRole) {
    if (!this.hasRoleLevel(user, requiredRole)) {
      throw new Error(`This action requires ${requiredRole} role or higher.`);
    }

    return true;
  }

  /**
   * Log authorization event
   * @private
   */
  async _logAuthEvent(userId, resource, action, authorized) {
    try {
      const knex = require('../database/connection');

      await knex('audit_logs').insert({
        user_id: userId,
        action: `auth:${action}`,
        target_type: resource,
        result: authorized ? 'granted' : 'denied',
        created_at: new Date(),
      });
    } catch (error) {
      logger.error('Failed to log auth event', { error: error.message });
    }
  }
}

// Create singleton
const authMiddleware = new AuthorizationMiddleware();

module.exports = authMiddleware;
