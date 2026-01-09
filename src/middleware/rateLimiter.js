/**
 * Rate Limiter Middleware
 *
 * Prevents abuse of expensive operations
 * Production-ready implementation with memory-based storage
 */

const logger = require('../utils/logger');

class RateLimiter {
  constructor() {
    // In-memory storage (use Redis in production for multi-instance)
    this.requests = new Map();

    // Rate limit configurations
    this.limits = {
      // Forecasting - expensive ML operations
      forecast: {
        max: 10,
        window: 3600000, // 1 hour
        message: 'Forecast limit reached',
      },

      // Chart generation - CPU intensive
      chart: {
        max: 20,
        window: 3600000,
        message: 'Chart generation limit reached',
      },

      // Reports - database intensive
      report: {
        max: 50,
        window: 3600000,
        message: 'Report generation limit reached',
      },

      // Exports - file generation
      export: {
        max: 30,
        window: 3600000,
        message: 'Export limit reached',
      },

      // Dashboard - multiple queries
      dashboard: {
        max: 30,
        window: 3600000,
        message: 'Dashboard limit reached',
      },

      // PDF generation - resource intensive
      pdf: {
        max: 15,
        window: 3600000,
        message: 'PDF generation limit reached',
      },

      // Anomaly detection - expensive computation
      anomaly: {
        max: 20,
        window: 3600000,
        message: 'Anomaly detection limit reached',
      },

      // Insights - AI processing
      insights: {
        max: 25,
        window: 3600000,
        message: 'Insights generation limit reached',
      },
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if request is within rate limit
   * @param {number} userId - User ID
   * @param {string} operation - Operation type
   * @returns {Object} { allowed: boolean, message?:  string, remaining?: number }
   */
  async checkLimit(userId, operation) {
    const limit = this.limits[operation];

    // If operation not configured, allow by default
    if (!limit) {
      logger.warn('Rate limit not configured for operation', { operation });
      return { allowed: true };
    }

    const key = `${userId}-${operation}`;
    const now = Date.now();

    let userRequests = this.requests.get(key);

    // Initialize or reset if window expired
    if (!userRequests || now > userRequests.resetTime) {
      userRequests = {
        count: 0,
        resetTime: now + limit.window,
        firstRequest: now,
      };
      this.requests.set(key, userRequests);
    }

    // Check if limit exceeded
    if (userRequests.count >= limit.max) {
      const waitTime = Math.ceil((userRequests.resetTime - now) / 60000);

      logger.warn('Rate limit exceeded', {
        userId,
        operation,
        count: userRequests.count,
        max: limit.max,
        waitTime,
      });

      return {
        allowed: false,
        message: `${limit.message}. Try again in ${waitTime} minute${waitTime > 1 ? 's' : ''}.`,
        retryAfter: userRequests.resetTime,
        current: userRequests.count,
        max: limit.max,
      };
    }

    // Increment counter
    userRequests.count++;
    this.requests.set(key, userRequests);

    const remaining = limit.max - userRequests.count;

    logger.debug('Rate limit check passed', {
      userId,
      operation,
      count: userRequests.count,
      remaining,
    });

    return {
      allowed: true,
      remaining,
      total: limit.max,
    };
  }

  /**
   * Reset limits for a user (admin override)
   * @param {number} userId - User ID
   * @param {string} operation - Optional:  specific operation
   */
  resetUser(userId, operation = null) {
    if (operation) {
      const key = `${userId}-${operation}`;
      this.requests.delete(key);
      logger.info('Rate limit reset', { userId, operation });
    } else {
      // Reset all operations for user
      let count = 0;
      for (const [key] of this.requests) {
        if (key.startsWith(`${userId}-`)) {
          this.requests.delete(key);
          count++;
        }
      }
      logger.info('All rate limits reset for user', { userId, operations: count });
    }
  }

  /**
   * Get current usage for a user
   * @param {number} userId - User ID
   * @returns {Object} Usage statistics
   */
  getUserUsage(userId) {
    const usage = {};

    for (const [key, data] of this.requests) {
      if (key.startsWith(`${userId}-`)) {
        const operation = key.split('-')[1];
        const limit = this.limits[operation];

        usage[operation] = {
          current: data.count,
          max: limit.max,
          remaining: limit.max - data.count,
          resetsAt: new Date(data.resetTime),
          percentage: ((data.count / limit.max) * 100).toFixed(1),
        };
      }
    }

    return usage;
  }

  /**
   * Update rate limits (admin function)
   * @param {string} operation - Operation name
   * @param {Object} config - New configuration
   */
  updateLimit(operation, config) {
    if (!this.limits[operation]) {
      logger.warn('Attempting to update non-existent limit', { operation });
      return false;
    }

    this.limits[operation] = {
      ...this.limits[operation],
      ...config,
    };

    logger.info('Rate limit updated', { operation, config });
    return true;
  }

  /**
   * Get all rate limit configurations
   * @returns {Object} All limits
   */
  getAllLimits() {
    return { ...this.limits };
  }

  /**
   * Cleanup expired entries
   * @private
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.requests) {
      if (now > value.resetTime) {
        this.requests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', { cleaned, remaining: this.requests.size });
    }
  }

  /**
   * Start periodic cleanup
   * @private
   */
  startCleanup() {
    // Cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 600000);

    logger.info('Rate limiter cleanup scheduler started');
  }

  /**
   * Stop cleanup (for testing or shutdown)
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      logger.info('Rate limiter cleanup scheduler stopped');
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      totalKeys: this.requests.size,
      byOperation: {},
      activeUsers: new Set(),
    };

    for (const [key, data] of this.requests) {
      const [userId, operation] = key.split('-');
      stats.activeUsers.add(userId);

      if (!stats.byOperation[operation]) {
        stats.byOperation[operation] = { keys: 0, requests: 0 };
      }

      stats.byOperation[operation].keys++;
      stats.byOperation[operation].requests += data.count;
    }

    stats.activeUsers = stats.activeUsers.size;

    return stats;
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
