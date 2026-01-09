/**
 * Natural Language Parser
 *
 * Parse Indonesian natural language input for transactions
 */

// const nlp = require('compromise'); // Removed as unused

module.exports = {
  /**
   * Parse natural amount from text
   * @param {string} text - Text containing amount
   * @returns {Object} { amount: number, details: Object }
   * @example
   *   parseNaturalAmount('jual 5 paket @50rb')
   *   // { amount: 250000, details: { quantity: 5, unitPrice: 50000 } }
   *
   *   parseNaturalAmount('250rb')
   *   // { amount: 250000, details: {} }
   *
   *   parseNaturalAmount('1.5jt')
   *   // { amount: 1500000, details: {} }
   */
  parseNaturalAmount(text) {
    if (!text) return { amount: 0, details: {} };
    const cleanText = text.toLowerCase();

    // Pattern 1: Multiplier "X paket @Yrb" or "X @ Y"
    // Regex explanation:
    // (\d+) : Qty
    // \s* : optional space
    // (?:paket|pcs|buah)? : optional unit
    // \s*[@x]\s* : separator @ or x
    // ([\d\.,]+(?:rb|jt|juta|ribu|k)?) : Price part
    const multiplierRegex = /(\d+)\s*(?:paket|pcs|buah)?\s*[@x]\s*([\d.,]+(?:rb|jt|juta|ribu|k)?)/i;
    const match = cleanText.match(multiplierRegex);

    if (match) {
      const qty = parseInt(match[1]);
      const priceStr = match[2];
      const unitPrice = this.normalizeAmount(priceStr);

      return {
        amount: qty * unitPrice,
        details: {
          quantity: qty,
          unitPrice: unitPrice,
        },
      };
    }

    // Pattern 2: Single amount
    const amount = this.normalizeAmount(cleanText);
    return {
      amount: amount,
      details: {},
    };
  },

  /**
   * Parse transaction intent from text
   * @param {string} text - Text to analyze
   * @returns {string|null} Transaction type or null
   */
  parseTransactionIntent(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Priority matching
    if (lower.includes('jual') || lower.includes('penjualan') || lower.includes('paket'))
      return 'paket';
    if (lower.includes('utang') || lower.includes('piutang') || lower.includes('kredit'))
      return 'utang';
    if (lower.includes('beli') || lower.includes('jajan') || lower.includes('pengeluaran'))
      return 'jajan';

    return null;
  },

  /**
   * Extract all numbers from text
   * @param {string} text - Text to analyze
   * @returns {Array<number>} Array of numbers found
   */
  extractNumbers(text) {
    if (!text) return [];
    // Use simple regex for cleaner extraction in this context, compromise can be heavy/english focused
    // Line 89 replacement
    const numbers = text.match(/\d+(?:[.,]\d+)?/g);
    if (!numbers) return [];

    return numbers.map((n) => {
      // Normalize 1.000 -> 1000
      return parseFloat(n.replace(/\./g, '').replace(',', '.'));
    });
  },

  /**
   * Normalize amount format
   * @param {string} text - Amount text
   * @returns {number} Normalized amount
   */
  normalizeAmount(text) {
    if (!text) return 0;
    let str = text.toLowerCase().trim();

    // Remove currency symbol if stuck to number
    str = str.replace(/^rp\.?\s?/, '');

    let multiplier = 1;

    if (str.includes('rb') || str.includes('ribu') || str.endsWith('k')) {
      multiplier = 1000;
      str = str.replace(/rb|ribu|k/g, '');
    } else if (str.includes('jt') || str.includes('juta')) {
      multiplier = 1000000;
      str = str.replace(/jt|juta/g, '');
    }

    // Handle Indonesian format (dots for thousands, comma for decimal)
    // Scenario 1: 1.5 (when jt) -> 1.5 * 1000000 = 1500000
    // Scenario 2: 100.000 -> 100000

    // If str has comma, replace with dot for JS parseFloat, BUT remove existing dots first
    // If just dots, simply remove them

    // Check if decimal context exists (usually with 'jt')
    if (multiplier > 1 && (str.includes('.') || str.includes(','))) {
      // E.g 1.5 jt -> 1.5
      // E.g 1,5 jt -> 1.5
      str = str.replace(',', '.');
    } else {
      // E.g 100.000 -> 100000
      // E.g 100,000 -> 100000
      // Standardize: remove non-numeric chars except dot/comma, then decide
      // safely: remove dots, replace comma with dot
      str = str.replace(/\./g, '').replace(',', '.');
    }

    const val = parseFloat(str);
    if (isNaN(val)) return 0;

    return val * multiplier;
  },

  /**
   * Parse customer name from utang text
   * @param {string} text - Text containing customer name
   * @returns {string|null} Customer name or null
   */
  parseCustomerName(text) {
    if (!text) return null;
    // Pattern: "utang [NAME] [AMOUNT]" or "utang [NAME]"
    // Remove 'utang' keyword
    let clean = text.toLowerCase().replace('utang', '').trim();

    // Remove amounts from text to isolate name
    // Regex to find amount-like strings and remove them
    clean = clean.replace(/rp.?\s*[\d.,]+(?:rb|jt|k)?/g, '');
    clean = clean.replace(/\d+(?:rb|jt|k)/g, '');
    clean = clean.replace(/\d+/g, ''); // remove bare numbers too

    clean = clean.trim();

    if (clean.length < 2) return null;

    // Capitalize
    return clean.replace(/\b\w/g, (c) => c.toUpperCase());
  },
};
