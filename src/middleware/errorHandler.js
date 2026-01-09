/**
 * Error Handler Middleware
 *
 * Centralized error handling and user-friendly messages
 * Production-safe error responses
 */

const logger = require('../utils/logger');

class ErrorHandler {
  constructor() {
    // Custom error types
    this.errorTypes = {
      ValidationError: {
        code: 'VALIDATION_ERROR',
        httpStatus: 400,
        userMessage: (err) => err.message,
      },
      NotFoundError: {
        code: 'NOT_FOUND',
        httpStatus: 404,
        userMessage: (err) => err.message || 'Resource not found',
      },
      AuthorizationError: {
        code: 'UNAUTHORIZED',
        httpStatus: 403,
        userMessage: () => 'You do not have permission to perform this action',
      },
      AuthenticationError: {
        code: 'AUTHENTICATION_FAILED',
        httpStatus: 401,
        userMessage: () => 'Authentication failed',
      },
      RateLimitError: {
        code: 'RATE_LIMIT_EXCEEDED',
        httpStatus: 429,
        userMessage: (err) => err.message,
      },
      DatabaseError: {
        code: 'DATABASE_ERROR',
        httpStatus: 500,
        userMessage: () => 'A database error occurred.  Please try again.',
      },
      ExternalServiceError: {
        code: 'EXTERNAL_SERVICE_ERROR',
        httpStatus: 503,
        userMessage: () => 'An external service is temporarily unavailable',
      },
    };
  }

  /**
   * Handle error and return standardized response
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @returns {Object} Standardized error response
   */
  handle(error, context = {}) {
    // Log error with full details
    this._logError(error, context);

    // Get error type configuration
    const errorConfig = this.errorTypes[error.name] || this.errorTypes.DatabaseError;

    // Build response
    const response = {
      success: false,
      error: {
        code: errorConfig.code,
        message: this._getUserMessage(error, errorConfig),
        timestamp: new Date().toISOString(),
      },
    };

    // Add details in development
    if (process.env.NODE_ENV !== 'production') {
      response.error.details = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context,
      };
    }

    // Add retry information for rate limits
    if (error.name === 'RateLimitError' && error.retryAfter) {
      response.error.retryAfter = error.retryAfter;
    }

    return response;
  }

  /**
   * Handle command error (for WhatsApp bot)
   * @param {Object} message - WhatsApp message object
   * @param {Error} error - Error object
   * @param {Object} user - User object
   */
  async handleCommandError(message, error, user) {
    const handled = this.handle(error, {
      userId: user.id,
      command: message.body,
      source: 'whatsapp_command',
    });

    // Format for WhatsApp
    let reply = `❌ ${handled.error.message}`;

    // Add helpful information
    if (error.name === 'ValidationError') {
      reply += '\n\n💡 Please check your input and try again.';
    } else if (error.name === 'NotFoundError') {
      reply += '\n\n💡 The requested resource could not be found.';
    } else if (error.name === 'AuthorizationError') {
      reply += '\n\n💡 Contact an administrator if you need access.';
    } else if (error.name === 'RateLimitError') {
      reply += '\n\n💡 You can try again later.';
    } else {
      reply += '\n\n💡 If this persists, please contact support.';
    }

    // Add error code for tracking
    reply += `\n\n🔖 Error Code: ${handled.error.code}`;

    await message.reply(reply);
  }

  /**
   * Handle async function with error catching
   * @param {Function} fn - Async function
   * @param {Object} context - Context for error logging
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handle(error, context);
      }
    };
  }

  /**
   * Create custom error
   * @param {string} name - Error name
   * @param {string} message - Error message
   * @param {Object} data - Additional data
   * @returns {Error}
   */
  createError(name, message, data = {}) {
    const error = new Error(message);
    error.name = name;
    Object.assign(error, data);
    return error;
  }

  /**
   * Get user-friendly message
   * @private
   */
  _getUserMessage(error, errorConfig) {
    // In production, use safe messages
    if (process.env.NODE_ENV === 'production') {
      return errorConfig.userMessage(error);
    }

    // In development, show actual error
    return error.message || errorConfig.userMessage(error);
  }

  /**
   * Log error with context
   * @private
   */
  _logError(error, context) {
    const logData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString(),
    };

    // Determine log level
    if (error.name === 'ValidationError') {
      logger.warn('Validation error', logData);
    } else if (error.name === 'NotFoundError') {
      logger.info('Resource not found', logData);
    } else if (['AuthorizationError', 'AuthenticationError'].includes(error.name)) {
      logger.warn('Authorization/Authentication error', logData);
    } else if (error.name === 'RateLimitError') {
      logger.warn('Rate limit exceeded', logData);
    } else {
      logger.error('Application error', logData);
    }

    // Store in database for analysis
    this._storeErrorLog(logData).catch((err) => {
      logger.error('Failed to store error log', { error: err.message });
    });
  }

  /**
   * Store error in database
   * @private
   */
  async _storeErrorLog(logData) {
    try {
      const knex = require('../database/connection');

      await knex('error_logs')
        .insert({
          error_name: logData.name,
          error_message: logData.message,
          error_stack: logData.stack,
          user_id: logData.userId || null,
          context: JSON.stringify(logData),
          created_at: new Date(),
        })
        .catch(() => {
          // Ignore if table doesn't exist yet
        });
    } catch (error) {
      // Silent fail - don't throw error while handling error
    }
  }

  /**
   * Get error statistics
   * @returns {Promise<Object>}
   */
  async getErrorStats() {
    try {
      const knex = require('../database/connection');

      const stats = await knex('error_logs')
        .select('error_name')
        .count('* as count')
        .where('created_at', '>', knex.raw("datetime('now', '-7 days')"))
        .groupBy('error_name')
        .orderBy('count', 'desc');

      return {
        last7Days: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      return { error: 'Unable to fetch error stats' };
    }
  }
}

// Create singleton
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
