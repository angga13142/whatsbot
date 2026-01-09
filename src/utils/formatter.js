/**
 * Formatting Utilities
 *
 * Provides functions to format various data types for display
 */

const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');
require('dayjs/locale/id');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

module.exports = {
  /**
   * Format amount to Indonesian Rupiah
   * @param {number} amount - Amount to format
   * @param {boolean} includeSymbol - Include Rp symbol (default: true)
   * @returns {string} Formatted amount
   * @example
   *   formatCurrency(1000000) // "Rp 1.000.000"
   *   formatCurrency(1500000, false) // "1.500.000"
   *   formatCurrency(0) // "Rp 0"
   */
  formatCurrency(amount, includeSymbol = true) {
    if (amount === null || amount === undefined) return includeSymbol ? 'Rp 0' : '0';

    const num = Number(amount);
    if (isNaN(num)) return includeSymbol ? 'Rp 0' : '0';

    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return includeSymbol ? `Rp ${formatted}` : formatted;
  },

  /**
   * Format date with Indonesian locale
   * @param {Date|string} date - Date to format
   * @param {string} format - Format string (dayjs format)
   * @returns {string} Formatted date
   * @example
   *   formatDate(new Date(), 'DD MMMM YYYY') // "10 Januari 2026"
   *   formatDate(new Date(), 'dddd, DD MMM YYYY HH:mm') // "Jumat, 10 Jan 2026 10:30"
   */
  formatDate(date, format = 'DD MMMM YYYY') {
    if (!date) return '-';
    try {
      return dayjs(date).tz('Asia/Jakarta').format(format);
    } catch (e) {
      return '-';
    }
  },

  /**
   * Format phone number to Indonesian format
   * @param {string} phone - Phone number (628xxxxxxxxx)
   * @returns {string} Formatted phone number
   * @example
   *   formatPhoneNumber('628123456789') // "+62 812-3456-789"
   */
  formatPhoneNumber(phone) {
    if (!phone) return '-';
    const cleaned = phone.toString().replace(/\D/g, '');

    // Check if starts with 62
    if (cleaned.startsWith('62')) {
      // 62 8XX - XXXX - XXX
      // Use regex to group: (62)(8\d{2})(\d{4})(\d+)
      // Note: Length varies (11-13 digits total)
      if (cleaned.length >= 10) {
        const prefix = '+62';
        const rest = cleaned.substring(2);
        // Try to group logically: 3 digits (provider), 4 digits, rest
        if (rest.length > 7) {
          const part1 = rest.substring(0, 3);
          const part2 = rest.substring(3, 7);
          const part3 = rest.substring(7);
          return `${prefix} ${part1}-${part2}-${part3}`;
        }
      }
    }
    return `+${cleaned}`; // Fallback
  },

  /**
   * Format transaction ID
   * @param {string} id - Transaction ID
   * @returns {string} Formatted transaction ID
   * @example
   *   formatTransactionId('TRX-20260110-001') // "TRX-20260110-001"
   */
  formatTransactionId(id) {
    return id || '-';
  },

  /**
   * Format percentage
   * @param {number} value - Percentage value (0-100)
   * @param {number} decimals - Decimal places (default: 1)
   * @returns {string} Formatted percentage
   * @example
   *   formatPercentage(75.5) // "75,5%"
   *   formatPercentage(100, 0) // "100%"
   */
  formatPercentage(value, decimals = 1) {
    if (value === null || value === undefined) return '0%';
    const num = Number(value);
    // Replace dot with comma for Indonesian format
    return `${num.toFixed(decimals).replace('.', ',')}%`;
  },

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   * @example
   *   truncateText('Lorem ipsum dolor sit amet', 10) // "Lorem ipsu..."
   */
  truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Pluralize words in Indonesian
   * @param {number} count - Count
   * @param {string} singular - Singular form
   * @param {string} plural - Plural form (optional, defaults to singular)
   * @returns {string} Pluralized text
   * @example
   *   pluralize(1, 'transaksi') // "1 transaksi"
   *   pluralize(5, 'transaksi') // "5 transaksi"
   *   pluralize(1, 'item', 'item-item') // "1 item"
   */
  pluralize(count, singular, _plural = singular) {
    // eslint-disable-line no-unused-vars
    // Indonesian simple pluralization: just show count + word
    // Occasionally repeats word (item-item), but for now simple is fine per requirements
    return `${count} ${singular}`;
  },

  /**
   * Format number with thousand separators
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   * @example
   *   formatNumber(1000000) // "1.000.000"
   */
  formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
};
