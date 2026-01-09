/**
 * Mock Data Generators
 *
 * Pre-defined mock data for consistent testing
 */

const MOCK_USERS = {
  superadmin: {
    id: 1,
    phone_number: '628123456789',
    full_name: 'Super Admin',
    role: 'superadmin',
    status: 'active',
    pin: '$2b$10$mockhashedpin',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },

  admin: {
    id: 2,
    phone_number: '628123456790',
    full_name: 'Admin User',
    role: 'admin',
    status: 'active',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },

  karyawan: {
    id: 3,
    phone_number: '628123456791',
    full_name: 'Karyawan User',
    role: 'karyawan',
    status: 'active',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },

  investor: {
    id: 4,
    phone_number: '628123456792',
    full_name: 'Investor User',
    role: 'investor',
    status: 'active',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },

  suspended: {
    id: 5,
    phone_number: '628123456793',
    full_name: 'Suspended User',
    role: 'karyawan',
    status: 'suspended',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
};

const MOCK_TRANSACTIONS = {
  approved: {
    id: 1,
    transaction_id: 'TRX-20260110-001',
    user_id: 3,
    type: 'paket',
    category: 'Penjualan',
    amount: 500000,
    description: 'Penjualan 5 paket',
    status: 'approved',
    approved_by: 3,
    approved_at: new Date('2026-01-10'),
    transaction_date: new Date('2026-01-10'),
    created_at: new Date('2026-01-10'),
  },

  pending: {
    id: 2,
    transaction_id: 'TRX-20260110-002',
    user_id: 3,
    type: 'paket',
    category: 'Penjualan',
    amount: 2000000,
    description: 'Penjualan besar',
    status: 'pending',
    transaction_date: new Date('2026-01-10'),
    created_at: new Date('2026-01-10'),
  },

  utang: {
    id: 3,
    transaction_id: 'TRX-20260110-003',
    user_id: 3,
    type: 'utang',
    category: 'Piutang',
    amount: 1500000,
    description: 'Utang Pak Budi',
    customer_name: 'Pak Budi',
    status: 'approved',
    transaction_date: new Date('2026-01-10'),
    created_at: new Date('2026-01-10'),
  },
};

/**
 * Create mock WhatsApp message
 * @param {string} body - Message body
 * @param {string} from - Sender phone number
 * @returns {Object} Mock message object
 */
function createMockMessage(body, from = '628123456791@c.us') {
  return {
    body,
    from,
    hasMedia: false,
    reply: jest.fn().mockResolvedValue(true),
    getChat: jest.fn().mockResolvedValue({
      sendMessage: jest.fn().mockResolvedValue(true),
    }),
  };
}

/**
 * Create mock WhatsApp client
 * @returns {Object} Mock client object
 */
function createMockWhatsAppClient() {
  return {
    info: {
      wid: { user: '628123456789' },
      pushname: 'Test Bot',
      platform: 'test',
      battery: 100,
    },
    sendMessage: jest.fn().mockResolvedValue({
      id: { _serialized: 'mock-message-id' },
    }),
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
  };
}

module.exports = {
  MOCK_USERS,
  MOCK_TRANSACTIONS,
  createMockMessage,
  createMockWhatsAppClient,
};
