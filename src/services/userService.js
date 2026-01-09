// File: src/services/userService.js

/**
 * User Service
 *
 * Purpose: Business logic for User management, authentication, and permissions.
 *
 * @module services/userService
 */

const userRepository = require('../database/repositories/userRepository');
const auditRepository = require('../database/repositories/auditRepository');
const { validateUserData } = require('../utils/validator');
const { ROLES, AUDIT_ACTIONS } = require('../utils/constants');
const bcrypt = require('bcrypt');

class UserService {
  async createUser(userData, createdBy = null) {
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const cleanData = validation.value;

    const existingUser = await userRepository.findByPhone(cleanData.phone_number);
    if (existingUser) {
      throw new Error('Nomor telepon sudah terdaftar');
    }

    // Hash PIN if provided
    if (cleanData.pin) {
      cleanData.pin = await bcrypt.hash(cleanData.pin, 10);
    }

    cleanData.created_by = createdBy;

    const id = await userRepository.create(cleanData);

    await auditRepository.log(createdBy, AUDIT_ACTIONS.USER_CREATED, 'user', id, {
      phone: cleanData.phone_number,
      role: cleanData.role,
    });

    return { id, ...cleanData };
  }

  async getUserByPhone(phoneNumber) {
    return userRepository.findByPhone(phoneNumber);
  }

  async getUserById(id) {
    return userRepository.findById(id);
  }

  async validate2FA(userId, pin) {
    const user = await this.getUserById(userId);
    if (!user || !user.pin) return false;
    return bcrypt.compare(pin, user.pin);
  }

  async isSuperadmin(phoneNumber) {
    const user = await this.getUserByPhone(phoneNumber);
    return user && user.role === ROLES.SUPERADMIN;
  }

  async checkPermission() {
    // Logic for checking permissions based on role
    // For MVP, simplistic role check
    return true;
  }
}

module.exports = new UserService();
