// File: src/utils/parser.js

/**
 * NLP Parser Utility
 *
 * Purpose: Parse natural language input for transaction intent and amounts.
 *
 * @module utils/parser
 */

const nlp = require('compromise');
const { TRANSACTION_TYPES } = require('./constants');

module.exports = {
  /**
   * Extract amounts and calculate total from text
   * Supports: "250rb", "250.000", "5 paket @50rb"
   */
  parseNaturalAmount(text) {
    if (!text) return null;
    let normalized = text.toLowerCase().replace(/rp/g, '').trim();

    // Check for "qty X unit_price" pattern (e.g., "5 @ 50.000", "5x50rb")
    const multiPattern = /(\d+)\s*[\sx@]\s*(\d+(?:\.\d{3})*(?:rb|k|jt)?)/i;
    const multiMatch = normalized.match(multiPattern);

    if (multiMatch) {
      const qty = parseInt(multiMatch[1], 10);
      const unitPrice = this.normalizeAmount(multiMatch[2]);

      if (qty && unitPrice) {
        return {
          original: text,
          amount: qty * unitPrice,
          details: { qty, unitPrice },
        };
      }
    }

    // Single amount fallback
    const amount = this.normalizeAmount(normalized);
    if (amount > 0) {
      return {
        original: text,
        amount: amount,
        details: null,
      };
    }

    return null;
  },

  /**
   * Convert various string formats to number
   */
  normalizeAmount(amountStr) {
    if (!amountStr) return 0;

    let str = amountStr
      .toString()
      .toLowerCase()
      .trim()
      .replace(/rp\.?\s*/g, '')
      .replace(/,00$/g, '') // remove cents
      .replace(/[^0-9rbkjt.,]/g, ''); // Allow digits, k, rb, jt, dot, comma

    let multiplier = 1;

    // Handle modifiers
    if (str.endsWith('rb') || str.endsWith('k')) {
      multiplier = 1000;
      str = str.replace(/rb|k/, '');
    } else if (str.endsWith('jt')) {
      multiplier = 1000000;
      str = str.replace('jt', '');
    }

    // Handle delimiters: 100.000 or 100,000
    // If multiple dots, remove all but last (if comma) NO, IDR usually uses dots for thousands
    // Assumes IDR format: dot = thousand separator
    str = str.replace(/\./g, '');

    const value = parseFloat(str);

    return isNaN(value) ? 0 : value * multiplier;
  },

  /**
   * Detect generic intent (simple keyword matching)
   */
  parseTransactionIntent(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    if (lower.includes('paket') || lower.includes('jual')) return TRANSACTION_TYPES.PAKET;
    if (lower.includes('utang') || lower.includes('bon')) return TRANSACTION_TYPES.UTANG;
    if (lower.includes('jajan') || lower.includes('beli') || lower.includes('keluar'))
      return TRANSACTION_TYPES.JAJAN;

    return null;
  },

  extractNumbers(text) {
    const doc = nlp(text);
    return doc.numbers().out('array');
  },
};
