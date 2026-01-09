/**
 * Natural Language Parser
 *
 * Parse Indonesian natural language input for transactions
 */

/**
 * Normalize amount format
 * @param {string} text - Amount text
 * @returns {number} Normalized amount
 */
function normalizeAmount(text) {
  if (!text) return 0;
  let str = text.toLowerCase().trim();

  // Remove currency symbol if stuck to number
  str = str.replace(/^rp\.?\s?/, '');

  let multiplier = 1;

  // Remove internal spaces
  str = str.replace(/\s/g, '');

  if (str.includes('rb') || str.includes('ribu') || str.endsWith('k')) {
    multiplier = 1000;
    str = str.replace(/rb|ribu|k/g, '');
  } else if (str.includes('jt') || str.includes('juta')) {
    multiplier = 1000000;
    str = str.replace(/jt|juta/g, '');
  }

  // Handle Indonesian format (dots for thousands, comma for decimal)
  // If multiplier is present, usually people write "1.5 jt" or "1,5 jt" -> 1.5
  if (multiplier > 1) {
    str = str.replace(',', '.');
  } else {
    // Plain number. Assume Indo format.
    // 1.000.000 -> 1000000
    // 100,00 -> 100.00
    str = str.replace(/\./g, '').replace(',', '.');
  }

  const val = parseFloat(str);
  if (isNaN(val)) return 0;

  return val * multiplier;
}

/**
 * Extract all numbers from text
 * @param {string} text - Text to analyze
 * @returns {Array<number>} Array of numbers found
 */
function extractNumbers(text) {
  if (!text) return [];
  // Use simple regex for cleaner extraction in this context
  const numbers = text.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers) return [];

  return numbers.map((n) => {
    // Normalize 1.000 -> 1000
    return parseFloat(n.replace(/\./g, '').replace(',', '.'));
  });
}

/**
 * Parse natural amount from text
 * @param {string} text - Text containing amount
 * @returns {Object} { amount: number, details: Object }
 */
function parseNaturalAmount(text) {
  if (!text) return { amount: 0, details: {} };
  const cleanText = text.toLowerCase();

  // Pattern 1: Multiplier "X paket @Yrb" or "X @ Y"
  const multiplierRegex = /(\d+)\s*(?:paket|pcs|buah)?\s*[@x]\s*([\d.,]+(?:rb|jt|juta|ribu|k)?)/i;
  const match = cleanText.match(multiplierRegex);

  if (match) {
    const qty = parseInt(match[1]);
    const priceStr = match[2];
    const unitPrice = normalizeAmount(priceStr);

    return {
      amount: qty * unitPrice,
      details: {
        quantity: qty,
        unitPrice: unitPrice,
      },
    };
  }

  // Pattern 2: Single amount
  const amount = normalizeAmount(cleanText);
  return {
    amount: amount,
    details: {},
  };
}

/**
 * Parse transaction intent from text
 * @param {string} text - Text to analyze
 * @returns {string|null} Transaction type or null
 */
function parseTransactionIntent(text) {
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
}

/**
 * Parse customer name from utang text
 * @param {string} text - Text containing customer name
 * @returns {string|null} Customer name or null
 */
function parseCustomerName(text) {
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
}

module.exports = {
  parseNaturalAmount,
  normalizeAmount,
  extractNumbers,
  parseTransactionIntent,
  parseCustomerName,
};
