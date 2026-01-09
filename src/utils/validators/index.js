/**
 * Input Validators
 *
 * Centralized validation for all inputs
 * Prevents injection attacks and data corruption
 */

const dayjs = require('dayjs');

class InputValidator {
  /**
   * Validate transaction data
   * @param {Object} data - Transaction data
   * @returns {Object} { isValid:  boolean, errors: Array }
   */
  validateTransaction(data) {
    const errors = [];

    // Type validation
    if (!data.type) {
      errors.push('Transaction type is required');
    } else if (!['paket', 'utang', 'jajan'].includes(data.type)) {
      errors.push('Invalid transaction type');
    }

    // Amount validation
    if (data.amount === undefined || data.amount === null) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount)) {
        errors.push('Amount must be a valid number');
      } else if (amount <= 0) {
        errors.push('Amount must be greater than zero');
      } else if (amount > 999999999999) {
        errors.push('Amount is too large');
      }
    }

    // Description validation
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    } else if (data.description.length > 500) {
      errors.push('Description is too long (max 500 characters)');
    }

    // Date validation
    if (data.transaction_date) {
      const date = dayjs(data.transaction_date);
      if (!date.isValid()) {
        errors.push('Invalid transaction date');
      } else if (date.isAfter(dayjs().add(1, 'day'))) {
        errors.push('Transaction date cannot be in the future');
      } else if (date.isBefore(dayjs().subtract(2, 'year'))) {
        errors.push('Transaction date is too far in the past');
      }
    }

    // Category ID validation (if provided)
    if (data.category_id !== undefined && data.category_id !== null) {
      const categoryId = parseInt(data.category_id);
      if (isNaN(categoryId) || categoryId < 1) {
        errors.push('Invalid category ID');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate report filters
   * @param {Object} filters - Report filters
   * @returns {Object} { isValid:  boolean, errors: Array }
   */
  validateReportFilters(filters) {
    const errors = [];

    if (!filters || typeof filters !== 'object') {
      errors.push('Filters must be provided');
      return { isValid: false, errors };
    }

    // Date range validation
    if (filters.startDate && filters.endDate) {
      const start = dayjs(filters.startDate);
      const end = dayjs(filters.endDate);

      if (!start.isValid()) {
        errors.push('Invalid start date');
      }

      if (!end.isValid()) {
        errors.push('Invalid end date');
      }

      if (start.isValid() && end.isValid()) {
        if (end.isBefore(start)) {
          errors.push('End date must be after start date');
        }

        const daysDiff = end.diff(start, 'day');
        if (daysDiff > 365) {
          errors.push('Date range cannot exceed 365 days');
        }
      }
    }

    // Type validation
    if (filters.type) {
      const validTypes = ['paket', 'utang', 'jajan'];

      if (Array.isArray(filters.type)) {
        const invalidTypes = filters.type.filter((t) => !validTypes.includes(t));
        if (invalidTypes.length > 0) {
          errors.push(`Invalid transaction types: ${invalidTypes.join(', ')}`);
        }
      } else if (!validTypes.includes(filters.type)) {
        errors.push('Invalid transaction type');
      }
    }

    // Amount range validation
    if (filters.minAmount !== undefined) {
      const min = parseFloat(filters.minAmount);
      if (isNaN(min) || min < 0) {
        errors.push('Invalid minimum amount');
      }
    }

    if (filters.maxAmount !== undefined) {
      const max = parseFloat(filters.maxAmount);
      if (isNaN(max) || max < 0) {
        errors.push('Invalid maximum amount');
      }

      if (filters.minAmount !== undefined) {
        const min = parseFloat(filters.minAmount);
        if (!isNaN(min) && !isNaN(max) && max < min) {
          errors.push('Maximum amount must be greater than minimum amount');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate forecast parameters
   * @param {Object} filters - Historical filters
   * @param {number} forecastDays - Days to forecast
   * @param {Object} options - Forecast options
   * @returns {Object}
   */
  validateForecast(filters, forecastDays, options = {}) {
    const errors = [];

    // Validate forecast days
    if (!Number.isInteger(forecastDays)) {
      errors.push('Forecast days must be an integer');
    } else if (forecastDays < 1) {
      errors.push('Forecast days must be at least 1');
    } else if (forecastDays > 90) {
      errors.push('Forecast days cannot exceed 90');
    }

    // Validate filters
    const filterValidation = this.validateReportFilters(filters);
    if (!filterValidation.isValid) {
      errors.push(...filterValidation.errors);
    }

    // Validate method
    if (options.method) {
      const validMethods = ['linear', 'moving_average', 'exponential'];
      if (!validMethods.includes(options.method)) {
        errors.push(`Invalid forecasting method.  Must be one of: ${validMethods.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user registration
   * @param {Object} userData - User data
   * @returns {Object}
   */
  validateUser(userData) {
    const errors = [];

    // Phone number validation
    if (!userData.phone_number) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s-]{10,15}$/.test(userData.phone_number)) {
      errors.push('Invalid phone number format');
    }

    // Full name validation
    if (!userData.full_name || userData.full_name.trim().length === 0) {
      errors.push('Full name is required');
    } else if (userData.full_name.length > 100) {
      errors.push('Full name is too long (max 100 characters)');
    }

    // Role validation
    if (userData.role) {
      const validRoles = ['staff', 'admin', 'superadmin'];
      if (!validRoles.includes(userData.role)) {
        errors.push('Invalid role');
      }
    }

    // Currency validation
    if (userData.preferred_currency) {
      const validCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'CNY'];
      if (!validCurrencies.includes(userData.preferred_currency)) {
        errors.push('Invalid currency');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate schedule configuration
   * @param {Object} scheduleData - Schedule data
   * @returns {Object}
   */
  validateSchedule(scheduleData) {
    const errors = [];

    // Frequency validation
    if (!scheduleData.frequency) {
      errors.push('Frequency is required');
    } else if (!['daily', 'weekly', 'monthly'].includes(scheduleData.frequency)) {
      errors.push('Invalid frequency.  Must be daily, weekly, or monthly');
    }

    // Recipients validation
    if (!scheduleData.recipients || !Array.isArray(scheduleData.recipients)) {
      errors.push('Recipients must be an array');
    } else if (scheduleData.recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    // Time validation
    if (scheduleData.timeOfDay) {
      if (!/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(scheduleData.timeOfDay)) {
        errors.push('Invalid time format. Use HH:MM:SS');
      }
    }

    // Delivery method validation
    if (scheduleData.deliveryMethod) {
      const validMethods = ['whatsapp', 'email', 'both'];
      if (!validMethods.includes(scheduleData.deliveryMethod)) {
        errors.push('Invalid delivery method');
      }
    }

    // Export format validation
    if (scheduleData.exportFormat) {
      const validFormats = ['excel', 'csv', 'json', 'pdf', 'dashboard'];
      if (!validFormats.includes(scheduleData.exportFormat)) {
        errors.push('Invalid export format');
      }
    }

    // Day of week validation (for weekly)
    if (scheduleData.frequency === 'weekly' && scheduleData.dayOfWeek) {
      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      if (!validDays.includes(scheduleData.dayOfWeek.toLowerCase())) {
        errors.push('Invalid day of week');
      }
    }

    // Day of month validation (for monthly)
    if (scheduleData.frequency === 'monthly' && scheduleData.dayOfMonth) {
      const day = parseInt(scheduleData.dayOfMonth);
      if (isNaN(day) || day < 1 || day > 31) {
        errors.push('Day of month must be between 1 and 31');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize string input
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return '';

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize search query
   * @param {string} query - Search query
   * @returns {Object}
   */
  validateSearchQuery(query) {
    const errors = [];

    if (!query || typeof query !== 'string') {
      errors.push('Search query must be a string');
      return { isValid: false, errors, sanitized: '' };
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      errors.push('Search query must be at least 2 characters');
    }

    if (trimmed.length > 200) {
      errors.push('Search query is too long (max 200 characters)');
    }

    // Remove SQL injection attempts
    const sanitized = trimmed.replace(/['";\\]/g, '');

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate ID parameter
   * @param {any} id - ID to validate
   * @param {string} name - Parameter name for error messages
   * @returns {Object}
   */
  validateId(id, name = 'ID') {
    const errors = [];

    if (id === undefined || id === null) {
      errors.push(`${name} is required`);
      return { isValid: false, errors };
    }

    const numId = parseInt(id);

    if (isNaN(numId)) {
      errors.push(`${name} must be a number`);
    } else if (numId < 1) {
      errors.push(`${name} must be greater than zero`);
    } else if (numId > 2147483647) {
      errors.push(`${name} is too large`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      value: numId,
    };
  }
}

// Create singleton
const inputValidator = new InputValidator();

module.exports = inputValidator;
