/**
 * Rate Limit Middleware
 *
 * Prevents spam and abuse by limiting message rate per user
 */

const logger = require('../../utils/logger');
const config = require('../../config/app');

// In-memory store for rate limiting
// Key: phoneNumber, Value: { count: number, resetAt: timestamp }
const rateLimitStore = new Map();

module.exports = {
  /**
   * Check if user has exceeded rate limit
   * @param {string} phoneNumber - User phone number
   * @returns {Promise<Object>} { allowed: boolean, remaining: number, resetAt: number }
   */
  async checkRateLimit(phoneNumber) {
    try {
      const windowMs = config.rateLimit?.windowMs || 60000;
      const maxRequests = config.rateLimit?.maxRequests || 20;
      const now = Date.now();

      let userLimit = rateLimitStore.get(phoneNumber);

      // Create new entry if doesn't exist or expired
      if (!userLimit || now > userLimit.resetAt) {
        userLimit = {
          count: 0,
          resetAt: now + windowMs,
        };
        rateLimitStore.set(phoneNumber, userLimit);
      }

      // Increment count
      userLimit.count++;

      // Check if exceeded
      const allowed = userLimit.count <= maxRequests;
      const remaining = Math.max(0, maxRequests - userLimit.count);

      if (!allowed) {
        logger.warn('Rate limit exceeded', {
          phoneNumber,
          count: userLimit.count,
          limit: maxRequests,
        });
      }

      return {
        allowed,
        remaining,
        resetAt: userLimit.resetAt,
      };
    } catch (error) {
      logger.error('Error checking rate limit', {
        phoneNumber,
        error: error.message,
      });

      // On error, allow the request
      return {
        allowed: true,
        remaining: 0,
        resetAt: Date.now(),
      };
    }
  },

  /**
   * Reset rate limit for user
   * @param {string} phoneNumber - User phone number
   */
  resetRateLimit(phoneNumber) {
    rateLimitStore.delete(phoneNumber);
    logger.info('Rate limit reset', { phoneNumber });
  },

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    let cleared = 0;

    for (const [phoneNumber, data] of rateLimitStore.entries()) {
      if (now > data.resetAt) {
        rateLimitStore.delete(phoneNumber);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.debug('Cleared expired rate limit entries', { count: cleared });
    }
  },

  /**
   * Get current rate limit status
   * @param {string} phoneNumber - User phone number
   * @returns {Object|null} Current status or null
   */
  getStatus(phoneNumber) {
    return rateLimitStore.get(phoneNumber) || null;
  },
};

// Cleanup expired entries every minute
setInterval(() => {
  module.exports.clearExpired();
}, 60000);
