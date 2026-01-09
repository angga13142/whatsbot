// File: src/commands/index.js

/**
 * Command Registry
 *
 * Purpose: Centralized command routing and registration.
 * Allows routing by role and aliases.
 *
 * @module commands/index
 */

const logger = require('../utils/logger');
const { ROLES } = require('../utils/constants');

// Generic command loader
// In a real dynamic app, we might walk directories.
// For this Phase 1 MVP, we require manually to ensure order and visibility.

const registry = {
  common: {
    start: require('./common/startCommand'),
    help: require('./common/helpCommand'),
    status: require('./common/statusCommand'),
  },
  karyawan: {
    catat: require('./karyawan/catatCommand'),
    laporan: require('./karyawan/laporanCommand'),
  },
  admin: {
    // Combined BOS and ADMIN
    approve: require('./bos/approveCommand'),
    reject: require('./bos/rejectCommand'),
    addkaryawan: require('./bos/addUserCommand'),
    laporan_bos: require('./bos/laporanBosCommand'),
    pending: require('./bos/pendingCommand'), // Ensure this exists or is part of laporan
  },
  superadmin: {
    sql: require('./superadmin/sqlCommand'),
    // inherits admin commands logic usually, but here we separate namespace
  },
  investor: {
    // Read only commands
  },
};

module.exports = {
  async execute(message) {
    const body = message.body.trim();

    // 1. Check if it's a command
    if (!body.startsWith('/') && !body.startsWith('!')) {
      // Not a command? Maybe generic NLP?
      // For now, let's just delegate to 'catat' if it matches NLP pattern or check state
      // But the prompt says "NLP only active when form is executed" OR "Smart Input".
      // Let's check for "catat transaksi" keyword or similar.
      const lower = body.toLowerCase();
      if (lower === 'catat transaksi' || lower.startsWith('jual ') || lower.startsWith('beli ')) {
        return registry.karyawan.catat.execute(message);
      }
      return;
    }

    const args = body.slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase();

    // 2. Route based on Role
    const userRole = message.user.role;
    let command = null;

    // Check Common
    if (registry.common[commandName]) {
      command = registry.common[commandName];
    }
    // Check Role specific
    else if (userRole === ROLES.KARYAWAN && registry.karyawan[commandName]) {
      command = registry.karyawan[commandName];
    } else if (userRole === ROLES.ADMIN && registry.admin[commandName]) {
      command = registry.admin[commandName];
    } else if (userRole === ROLES.SUPERADMIN) {
      // Superadmin can access everything
      if (registry.superadmin[commandName]) command = registry.superadmin[commandName];
      else if (registry.admin[commandName]) command = registry.admin[commandName];
      else if (registry.karyawan[commandName]) command = registry.karyawan[commandName];
    }

    if (command) {
      try {
        await command.execute(message, args);
      } catch (e) {
        logger.error(`Command execution failed: ${commandName}`, { error: e.message });
        await message.reply('❌ Gagal memproses perintah.');
      }
    } else {
      // Command not found for this user
      await message.reply('❓ Perintah tidak dikenali atau Anda tidak punya akses.');
    }
  },
};
