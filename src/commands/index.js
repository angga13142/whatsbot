/**
 * Command Registry
 *
 * Central registry for all bot commands
 * Provides command lookup, routing, and metadata
 */

const { ROLES } = require('../utils/constants');

// Import all command handlers
const startCommand = require('./common/startCommand');
const helpCommand = require('./common/helpCommand');
const statusCommand = require('./common/statusCommand');

const catatCommand = require('./karyawan/catatCommand');
const laporanCommand = require('./karyawan/laporanCommand');
const historyCommand = require('./karyawan/historyCommand');

const addKaryawanCommand = require('./bos/addKaryawanCommand');
const addInvestorCommand = require('./bos/addInvestorCommand');
const suspendCommand = require('./bos/suspendCommand');
const approveCommand = require('./bos/approveCommand');
const rejectCommand = require('./bos/rejectCommand');
const pendingCommand = require('./bos/pendingCommand');
const laporanBosCommand = require('./bos/laporanBosCommand');

const sqlCommand = require('./superadmin/sqlCommand');
const createAdminCommand = require('./superadmin/createAdminCommand');
const usersCommand = require('./superadmin/usersCommand');
const logsCommand = require('./superadmin/logsCommand');

// Customer commands
const customerCommand = require('./customer/customerCommand');

/**
 * Command definitions by role
 * Each command has:  name, description, usage, handler, permission
 */
const commands = {
  // Common commands (available to all roles)
  common: [
    {
      name: 'start',
      aliases: ['mulai'],
      description: 'Memulai bot dan menampilkan pesan selamat datang',
      usage: '/start',
      handler: startCommand.handler,
      permission: null, // No specific permission needed
    },
    {
      name: 'help',
      aliases: ['bantuan'],
      description: 'Menampilkan daftar perintah yang tersedia',
      usage: '/help',
      handler: helpCommand.handler,
      permission: null,
    },
    {
      name: 'status',
      aliases: ['info'],
      description: 'Menampilkan status akun Anda',
      usage: '/status',
      handler: statusCommand.handler,
      permission: null,
    },
  ],

  // Karyawan commands
  karyawan: [
    {
      name: 'catat',
      aliases: ['transaksi', 'input'],
      description: 'Mencatat transaksi baru (penjualan/utang/pengeluaran)',
      usage: '/catat',
      handler: catatCommand.handler,
      permission: 'create_transaction',
    },
    {
      name: 'laporan',
      aliases: ['report'],
      description: 'Melihat laporan transaksi hari ini',
      usage: '/laporan',
      handler: laporanCommand.handler,
      permission: null,
    },
    {
      name: 'history',
      aliases: ['riwayat'],
      description: 'Melihat riwayat transaksi',
      usage: '/history [jumlah hari]',
      handler: historyCommand.handler,
      permission: null,
    },
  ],

  // Customer self-service commands
  customer: [
    {
      name: 'balance',
      aliases: [],
      description: 'Check customer balance and credit status',
      usage: '/balance',
      handler: customerCommand.handler,
      permission: null,
    },
    {
      name: 'history',
      aliases: [],
      description: 'View customer transaction history',
      usage: '/history [days]',
      handler: customerCommand.handler,
      permission: null,
    },
    {
      name: 'invoice',
      aliases: [],
      description: 'View customer invoices',
      usage: '/invoice [invoice-number]',
      handler: customerCommand.handler,
      permission: null,
    },
    {
      name: 'pay',
      aliases: [],
      description: 'Get payment instructions for invoice',
      usage: '/pay [invoice-number]',
      handler: customerCommand.handler,
      permission: null,
    },
  ],

  // Admin (Bos) commands
  admin: [
    {
      name: 'addkaryawan',
      aliases: ['tambahkaryawan'],
      description: 'Menambahkan karyawan baru',
      usage: '/addkaryawan [nomor HP] [nama lengkap]',
      handler: addKaryawanCommand.handler,
      permission: 'manage_users',
    },
    {
      name: 'addinvestor',
      aliases: ['tambahinvestor'],
      description: 'Menambahkan investor baru',
      usage: '/addinvestor [nomor HP] [nama lengkap]',
      handler: addInvestorCommand.handler,
      permission: 'manage_users',
    },
    {
      name: 'suspend',
      aliases: ['tangguhkan'],
      description: 'Menangguhkan akun user',
      usage: '/suspend [nomor HP]',
      handler: suspendCommand.handler,
      permission: 'manage_users',
    },
    {
      name: 'approve',
      aliases: ['setuju'],
      description: 'Menyetujui transaksi pending',
      usage: '/approve [TRX-ID]',
      handler: approveCommand.handler,
      permission: 'approve_transaction',
    },
    {
      name: 'reject',
      aliases: ['tolak'],
      description: 'Menolak transaksi pending',
      usage: '/reject [TRX-ID] [alasan]',
      handler: rejectCommand.handler,
      permission: 'approve_transaction',
    },
    {
      name: 'pending',
      aliases: ['menunggu'],
      description: 'Melihat daftar transaksi yang menunggu approval',
      usage: '/pending',
      handler: pendingCommand.handler,
      permission: 'approve_transaction',
    },
    {
      name: 'laporan',
      aliases: ['report'],
      description: 'Melihat laporan lengkap (harian/bulanan)',
      usage: '/laporan [harian|bulanan]',
      handler: laporanBosCommand.handler,
      permission: 'view_all_reports',
    },
  ],

  // Superadmin commands
  superadmin: [
    {
      name: 'sql',
      aliases: [],
      description: 'Menjalankan query SQL (read-only)',
      usage: '/sql [query]',
      handler: sqlCommand.handler,
      permission: 'execute_sql',
    },
    {
      name: 'createadmin',
      aliases: ['buatadmin'],
      description: 'Membuat admin baru',
      usage: '/createadmin [nomor HP] [nama lengkap]',
      handler: createAdminCommand.handler,
      permission: 'manage_admins',
    },
    {
      name: 'users',
      aliases: ['listuser'],
      description: 'Melihat daftar semua user',
      usage: '/users [role]',
      handler: usersCommand.handler,
      permission: 'manage_users',
    },
    {
      name: 'logs',
      aliases: ['audit'],
      description: 'Melihat audit logs',
      usage: '/logs [action] [limit]',
      handler: logsCommand.handler,
      permission: 'view_audit_logs',
    },
  ],
};

module.exports = {
  /**
   * Get command by name for specific role
   * @param {string} commandName - Command name or alias
   * @param {string} userRole - User role
   * @returns {Object|null} Command object or null
   */
  getCommand(commandName, userRole) {
    const lowerName = commandName.toLowerCase();

    // Check common commands first
    for (const cmd of commands.common) {
      if (cmd.name === lowerName || cmd.aliases.includes(lowerName)) {
        return cmd;
      }
    }

    // Check role-specific commands
    const roleCommands = this._getCommandsForRole(userRole);
    for (const cmd of roleCommands) {
      if (cmd.name === lowerName || cmd.aliases.includes(lowerName)) {
        return cmd;
      }
    }

    return null;
  },

  /**
   * Get all available commands for role
   * @param {string} userRole - User role
   * @returns {Array} Array of command objects
   */
  getAllCommands(userRole) {
    const availableCommands = [...commands.common];

    // Add customer commands for all roles
    availableCommands.push(...commands.customer);

    // Add role-specific commands
    const roleCommands = this._getCommandsForRole(userRole);
    availableCommands.push(...roleCommands);

    return availableCommands;
  },

  /**
   * Get commands for specific role (including inherited commands)
   * @param {string} role - User role
   * @returns {Array} Array of commands
   * @private
   */
  _getCommandsForRole(role) {
    const roleCommands = [];

    // Karyawan commands
    if ([ROLES.KARYAWAN, ROLES.ADMIN, ROLES.SUPERADMIN].includes(role)) {
      roleCommands.push(...commands.karyawan);
    }

    // Admin commands
    if ([ROLES.ADMIN, ROLES.SUPERADMIN].includes(role)) {
      roleCommands.push(...commands.admin);
    }

    // Superadmin commands
    if (role === ROLES.SUPERADMIN) {
      roleCommands.push(...commands.superadmin);
    }

    return roleCommands;
  },

  /**
   * Check if command exists
   * @param {string} commandName - Command name
   * @returns {boolean} True if exists
   */
  commandExists(commandName) {
    const lowerName = commandName.toLowerCase();

    const allCommands = [
      ...commands.common,
      ...commands.customer,
      ...commands.karyawan,
      ...commands.admin,
      ...commands.superadmin,
    ];

    return allCommands.some((cmd) => cmd.name === lowerName || cmd.aliases.includes(lowerName));
  },
};
