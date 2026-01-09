// File: src/utils/formatter.js

/**
 * Formatter Utility
 *
 * Purpose: Format data types (currency, date, phone) for display.
 *
 * @module utils/formatter
 */

const dayjs = require('dayjs');
require('dayjs/locale/id'); // Load Indonesian locale
dayjs.locale('id');

const config = require('../config/app');

module.exports = {
  /**
   * Format number to currency string (Rp)
   * @param {number} amount
   * @returns {string} e.g., "Rp 1.000.000"
   */
  formatCurrency(amount) {
    if (amount === undefined || amount === null) return 'Rp 0';

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: config.business.currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format date object to string
   * @param {Date|string} date
   * @param {string} formatPattern dayjs format pattern
   * @returns {string}
   */
  formatDate(date, formatPattern = 'DD MMMM YYYY') {
    if (!date) return '-';
    return dayjs(date).format(formatPattern);
  },

  /**
   * Format phone number to international display format
   * @param {string} phone
   * @returns {string} e.g., "+62 812-3456-789"
   */
  formatPhoneNumber(phone) {
    if (!phone) return '-';

    // Normalize string
    const cleaned = phone.toString().replace(/\D/g, '');

    // Check if it starts with 62 or 0
    let formatted = cleaned;
    if (formatted.startsWith('62')) {
      formatted = '0' + formatted.slice(2);
    }

    // Format as 08xx-xxxx-xxxx
    if (formatted.length >= 10) {
      return formatted.replace(/(\d{4})(\d{4})(\d{3,})/, '$1-$2-$3');
    }

    return phone;
  },

  /**
   * Truncate text with ellipsis
   * @param {string} text
   * @param {number} length
   * @returns {string}
   */
  truncateText(text, length = 30) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  /**
   * Pluralize word based on count
   * @param {number} count
   * @param {string} singular
   * @param {string} plural
   * @returns {string}
   */
  pluralize(count, singular, plural) {
    return count === 1 ? singular : plural || singular + 's';
  },
};
