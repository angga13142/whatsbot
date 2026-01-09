// File: src/utils/validator.js

/**
 * Validator Utility
 *
 * Purpose: Validate user input using Joi schemas.
 *
 * @module utils/validator
 */

const Joi = require('joi');
const { ROLES, TRANSACTION_TYPES } = require('./constants');

const phoneSchema = Joi.string()
  .pattern(/^\d{10,15}$/)
  .required();
const amountSchema = Joi.number().positive().required();
const roleSchema = Joi.string()
  .valid(...Object.values(ROLES))
  .required();

module.exports = {
  /**
   * Validate Phone Number format (only digits, 10-15 chars)
   */
  validatePhoneNumber(phone) {
    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');
    const { error } = phoneSchema.validate(cleaned);
    return {
      isValid: !error,
      value: cleaned, // Return cleaned number
      error: error ? error.message : null,
    };
  },

  /**
   * Validate Transaction Data
   */
  validateTransactionData(data) {
    const schema = Joi.object({
      type: Joi.string()
        .valid(...Object.values(TRANSACTION_TYPES))
        .required(),
      amount: amountSchema,
      description: Joi.string().max(255).allow('', null),
      category: Joi.string().max(50).allow('', null),
      customer_name: Joi.string().max(100).allow('', null),
    });

    const { error, value } = schema.validate(data);
    return { isValid: !error, value, error: error ? error.message : null };
  },

  /**
   * Validate User Data
   */
  validateUserData(data) {
    const schema = Joi.object({
      phone_number: phoneSchema,
      full_name: Joi.string().min(2).max(100).required(),
      role: roleSchema,
      pin: Joi.string().length(6).pattern(/^\d+$/).optional(),
    });

    const { error, value } = schema.validate(data);
    return { isValid: !error, value, error: error ? error.message : null };
  },

  /**
   * Sanitize basic input string
   */
  sanitizeInput(text) {
    if (!text) return '';
    return text.trim().replace(/[<>]/g, ''); // Basic XSS prevention
  },
};
