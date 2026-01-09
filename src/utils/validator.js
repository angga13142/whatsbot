/**
 * Validation Utilities
 *
 * Provides input validation functions using Joi
 */

const Joi = require('joi');
const validator = require('validator');

module.exports = {
  /**
   * Validate Indonesian phone number
   * @param {string} phone - Phone number to validate
   * @returns {Object} { valid: boolean, error: string|null, formatted: string }
   * @example
   *   validatePhoneNumber('0812-3456-789') // { valid: true, formatted: '628123456789' }
   *   validatePhoneNumber('123') // { valid: false, error: 'Format tidak valid' }
   */
  validatePhoneNumber(phone) {
    if (!phone) {
      return { valid: false, error: 'Nomor telepon wajib diisi' };
    }

    // 1. Remove all non-digits
    let cleaned = phone.toString().replace(/\D/g, '');

    // 2. Normalize prefix
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }

    // 3. Check format (must start with 628)
    if (!cleaned.startsWith('628')) {
      return { valid: false, error: 'Format nomor tidak valid. Gunakan format 08xx atau 628xx' };
    }

    // 4. Check length (10-15 digits usually, but rigorous check: 10-14 digits after 62)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return { valid: false, error: 'Panjang nomor telepon tidak valid' };
    }

    return { valid: true, formatted: cleaned, value: cleaned };
  },

  /**
   * Validate transaction type
   * @param {string} type - Transaction type
   * @returns {Object} { valid: boolean, error: string|null }
   */
  validateTransactionType(type) {
    const validTypes = ['paket', 'utang', 'jajan'];
    if (!validTypes.includes(type)) {
      return {
        valid: false,
        error: `Tipe transaksi harus salah satu dari: ${validTypes.join(', ')}`,
      };
    }
    return { valid: true };
  },

  /**
   * Validate amount
   * @param {number|string} amount - Amount to validate
   * @returns {Object} { valid: boolean, error: string|null, value: number }
   */
  validateAmount(amount) {
    const num = Number(amount);

    if (isNaN(num)) {
      return { valid: false, error: 'Jumlah harus berupa angka' };
    }

    if (num <= 0) {
      return { valid: false, error: 'Jumlah harus lebih besar dari 0' };
    }

    if (num > 999999999) {
      return { valid: false, error: 'Jumlah melebihi batas maksimum' };
    }

    return { valid: true, value: num };
  },

  /**
   * Validate user role
   * @param {string} role - User role
   * @returns {Object} { valid: boolean, error: string|null }
   */
  validateRole(role) {
    const validRoles = ['superadmin', 'admin', 'karyawan', 'investor'];
    if (!validRoles.includes(role)) {
      return { valid: false, error: 'Role tidak valid' };
    }
    return { valid: true };
  },

  /**
   * Validate transaction data
   * @param {Object} data - Transaction data
   * @returns {Object} { valid: boolean, errors: Array, value: Object }
   */
  validateTransactionData(data) {
    const schema = Joi.object({
      type: Joi.string().valid('paket', 'utang', 'jajan').required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().max(500).required(),
      customer_name: Joi.string()
        .max(100)
        .when('type', {
          is: 'utang',
          then: Joi.required(),
          otherwise: Joi.optional().allow(null, ''),
        }),
      image_url: Joi.string().uri().optional().allow(null, ''),
    });

    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      return {
        valid: false,
        errors: error.details.map((d) => d.message),
        value,
      };
    }

    return { valid: true, value };
  },

  /**
   * Validate user data
   * @param {Object} data - User data
   * @returns {Object} { valid: boolean, errors: Array, value: Object }
   */
  validateUserData(data) {
    const schema = Joi.object({
      phone_number: Joi.string()
        .pattern(/^628\d{8,12}$/)
        .required(),
      full_name: Joi.string().min(3).max(100).required(),
      role: Joi.string().valid('superadmin', 'admin', 'karyawan', 'investor').required(),
      status: Joi.string().valid('active', 'suspended', 'inactive').optional().default('active'),
      pin: Joi.string().optional(), // Allow pin for setup
    });

    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      return {
        valid: false,
        errors: error.details.map((d) => d.message),
        value,
      };
    }

    return { valid: true, value };
  },

  /**
   * Sanitize input to prevent injection
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (!input) return '';
    const str = String(input);
    const trimmed = validator.trim(str);
    const escaped = validator.escape(trimmed);
    return escaped;
  },

  /**
   * Validate date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} { valid: boolean, error: string|null }
   */
  validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: 'Format tanggal tidak valid' };
    }

    if (start > end) {
      return { valid: false, error: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir' };
    }

    // Check max range (1 year)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      return { valid: false, error: 'Rentang tanggal maksimal 1 tahun' };
    }

    return { valid: true };
  },
};
