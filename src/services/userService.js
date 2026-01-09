/**
 * User Service
 *
 * Business logic for user management including:
 * - User creation with role validation
 * - User updates with permission checks
 * - User suspension/deletion
 * - Role changes (superadmin only)
 * - 2FA (PIN) setup and verification
 * - Permission checking
 */

const userRepository = require('../database/repositories/userRepository');
const auditRepository = require('../database/repositories/auditRepository');
const logger = require('../utils/logger');
const validator = require('../utils/validator');
const bcrypt = require('bcrypt');

// Constants
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  KARYAWAN: 'karyawan',
  INVESTOR: 'investor',
  CUSTOMER: 'customer',
};

const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
};

class UserService {
  /**
   * Create new user
   * @param {string} phoneNumber - Phone number
   * @param {string} fullName - Full name
   * @param {string} role - User role
   * @param {number} createdBy - Creator user ID
   * @returns {Promise<Object>} Created user
   */
  async createUser(phoneNumber, fullName, role, createdBy) {
    try {
      // 1. Validate phone number
      const phoneValidation = validator.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error);
      }
      const normalizedPhone = phoneValidation.formatted;

      // 2. Validate role
      const roleValidation = validator.validateRole(role);
      if (!roleValidation.valid) {
        throw new Error(roleValidation.error);
      }

      // 3. Validate full name
      if (!fullName || fullName.trim().length < 3) {
        throw new Error('Nama lengkap minimal 3 karakter');
      }

      // 4. Check if user already exists
      const existingUser = await userRepository.findByPhone(normalizedPhone);
      if (existingUser) {
        throw new Error('User dengan nomor telepon ini sudah terdaftar');
      }

      // 5. Get creator info (for permission check)
      const creator = await userRepository.findById(createdBy);
      if (!creator) {
        throw new Error('Creator tidak ditemukan');
      }

      // 6. Check if creator can create this role
      if (!this._canManageRole(creator.role, role)) {
        throw new Error(`Anda tidak memiliki izin untuk membuat user dengan role ${role}`);
      }

      // 7. Create user
      const userData = {
        phone_number: normalizedPhone,
        full_name: fullName.trim(),
        role,
        status: USER_STATUS.ACTIVE,
        created_by: createdBy,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const user = await userRepository.create(userData);

      // 8. Log activity
      await auditRepository.log(createdBy, 'create_user', 'user', user.id, {
        role,
        phone: normalizedPhone,
        name: fullName,
      });

      logger.info('User created successfully', {
        userId: user.id,
        role,
        createdBy,
      });

      return user;
    } catch (error) {
      logger.error('Error creating user', {
        phoneNumber,
        role,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user by phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object|null>} User or null
   */
  async getUserByPhone(phoneNumber) {
    try {
      const phoneValidation = validator.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.valid) {
        return null;
      }

      return await userRepository.findByPhone(phoneValidation.formatted);
    } catch (error) {
      logger.error('Error getting user by phone', {
        phoneNumber,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async getUserById(id) {
    try {
      return await userRepository.findById(id);
    } catch (error) {
      logger.error('Error getting user by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updates - Updates to apply
   * @param {number} updatedBy - Updater user ID
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updates, updatedBy) {
    try {
      // 1. Get existing user
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      // 2. Get updater info
      const updater = await userRepository.findById(updatedBy);
      if (!updater) {
        throw new Error('Updater tidak ditemukan');
      }

      // 3. Check permissions
      if (!this._canManageRole(updater.role, user.role)) {
        throw new Error('Anda tidak memiliki izin untuk mengupdate user ini');
      }

      // 4. Validate updates
      const allowedFields = ['full_name', 'metadata'];
      const sanitizedUpdates = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      }

      if (Object.keys(sanitizedUpdates).length === 0) {
        throw new Error('Tidak ada field yang dapat diupdate');
      }

      sanitizedUpdates.updated_at = new Date();

      // 5. Update user
      const updatedUser = await userRepository.update(id, sanitizedUpdates);

      // 6. Log activity
      await auditRepository.log(updatedBy, 'update_user', 'user', id, {
        updates: sanitizedUpdates,
      });

      logger.info('User updated successfully', { userId: id, updatedBy });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Suspend user
   * @param {number} id - User ID
   * @param {string} reason - Suspension reason
   * @param {number} suspendedBy - User ID who suspended
   * @returns {Promise<Object>} Updated user
   */
  async suspendUser(id, reason, suspendedBy) {
    try {
      // 1. Get user
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      // 2. Get suspender
      const suspender = await userRepository.findById(suspendedBy);
      if (!suspender) {
        throw new Error('Suspender tidak ditemukan');
      }

      // 3. Check permissions
      if (!this._canManageRole(suspender.role, user.role)) {
        throw new Error('Anda tidak memiliki izin untuk suspend user ini');
      }

      // 4. Check if already suspended
      if (user.status === USER_STATUS.SUSPENDED) {
        throw new Error('User sudah dalam status suspended');
      }

      // 5. Suspend user
      await userRepository.suspend(id);

      // 6. Log activity
      await auditRepository.log(suspendedBy, 'suspend_user', 'user', id, {
        reason,
        previousStatus: user.status,
      });

      logger.info('User suspended', {
        userId: id,
        reason,
        suspendedBy,
      });

      return await userRepository.findById(id);
    } catch (error) {
      logger.error('Error suspending user', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Unsuspend user
   * @param {number} id - User ID
   * @param {number} unsuspendedBy - User ID who unsuspended
   * @returns {Promise<Object>} Updated user
   */
  async unsuspendUser(id, unsuspendedBy) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      const unsuspender = await userRepository.findById(unsuspendedBy);
      if (!unsuspender) {
        throw new Error('Unsuspender tidak ditemukan');
      }

      if (!this._canManageRole(unsuspender.role, user.role)) {
        throw new Error('Anda tidak memiliki izin untuk unsuspend user ini');
      }

      if (user.status !== USER_STATUS.SUSPENDED) {
        throw new Error('User tidak dalam status suspended');
      }

      await userRepository.unsuspend(id);

      await auditRepository.log(unsuspendedBy, 'unsuspend_user', 'user', id, {
        previousStatus: user.status,
      });

      logger.info('User unsuspended', { userId: id, unsuspendedBy });

      return await userRepository.findById(id);
    } catch (error) {
      logger.error('Error unsuspending user', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {number} id - User ID
   * @param {number} deletedBy - User ID who deleted
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(id, deletedBy) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      const deleter = await userRepository.findById(deletedBy);
      if (!deleter) {
        throw new Error('Deleter tidak ditemukan');
      }

      // Only superadmin can delete
      if (deleter.role !== ROLES.SUPERADMIN) {
        throw new Error('Hanya superadmin yang dapat menghapus user');
      }

      await userRepository.delete(id);

      await auditRepository.log(deletedBy, 'delete_user', 'user', id, {
        deletedRole: user.role,
        deletedPhone: user.phone_number,
      });

      logger.info('User deleted', { userId: id, deletedBy });

      return true;
    } catch (error) {
      logger.error('Error deleting user', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Change user role
   * @param {number} id - User ID
   * @param {string} newRole - New role
   * @param {number} changedBy - User ID who changed
   * @returns {Promise<Object>} Updated user
   */
  async changeUserRole(id, newRole, changedBy) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      const changer = await userRepository.findById(changedBy);
      if (!changer) {
        throw new Error('Changer tidak ditemukan');
      }

      // Only superadmin can change roles
      if (changer.role !== ROLES.SUPERADMIN) {
        throw new Error('Hanya superadmin yang dapat mengubah role');
      }

      const roleValidation = validator.validateRole(newRole);
      if (!roleValidation.valid) {
        throw new Error(roleValidation.error);
      }

      const oldRole = user.role;
      await userRepository.update(id, { role: newRole, updated_at: new Date() });

      await auditRepository.log(changedBy, 'change_user_role', 'user', id, { oldRole, newRole });

      logger.info('User role changed', {
        userId: id,
        oldRole,
        newRole,
        changedBy,
      });

      return await userRepository.findById(id);
    } catch (error) {
      logger.error('Error changing user role', {
        id,
        newRole,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup 2FA PIN for user
   * @param {number} id - User ID
   * @param {string} pin - PIN (will be hashed)
   * @returns {Promise<boolean>} Success status
   */
  async setup2FA(id, pin) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      // Validate PIN
      if (!/^\d{6}$/.test(pin)) {
        throw new Error('PIN harus 6 digit angka');
      }

      // Hash PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      // Update user
      await userRepository.updatePin(id, hashedPin);

      await auditRepository.log(id, 'setup_2fa', 'user', id, { action: 'PIN created/updated' });

      logger.info('2FA PIN setup', { userId: id });

      return true;
    } catch (error) {
      logger.error('Error setting up 2FA', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify 2FA PIN
   * @param {number} id - User ID
   * @param {string} pin - PIN to verify
   * @returns {Promise<boolean>} True if valid
   */
  async verify2FA(id, pin) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      if (!user.pin) {
        throw new Error('PIN belum di-setup');
      }

      const isValid = await bcrypt.compare(pin, user.pin);

      await auditRepository.log(id, '2fa_verification', 'user', id, { success: isValid });

      return isValid;
    } catch (error) {
      logger.error('Error verifying 2FA', {
        id,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * List users with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of users
   */
  async listUsers(filters = {}) {
    try {
      return await userRepository.listAll(filters);
    } catch (error) {
      logger.error('Error listing users', {
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user can manage target role
   * @param {string} userRole - User's role
   * @param {string} targetRole - Target role to manage
   * @returns {boolean} True if can manage
   * @private
   */
  _canManageRole(userRole, targetRole) {
    const hierarchy = {
      [ROLES.SUPERADMIN]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.KARYAWAN, ROLES.INVESTOR],
      [ROLES.ADMIN]: [ROLES.KARYAWAN, ROLES.INVESTOR],
      [ROLES.KARYAWAN]: [],
      [ROLES.INVESTOR]: [],
    };

    return hierarchy[userRole]?.includes(targetRole) || false;
  }
}

module.exports = new UserService();
