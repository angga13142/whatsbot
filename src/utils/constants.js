/**
 * Application Constants
 *
 * Centralized constants used throughout the application
 */

module.exports = {
  // User Roles
  ROLES: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    KARYAWAN: 'karyawan',
    INVESTOR: 'investor',
  },

  // Transaction Types
  TRANSACTION_TYPES: {
    PAKET: 'paket',
    UTANG: 'utang',
    JAJAN: 'jajan',
  },

  // Transaction Status
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // User Status
  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive',
  },

  // Session States (for conversation flow)
  SESSION_STATES: {
    IDLE: 'idle',
    AWAITING_TRANSACTION_TYPE: 'awaiting_transaction_type',
    AWAITING_AMOUNT: 'awaiting_amount',
    AWAITING_DESCRIPTION: 'awaiting_description',
    AWAITING_CUSTOMER_NAME: 'awaiting_customer_name',
    AWAITING_IMAGE: 'awaiting_image',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    AWAITING_2FA: 'awaiting_2fa',
  },

  // Error Messages (Bahasa Indonesia)
  ERROR_MESSAGES: {
    USER_NOT_REGISTERED: 'Anda belum terdaftar. Silakan hubungi admin untuk registrasi.',
    USER_SUSPENDED: 'Akun Anda sedang ditangguhkan. Hubungi admin untuk informasi lebih lanjut.',
    PERMISSION_DENIED: '⛔ Anda tidak memiliki izin untuk melakukan aksi ini.',
    INVALID_INPUT: '⚠️ Input tidak valid. Silakan coba lagi.',
    TRANSACTION_NOT_FOUND: '❌ Transaksi tidak ditemukan.',
    DATABASE_ERROR: '❌ Terjadi kesalahan sistem. Silakan coba lagi nanti.',
    RATE_LIMIT: '⚠️ Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
    TWO_FA_REQUIRED: '🔐 Verifikasi 2FA diperlukan. Silakan masukkan PIN Anda.',
    INVALID_COMMAND: '❓ Perintah tidak dikenali. Ketik /help untuk melihat daftar perintah.',
    INVALID_PHONE: '⚠️ Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx',
  },

  // Success Messages (Bahasa Indonesia)
  SUCCESS_MESSAGES: {
    TRANSACTION_CREATED: '✅ Transaksi berhasil dicatat!',
    TRANSACTION_APPROVED: '✅ Transaksi berhasil disetujui!',
    TRANSACTION_REJECTED: '❌ Transaksi ditolak.',
    USER_CREATED: '✅ User berhasil ditambahkan!',
    USER_SUSPENDED: '⚠️ User berhasil ditangguhkan.',
    USER_UNSUSPENDED: '✅ User berhasil diaktifkan kembali.',
    OPERATION_CANCELLED: 'Operasi dibatalkan.',
  },

  // Permission Matrix (role-based access)
  PERMISSIONS: {
    superadmin: {
      manage_users: true,
      manage_admins: true,
      manage_superadmins: true,
      create_transaction: true,
      approve_transaction: true,
      view_all_reports: true,
      execute_sql: true,
      manage_system_config: true,
      view_audit_logs: true,
    },
    admin: {
      manage_users: true,
      manage_admins: false,
      manage_superadmins: false,
      create_transaction: true,
      approve_transaction: true,
      view_all_reports: true,
      execute_sql: false,
      manage_system_config: false,
      view_audit_logs: false,
    },
    karyawan: {
      manage_users: false,
      manage_admins: false,
      manage_superadmins: false,
      create_transaction: true,
      approve_transaction: false,
      view_all_reports: false,
      execute_sql: false,
      manage_system_config: false,
      view_audit_logs: false,
    },
    investor: {
      manage_users: false,
      manage_admins: false,
      manage_superadmins: false,
      create_transaction: false,
      approve_transaction: false,
      view_all_reports: true,
      execute_sql: false,
      manage_system_config: false,
      view_audit_logs: false,
    },
  },

  // Emojis
  EMOJIS: {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    MONEY: '💰',
    PACKAGE: '📦',
    DEBT: '💳',
    EXPENSE: '🍔',
    REPORT: '📊',
    USER: '👤',
    ADMIN: '👔',
    SUPERADMIN: '👑',
    INVESTOR: '👀',
    KARYAWAN: '💼',
  },
};
