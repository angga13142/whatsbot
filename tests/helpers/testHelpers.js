/**
 * Test Helper Functions
 *
 * Utility functions for testing
 */

// Simple random generator to avoid ESM issues with faker
const random = {
  numeric: (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  },
  string: (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  fullName: () => {
    const firstNames = ['Budi', 'Siti', 'Ahmad', 'Rina', 'Joko'];
    const lastNames = ['Santoso', 'Wijaya', 'Putri', 'Hidayat', 'Susanto'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  },
  productName: () => {
    return `Product ${Math.floor(Math.random() * 100)}`;
  },
};

/**
 * Generate random Indonesian phone number
 * @returns {string} Phone number in format 628xxxxxxxxx
 */
function generatePhoneNumber() {
  const prefix = '628';
  const number = random.numeric(9);
  return prefix + number;
}

/**
 * Generate random user data
 * @param {string} role - User role
 * @returns {Object} User data
 */
function generateUserData(role = 'karyawan') {
  return {
    phone_number: generatePhoneNumber(),
    full_name: random.fullName(),
    role,
    status: 'active',
  };
}

/**
 * Generate random transaction data
 * @param {number} userId - User ID
 * @param {string} type - Transaction type
 * @returns {Object} Transaction data
 */
function generateTransactionData(userId, type = 'paket') {
  const amount = Math.floor(Math.random() * 5000000) + 10000;

  return {
    transaction_id: `TRX-TEST-${random.numeric(3)}`,
    user_id: userId,
    type,
    category: type === 'paket' ? 'Penjualan' : type === 'utang' ? 'Piutang' : 'Pengeluaran',
    amount,
    description: random.productName(),
    customer_name: type === 'utang' ? random.fullName() : null,
    status: amount < 1000000 ? 'approved' : 'pending',
    transaction_date: new Date(),
  };
}

/**
 * Wait for specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean test data from database
 * @param {Object} knex - Knex instance
 */
async function cleanTestData(knex) {
  // Delete transactions with TEST in ID
  await knex('transactions').where('transaction_id', 'like', '%TEST%').delete();

  // Delete test users (phone starting with 6289)
  await knex('users').where('phone_number', 'like', '6289%').delete();

  // Delete test audit logs
  await knex('audit_logs').where('action', 'like', '%test%').delete();
}

/**
 * Create test database instance
 * @returns {Object} Knex instance for testing
 */
function createTestDatabase() {
  const knex = require('knex')({
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  });

  return knex;
}

/**
 * Assert error thrown
 * @param {Function} fn - Function to test
 * @param {string} expectedMessage - Expected error message
 */
async function assertThrows(fn, expectedMessage = null) {
  let error;

  try {
    await fn();
  } catch (e) {
    error = e;
  }

  if (!error) {
    throw new Error('Expected function to throw error');
  }

  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(
      `Expected error message to include "${expectedMessage}", got "${error.message}"`
    );
  }

  return error;
}

module.exports = {
  generatePhoneNumber,
  generateUserData,
  generateTransactionData,
  wait,
  cleanTestData,
  createTestDatabase,
  assertThrows,
};
