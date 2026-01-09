/**
 * Currency Converter Utility
 *
 * Helper functions for currency conversion
 */

const logger = require('./logger');

/**
 * Convert amount with error handling
 * @param {number} amount - Amount to convert
 * @param {string} from - From currency
 * @param {string} to - To currency
 * @returns {Promise<number>} Converted amount
 */
async function convert(amount, from, to) {
  try {
    if (from === to) {
      return amount;
    }

    const currencyService = require('../services/currencyService');
    const result = await currencyService.convertAmount(amount, from, to);
    return result.converted_amount;
  } catch (error) {
    logger.error('Currency conversion failed', {
      amount,
      from,
      to,
      error: error.message,
    });

    // Return original amount as fallback
    return amount;
  }
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
function formatWithCurrency(amount, currency = 'IDR') {
  const symbols = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    SGD: 'S$',
    MYR: 'RM',
    JPY: '¥',
    CNY: '¥',
  };

  const symbol = symbols[currency] || currency;
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formatted}`;
}

/**
 * Convert transaction to user's preferred currency
 * @param {Object} transaction - Transaction object
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Transaction with converted amount
 */
async function convertTransactionForUser(transaction, userId) {
  try {
    const currencyService = require('../services/currencyService');
    const userCurrency = await currencyService.getUserCurrency(userId);

    if (transaction.currency === userCurrency) {
      return {
        ...transaction,
        display_amount: transaction.amount,
        display_currency: userCurrency,
      };
    }

    const converted = await convert(transaction.amount, transaction.currency, userCurrency);

    return {
      ...transaction,
      original_amount: transaction.amount,
      original_currency: transaction.currency,
      display_amount: converted,
      display_currency: userCurrency,
    };
  } catch (error) {
    logger.error('Error converting transaction for user', {
      transactionId: transaction.id,
      userId,
      error: error.message,
    });

    return transaction;
  }
}

/**
 * Batch convert multiple amounts
 * @param {Array<number>} amounts - Amounts to convert
 * @param {string} from - From currency
 * @param {string} to - To currency
 * @returns {Promise<Array<number>>} Converted amounts
 */
async function batchConvert(amounts, from, to) {
  try {
    if (from === to) {
      return amounts;
    }

    const currencyService = require('../services/currencyService');
    const rate = await currencyService.getExchangeRate(from, to);
    return amounts.map((amount) => amount * rate);
  } catch (error) {
    logger.error('Batch conversion failed', { error: error.message });
    return amounts;
  }
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
function getCurrencySymbol(currency) {
  const symbols = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    SGD: 'S$',
    MYR: 'RM',
    JPY: '¥',
    CNY: '¥',
  };

  return symbols[currency] || currency;
}

/**
 * Get currency name
 * @param {string} currency - Currency code
 * @returns {string} Currency name
 */
function getCurrencyName(currency) {
  const names = {
    IDR: 'Indonesian Rupiah',
    USD: 'US Dollar',
    EUR: 'Euro',
    SGD: 'Singapore Dollar',
    MYR: 'Malaysian Ringgit',
    JPY: 'Japanese Yen',
    CNY: 'Chinese Yuan',
  };

  return names[currency] || currency;
}

/**
 * Validate currency code
 * @param {string} currency - Currency code
 * @returns {boolean} True if valid
 */
function isValidCurrency(currency) {
  const supported = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'CNY'];
  return supported.includes(currency);
}

/**
 * Get list of supported currencies
 * @returns {Array<Object>} List of currencies with code, symbol, name
 */
function getSupportedCurrencies() {
  return [
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  ];
}

module.exports = {
  convert,
  formatWithCurrency,
  convertTransactionForUser,
  batchConvert,
  getCurrencySymbol,
  getCurrencyName,
  isValidCurrency,
  getSupportedCurrencies,
};
