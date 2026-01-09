/**
 * Authentication Middleware
 *
 * Provides authentication and authorization checks
 */

const userRepository = require('../../database/repositories/userRepository');
const auditRepository = require('../../database/repositories/auditRepository');
const logger = require('../../utils/logger');
const { PERMISSIONS, USER_STATUS } = require('../../utils/constants');
const bcrypt = require('bcrypt');

module.exports = {
  /**
   * Check if user is registered
   * @param {string} phoneNumber - User phone number
   * @returns {Promise<Object|null>} User object or null
   */
  async checkUserRegistered(phoneNumber) {
    try {
      const user = await userRepository.findByPhone(phoneNumber);
      return user;
    } catch (error) {
      logger.error('Error checking user registration', {
        phoneNumber,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Check if user is active
   * @param {string} phoneNumber - User phone number
   * @returns {Promise<boolean>} True if active
   */
  async checkUserActive(phoneNumber) {
    try {
      const user = await userRepository.findByPhone(phoneNumber);
      if (!user) {
        return false;
      }
      return user.status === USER_STATUS.ACTIVE;
    } catch (error) {
      logger.error('Error checking user status', {
        phoneNumber,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Check if user has permission
   * @param {Object} user - User object
   * @param {string} permission - Permission to check
   * @returns {Promise<boolean>} True if has permission
   */
  async checkPermission(user, permission) {
    try {
      if (!user || !user.role) {
        return false;
      }

      const rolePermissions = PERMISSIONS[user.role];
      if (!rolePermissions) {
        return false;
      }

      // If no specific permission required, allow
      if (!permission) {
        return true;
      }

      return rolePermissions[permission] === true;
    } catch (error) {
      logger.error('Error checking permission', {
        userId: user?.id,
        permission,
        error: error.message,
      });
      return false;
    }
  },

  /**
   * Check role hierarchy (can manage target role?)
   * @param {Object} user - User object
   * @param {string} targetRole - Target role to manage
   * @returns {boolean} True if can manage
   */
  checkRoleHierarchy(user, targetRole) {
    const roleHierarchy = {
      superadmin: ['superadmin', 'admin', 'karyawan', 'investor'],
      admin: ['karyawan', 'investor'],
      karyawan: [],
      investor: [],
    };

    const allowedRoles = roleHierarchy[user.role] || [];
    return allowedRoles.includes(targetRole);
  },

  /**
   * Verify 2FA PIN
   * @param {Object} user - User object
   * @param {string} pin - PIN to verify
   * @returns {Promise<boolean>} True if PIN is correct
   */
  async verify2FA(user, pin) {
    try {
      if (!user.pin) {
        logger.warn('User has no PIN set', { userId: user.id });
        return false;
      }

      const isValid = await bcrypt.compare(pin, user.pin);

      await this.logActivity(user.id, '2fa_verification', 'user', user.id, { success: isValid });

      return isValid;
    } catch (error) {
      logger.error('Error verifying 2FA', {
        userId: user.id,
        error: error.message,
      });
      return false;
    }
  },

  /**
   * Log activity to audit log
   * @param {number} userId - User ID
   * @param {string} action - Action name
   * @param {string} entityType - Entity type (optional)
   * @param {number} entityId - Entity ID (optional)
   * @param {Object} details - Additional details (optional)
   * @returns {Promise<void>}
   */
  async logActivity(userId, action, entityType = null, entityId = null, details = {}) {
    try {
      await auditRepository.log(userId, action, entityType, entityId, details);
    } catch (error) {
      logger.error('Error logging activity', {
        userId,
        action,
        error: error.message,
      });
      // Don't throw - logging failures shouldn't break the flow
    }
  },
};
