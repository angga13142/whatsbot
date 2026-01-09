/**
 * Session Manager
 *
 * Manages conversation state for multi-step interactions
 */

const knex = require('../database/connection');
const { SESSION_STATES } = require('./constants');
const logger = require('./logger');

// In-memory cache for active sessions to reduce DB hits
// Key: phoneNumber, Value: { state, data, lastActivity }
const sessionCache = new Map();

module.exports = {
  /**
   * Create new session
   * @param {string} phoneNumber - User phone number
   * @param {string} initialState - Initial state
   * @returns {Promise<Object>} Created session
   */
  async createSession(phoneNumber, initialState = SESSION_STATES.IDLE) {
    const now = new Date();
    const sessionData = {
      phone_number: phoneNumber,
      session_data: JSON.stringify({}),
      current_state: initialState,
      last_activity: now,
      created_at: now,
    };

    try {
      // Upsert into DB
      // Note: SQLite doesn't support ON CONFLICT perfectly in all versions,
      // but specific syntax for upsert is supported in newer ones.
      // We'll try basic insert, if fails (unique constraint), we update.

      const existing = await knex('bot_sessions').where({ phone_number: phoneNumber }).first();

      if (existing) {
        await knex('bot_sessions')
          .where({ phone_number: phoneNumber })
          .update({
            current_state: initialState,
            session_data: JSON.stringify({}),
            last_activity: now,
          });
      } else {
        await knex('bot_sessions').insert(sessionData);
      }

      // Update Cache
      const sessionObj = {
        phoneNumber,
        state: initialState,
        data: {},
        lastActivity: now,
      };
      sessionCache.set(phoneNumber, sessionObj);

      return sessionObj;
    } catch (error) {
      logger.error('Error creating session', { error: error.message, phoneNumber });
      throw error;
    }
  },

  /**
   * Get session
   * @param {string} phoneNumber - User phone number
   * @returns {Promise<Object|null>} Session or null
   */
  async getSession(phoneNumber) {
    try {
      // 1. Check cache first
      if (sessionCache.has(phoneNumber)) {
        return sessionCache.get(phoneNumber);
      }

      // 2. If not in cache, query DB
      const dbSession = await knex('bot_sessions').where({ phone_number: phoneNumber }).first();

      if (dbSession) {
        // Parse JSON data
        let parsedData = {};
        try {
          parsedData = JSON.parse(dbSession.session_data || '{}');
        } catch {
          logger.warn('Failed to parse session data', { phoneNumber });
        }

        const sessionObj = {
          phoneNumber: dbSession.phone_number,
          state: dbSession.current_state,
          data: parsedData,
          lastActivity: new Date(dbSession.last_activity),
        };

        // 3. Add to cache
        sessionCache.set(phoneNumber, sessionObj);
        return sessionObj;
      }

      return null;
    } catch (error) {
      logger.error('Error getting session', { error: error.message, phoneNumber });
      return null;
    }
  },

  /**
   * Update session
   * @param {string} phoneNumber - User phone number
   * @param {Object} updates - Updates to apply (state, data)
   * @returns {Promise<Object>} Updated session
   */
  async updateSession(phoneNumber, updates) {
    try {
      const currentSession = await this.getSession(phoneNumber);
      if (!currentSession) {
        // If no session exists, create one with updates
        return this.createSession(phoneNumber, updates.state || SESSION_STATES.IDLE);
      }

      const now = new Date();
      const newState = updates.state || currentSession.state;

      // Merge data
      const newData = { ...currentSession.data, ...(updates.data || {}) };

      // Update DB
      await knex('bot_sessions')
        .where({ phone_number: phoneNumber })
        .update({
          current_state: newState,
          session_data: JSON.stringify(newData),
          last_activity: now,
        });

      // Update Cache
      const updatedSessionObj = {
        phoneNumber,
        state: newState,
        data: newData,
        lastActivity: now,
      };
      sessionCache.set(phoneNumber, updatedSessionObj);

      return updatedSessionObj;
    } catch (error) {
      logger.error('Error updating session', { error: error.message, phoneNumber });
      throw error;
    }
  },

  /**
   * Delete session
   * @param {string} phoneNumber - User phone number
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(phoneNumber) {
    try {
      // Delete from DB
      await knex('bot_sessions').where({ phone_number: phoneNumber }).del();

      // Remove from cache
      sessionCache.delete(phoneNumber);

      return true;
    } catch (error) {
      logger.error('Error deleting session', { error: error.message, phoneNumber });
      return false;
    }
  },

  /**
   * Set session state
   * @param {string} phoneNumber - User phone number
   * @param {string} state - New state
   * @returns {Promise<Object>} Updated session
   */
  async setState(phoneNumber, state) {
    return this.updateSession(phoneNumber, { state });
  },

  /**
   * Get session state
   * @param {string} phoneNumber - User phone number
   * @returns {Promise<string>} Current state
   */
  async getState(phoneNumber) {
    const session = await this.getSession(phoneNumber);
    return session ? session.state : null;
  },

  /**
   * Set session data
   * @param {string} phoneNumber - User phone number
   * @param {string} key - Data key
   * @param {any} value - Data value
   * @returns {Promise<Object>} Updated session
   */
  async setData(phoneNumber, key, value) {
    return this.updateSession(phoneNumber, {
      data: { [key]: value },
    });
  },

  /**
   * Get session data
   * @param {string} phoneNumber - User phone number
   * @param {string} key - Data key
   * @returns {Promise<any>} Data value
   */
  async getData(phoneNumber, key) {
    const session = await this.getSession(phoneNumber);
    return session && session.data ? session.data[key] : null;
  },

  /**
   * Clear expired sessions
   * @param {number} maxAgeMinutes - Max age in minutes (default: 30)
   * @returns {Promise<number>} Number of cleared sessions
   */
  async clearExpiredSessions(maxAgeMinutes = 30) {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

      // Delete from DB
      const result = await knex('bot_sessions').where('last_activity', '<', cutoffTime).del();

      // Clear entire cache to be safe (or iterate if performance critical, but simple clear is safer for consistency)
      this.clearCache();

      return result;
    } catch (error) {
      logger.error('Error clearing expired sessions', { error: error.message });
      return 0;
    }
  },

  /**
   * Clear cache
   */
  clearCache() {
    sessionCache.clear();
  },
};
