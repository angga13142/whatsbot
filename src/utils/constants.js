// File: src/utils/constants.js

/**
 * Application Constants
 *
 * Purpose: Define all constant values used across the application
 * including roles, transaction types, status, and messages.
 *
 * @module utils/constants
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

  // Audit Log Actions
  AUDIT_ACTIONS: {
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    USER_SUSPENDED: 'USER_SUSPENDED',
    TRANSACTION_CREATED: 'TRANSACTION_CREATED',
    TRANSACTION_APPROVED: 'TRANSACTION_APPROVED',
    TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
    REPORT_GENERATED: 'REPORT_GENERATED',
    BACKUP_CREATED: 'BACKUP_CREATED',
    SYSTEM_CONFIG_UPDATED: 'SYSTEM_CONFIG_UPDATED',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
  },

  // Standard Messages
  MESSAGES: {
    WELCOME: '👋 Selamat datang di WhatsApp Cashflow Bot!',
    UNAUTHORIZED: '⛔ Maaf, Anda tidak memiliki akses untuk perintah ini.',
    ERROR_GENERIC: '❌ Terjadi kesalahan pada sistem. Silakan coba lagi nanti.',
    SUCCESS_GENERIC: '✅ Permintaan berhasil diproses.',
    INVALID_FORMAT: '⚠️ Format pesan tidak valid.',
    NOT_REGISTERED: '⚠️ Nomor Anda belum terdaftar. Silakan hubungi Admin.',
  },

  // Date Formats
  DATE_FORMATS: {
    DISPLAY_DATE: 'DD MMMM YYYY',
    DISPLAY_DATETIME: 'DD MMMM YYYY HH:mm',
    DB_DATE: 'YYYY-MM-DD',
    DB_DATETIME: 'YYYY-MM-DD HH:mm:ss',
    LOG_TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS',
  },
};
