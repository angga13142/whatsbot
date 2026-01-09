/**
 * Currency Service
 *
 * Multi-currency support, exchange rates, and conversions
 */

const logger = require('../utils/logger');

class CurrencyService {
  constructor() {
    this.baseCurrency = 'IDR';
    this.supportedCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'CNY'];
    this.rateCache = new Map();
    this.cacheDuration = 3600000; // 1 hour in milliseconds
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} from - From currency code
   * @param {string} to - To currency code
   * @returns {Promise<number>}
   */
  async getExchangeRate(from, to) {
    try {
      // If same currency, rate is 1
      if (from === to) {
        return 1;
      }

      // Check cache first
      const cacheKey = `${from}_${to}`;
      const cached = this.rateCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        logger.debug('Using cached exchange rate', { from, to, rate: cached.rate });
        return cached.rate;
      }

      // Get from database first
      const knex = require('../database/connection');
      const dbRate = await knex('currency_rates')
        .where({
          from_currency: from,
          to_currency: to,
        })
        .where('valid_from', '<=', knex.fn.now())
        .where(function () {
          this.whereNull('valid_until').orWhere('valid_until', '>=', knex.fn.now());
        })
        .orderBy('valid_from', 'desc')
        .first();

      if (dbRate) {
        const rate = parseFloat(dbRate.rate);
        this._cacheRate(from, to, rate);
        return rate;
      }

      // If not in database, use approximate rate
      const rate = this._getApproximateRate(from, to);

      // Save to database
      await this.saveExchangeRate(from, to, rate, 'system');

      return rate;
    } catch (error) {
      logger.error('Error getting exchange rate', {
        from,
        to,
        error: error.message,
      });
      // Return approximate rate as fallback
      return this._getApproximateRate(from, to);
    }
  }

  /**
   * Get approximate exchange rate (fallback)
   * @param {string} from - From currency
   * @param {string} to - To currency
   * @returns {number}
   * @private
   */
  _getApproximateRate(from, to) {
    // Approximate rates to IDR (as of 2024)
    const toIDR = {
      USD: 15500,
      EUR: 17000,
      SGD: 11500,
      MYR: 3500,
      JPY: 105,
      CNY: 2150,
      IDR: 1,
    };

    const fromRate = toIDR[from] || 1;
    const toRate = toIDR[to] || 1;

    return toRate / fromRate;
  }

  /**
   * Convert amount between currencies
   * @param {number} amount - Amount to convert
   * @param {string} from - From currency
   * @param {string} to - To currency
   * @returns {Promise<Object>}
   */
  async convertAmount(amount, from, to) {
    try {
      const rate = await this.getExchangeRate(from, to);
      const converted = amount * rate;

      return {
        original_amount: amount,
        original_currency: from,
        converted_amount: converted,
        converted_currency: to,
        exchange_rate: rate,
        conversion_date: new Date(),
      };
    } catch (error) {
      logger.error('Error converting amount', {
        amount,
        from,
        to,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save exchange rate to database
   * @param {string} from - From currency
   * @param {string} to - To currency
   * @param {number} rate - Exchange rate
   * @param {string} source - Source (api, manual, system)
   * @returns {Promise<Object>}
   */
  async saveExchangeRate(from, to, rate, source = 'manual') {
    try {
      const knex = require('../database/connection');

      // Invalidate old rates
      await knex('currency_rates')
        .where({
          from_currency: from,
          to_currency: to,
        })
        .whereNull('valid_until')
        .update({
          valid_until: knex.fn.now(),
        });

      // Insert new rate
      const [result] = await knex('currency_rates')
        .insert({
          from_currency: from,
          to_currency: to,
          rate,
          source,
          valid_from: knex.fn.now(),
          valid_until: null,
        })
        .returning('id');

      const id = typeof result === 'object' ? result.id : result;

      // Cache the rate
      this._cacheRate(from, to, rate);

      logger.info('Exchange rate saved', { from, to, rate, source });

      return { id, from, to, rate };
    } catch (error) {
      logger.error('Error saving exchange rate', {
        from,
        to,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user's preferred currency
   * @param {number} userId - User ID
   * @returns {Promise<string>}
   */
  async getUserCurrency(userId) {
    try {
      const knex = require('../database/connection');

      const preference = await knex('user_currency_preferences').where({ user_id: userId }).first();

      return preference ? preference.preferred_currency : this.baseCurrency;
    } catch (error) {
      logger.error('Error getting user currency', { userId, error: error.message });
      return this.baseCurrency;
    }
  }

  /**
   * Set user's preferred currency
   * @param {number} userId - User ID
   * @param {string} currency - Currency code
   * @param {boolean} autoConvert - Auto convert amounts
   * @returns {Promise<Object>}
   */
  async setUserCurrency(userId, currency, autoConvert = true) {
    try {
      if (!this.supportedCurrencies.includes(currency)) {
        throw new Error(`Currency ${currency} tidak didukung`);
      }

      const knex = require('../database/connection');

      // Check if preference exists
      const existing = await knex('user_currency_preferences').where({ user_id: userId }).first();

      if (existing) {
        // Update
        await knex('user_currency_preferences').where({ user_id: userId }).update({
          preferred_currency: currency,
          auto_convert: autoConvert,
          updated_at: knex.fn.now(),
        });
      } else {
        // Insert
        await knex('user_currency_preferences').insert({
          user_id: userId,
          preferred_currency: currency,
          auto_convert: autoConvert,
        });
      }

      logger.info('User currency preference set', { userId, currency });

      return { userId, currency, autoConvert };
    } catch (error) {
      logger.error('Error setting user currency', {
        userId,
        currency,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get supported currencies list
   * @returns {Array}
   */
  getSupportedCurrencies() {
    return this.supportedCurrencies.map((code) => ({
      code,
      name: this._getCurrencyName(code),
      symbol: this._getCurrencySymbol(code),
    }));
  }

  /**
   * Get currency name
   * @param {string} code - Currency code
   * @returns {string}
   * @private
   */
  _getCurrencyName(code) {
    const names = {
      IDR: 'Indonesian Rupiah',
      USD: 'US Dollar',
      EUR: 'Euro',
      SGD: 'Singapore Dollar',
      MYR: 'Malaysian Ringgit',
      JPY: 'Japanese Yen',
      CNY: 'Chinese Yuan',
    };
    return names[code] || code;
  }

  /**
   * Get currency symbol
   * @param {string} code - Currency code
   * @returns {string}
   * @private
   */
  _getCurrencySymbol(code) {
    const symbols = {
      IDR: 'Rp',
      USD: '$',
      EUR: '€',
      SGD: 'S$',
      MYR: 'RM',
      JPY: '¥',
      CNY: '¥',
    };
    return symbols[code] || code;
  }

  /**
   * Cache exchange rate
   * @param {string} from - From currency
   * @param {string} to - To currency
   * @param {number} rate - Exchange rate
   * @private
   */
  _cacheRate(from, to, rate) {
    const cacheKey = `${from}_${to}`;
    this.rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear rate cache
   */
  clearCache() {
    this.rateCache.clear();
    logger.info('Exchange rate cache cleared');
  }

  /**
   * Format amount in currency
   * @param {number} amount - Amount
   * @param {string} currency - Currency code
   * @returns {string}
   */
  formatAmount(amount, currency = 'IDR') {
    const symbol = this._getCurrencySymbol(currency);
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: currency === 'IDR' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(amount);

    return `${symbol}${formatted}`;
  }
}

module.exports = new CurrencyService();
