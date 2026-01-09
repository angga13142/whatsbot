/**
 * Input Validators
 *
 * Validation and sanitization utilities
 */

const validator = require('validator');

class InputValidator {
  /**
   * Validate transaction data
   */
  validateTransaction(data) {
    const errors = [];

    // Type validation
    const validTypes = ['paket', 'box', 'topup', 'tarik'];
    if (!data.type || !validTypes.includes(data.type.toLowerCase())) {
      errors.push(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Amount validation
    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (data.amount > 1000000000) {
      errors.push('Amount exceeds maximum limit (1 billion)');
    }

    // Description validation
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    // Date validation
    if (data.transaction_date) {
      const date = new Date(data.transaction_date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid transaction date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate customer data
   */
  validateCustomer(data) {
    const errors = [];

    // Name validation
    if (!data.customer_name || data.customer_name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters');
    }

    if (data.customer_name && data.customer_name.length > 200) {
      errors.push('Customer name must be less than 200 characters');
    }

    // Email validation
    if (data.email && !validator.isEmail(data.email)) {
      errors.push('Invalid email address');
    }

    // Phone validation
    if (
      data.phone_number &&
      !validator.isMobilePhone(data.phone_number, 'any', { strictMode: false })
    ) {
      errors.push('Invalid phone number');
    }

    // Credit limit validation
    if (data.credit_limit !== undefined) {
      if (isNaN(data.credit_limit) || data.credit_limit < 0) {
        errors.push('Credit limit must be a non-negative number');
      }
      if (data.credit_limit > 10000000000) {
        errors.push('Credit limit exceeds maximum (10 billion)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate report filters
   */
  validateReportFilters(filters) {
    const errors = [];

    // Date range validation
    if (filters.start_date) {
      const date = new Date(filters.start_date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid start date');
      }
    }

    if (filters.end_date) {
      const date = new Date(filters.end_date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid end date');
      }
    }

    if (filters.start_date && filters.end_date) {
      if (new Date(filters.start_date) > new Date(filters.end_date)) {
        errors.push('Start date must be before end date');
      }
    }

    // Limit validation
    if (filters.limit) {
      if (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 10000) {
        errors.push('Limit must be between 1 and 10000');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Escape HTML entities
    sanitized = validator.escape(sanitized);

    return sanitized;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone) {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Check if it's a valid format
    if (!/^\+?[1-9]\d{7,14}$/.test(cleaned)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true, formatted: cleaned };
  }

  /**
   * Validate numeric input
   */
  validateNumber(value, options = {}) {
    const { min = null, max = null, integer = false } = options;

    if (isNaN(value)) {
      return { isValid: false, error: 'Must be a number' };
    }

    const num = parseFloat(value);

    if (integer && !Number.isInteger(num)) {
      return { isValid: false, error: 'Must be an integer' };
    }

    if (min !== null && num < min) {
      return { isValid: false, error: `Must be at least ${min}` };
    }

    if (max !== null && num > max) {
      return { isValid: false, error: `Must be at most ${max}` };
    }

    return { isValid: true, value: num };
  }
}

module.exports = new InputValidator();
