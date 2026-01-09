/**
 * Jest Global Test Setup
 *
 * This file runs before all tests
 */

const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Minimize logs during testing

// ══════════════════════════════════════════
// GLOBAL MOCKS
// ══════════════════════════════════════════

/**
 * Mock WhatsApp Client
 */
global.mockWhatsAppClient = {
  info: {
    wid: { user: '628123456789' },
    pushname: 'Test Bot',
    platform: 'Test Platform',
    battery: 100,
  },

  initialize: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  getState: jest.fn().mockResolvedValue('CONNECTED'),

  sendMessage: jest.fn().mockResolvedValue({
    id: { _serialized: 'test_message_id' },
    body: 'test message',
    timestamp: Date.now(),
  }),

  on: jest.fn(),
  removeAllListeners: jest.fn(),

  requestPairingCode: jest.fn().mockResolvedValue('TEST-CODE'),
};

/**
 * Mock Database Connection
 */
global.mockDatabase = {
  query: jest.fn().mockResolvedValue([]),
  execute: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  close: jest.fn().mockResolvedValue(true),
};

/**
 * Mock Logger
 */
global.mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ══════════════════════════════════════════
// GLOBAL TEST UTILITIES
// ══════════════════════════════════════════

/**
 * Create mock message object
 */
global.createMockMessage = (body, from = '628123456789@c.us', options = {}) => {
  return {
    id: {
      _serialized: `test_msg_${Date.now()}`,
    },
    body,
    from,
    to: '628987654321@c.us',
    timestamp: Date.now(),
    hasMedia: options.hasMedia || false,
    type: options.type || 'chat',
    reply: jest.fn().mockResolvedValue(true),
    getChat: jest.fn().mockResolvedValue({
      id: { _serialized: from },
      name: options.chatName || 'Test Chat',
    }),
    getContact: jest.fn().mockResolvedValue({
      id: { _serialized: from },
      pushname: options.contactName || 'Test User',
      number: from.replace('@c.us', ''),
    }),
    downloadMedia: jest.fn().mockResolvedValue({
      mimetype: 'image/jpeg',
      data: 'base64_image_data',
      filename: 'test.jpg',
    }),
    ...options,
  };
};

/**
 * Create mock user object
 */
global.createMockUser = (role = 'karyawan', options = {}) => {
  return {
    id: options.id || 1,
    phone_number: options.phone || '628123456789',
    full_name: options.name || 'Test User',
    role,
    status: options.status || 'active',
    created_at: new Date(),
    ...options,
  };
};

/**
 * Create mock transaction object
 */
global.createMockTransaction = (type = 'paket', amount = 100000, options = {}) => {
  return {
    id: options.id || 1,
    transaction_id: options.transaction_id || `TRX-${Date.now()}`,
    user_id: options.user_id || 1,
    type,
    amount,
    description: options.description || 'Test transaction',
    status: options.status || 'approved',
    created_at: new Date(),
    ...options,
  };
};

/**
 * Sleep utility for async tests
 */
global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ══════════════════════════════════════════
// CONSOLE SUPPRESSION (Optional)
// ══════════════════════════════════════════

// Suppress console during tests (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// ══════════════════════════════════════════
// GLOBAL TEARDOWN
// ══════════════════════════════════════════

afterAll(async () => {
  // Close database connections
  // Clean up test data
  // Close any open handles

  await new Promise((resolve) => setTimeout(resolve, 500)); // Give time for cleanup
});

// ══════════════════════════════════════════
// JEST MATCHERS (Custom)
// ══════════════════════════════════════════

expect.extend({
  /**
   * Check if value is a valid phone number
   */
  toBeValidPhoneNumber(received) {
    const pass = /^628\d{8,11}$/.test(received);
    return {
      message: () =>
        `expected ${received} to be a valid Indonesian phone number (format: 628xxxxxxxxx)`,
      pass,
    };
  },

  /**
   * Check if value is a valid transaction ID
   */
  toBeValidTransactionId(received) {
    const pass = /^TRX-\d{8}-\d{3}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid transaction ID (format: TRX-YYYYMMDD-NNN)`,
      pass,
    };
  },

  /**
   * Check if value is a valid rupiah amount
   */
  toBeValidRupiahAmount(received) {
    const pass = typeof received === 'number' && received >= 0;
    return {
      message: () => `expected ${received} to be a valid rupiah amount (number >= 0)`,
      pass,
    };
  },
});

// ══════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════

module.exports = {
  mockWhatsAppClient: global.mockWhatsAppClient,
  mockDatabase: global.mockDatabase,
  mockLogger: global.mockLogger,
  createMockMessage: global.createMockMessage,
  createMockUser: global.createMockUser,
  createMockTransaction: global.createMockTransaction,
  sleep: global.sleep,
};
