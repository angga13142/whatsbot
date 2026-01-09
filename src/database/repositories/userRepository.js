// File: src/database/repositories/userRepository.js

const db = require('../connection');

module.exports = {
  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id) {
    try {
      const user = await db('users').where({ id }).first();
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  },

  /**
   * Find user by phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object|null>} User object or null
   */
  async findByPhone(phoneNumber) {
    try {
      const user = await db('users').where({ phone_number: phoneNumber }).first();
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user by phone: ${error.message}`);
    }
  },

  /**
   * Find users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} Array of users
   */
  async findByRole(role) {
    try {
      return await db('users').where({ role });
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  },

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    try {
      const [id] = await db('users').insert(userData).returning('id');
      // Handle SQLite implicit return object vs ID
      const newId = typeof id === 'object' ? id.id : id;
      return this.findById(newId);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async update(id, updates) {
    try {
      await db('users')
        .where({ id })
        .update({ ...updates, updated_at: db.fn.now() });
      return this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  /**
   * Delete user (soft delete by status)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      const count = await db('users').where({ id }).update({ status: 'inactive' });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  /**
   * Suspend user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async suspend(id) {
    try {
      const count = await db('users').where({ id }).update({ status: 'suspended' });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to suspend user: ${error.message}`);
    }
  },

  /**
   * Unsuspend user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async unsuspend(id) {
    try {
      const count = await db('users').where({ id }).update({ status: 'active' });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to unsuspend user: ${error.message}`);
    }
  },

  /**
   * Update user PIN
   * @param {number} id - User ID
   * @param {string} hashedPin - Hashed PIN
   * @returns {Promise<boolean>} Success status
   */
  async updatePin(id, hashedPin) {
    try {
      const count = await db('users').where({ id }).update({ pin: hashedPin });
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to update PIN: ${error.message}`);
    }
  },

  /**
   * List all users with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of users
   */
  async listAll(filters = {}) {
    try {
      const query = db('users').select('*');

      if (filters.role) query.where({ role: filters.role });
      if (filters.status) query.where({ status: filters.status });
      if (filters.search) {
        query.where((builder) => {
          builder
            .where('full_name', 'like', `%${filters.search}%`)
            .orWhere('phone_number', 'like', `%${filters.search}%`);
        });
      }

      return await query.orderBy('created_at', 'desc');
    } catch (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
  },

  /**
   * Count users
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} User count
   */
  async count(filters = {}) {
    try {
      const query = db('users');

      if (filters.role) query.where({ role: filters.role });
      if (filters.status) query.where({ status: filters.status });

      const result = await query.count('* as count').first();
      return parseInt(result.count || 0, 10);
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  },
};
