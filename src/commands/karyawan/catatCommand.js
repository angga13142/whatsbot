/**
 * Catat Command
 *
 * Start transaction input flow (multi-step interactive form)
 * Uses session management for state tracking
 */

const sessionManager = require('../../utils/sessionManager');
const { SESSION_STATES } = require('../../utils/constants');
const { createBox, bold, createDivider } = require('../../utils/richText');
const logger = require('../../utils/logger');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Start transaction input flow
      await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_TRANSACTION_TYPE);
      await sessionManager.setData(user.phone_number, 'transaction', {});

      const welcomeText =
        createBox('📝 CATAT TRANSAKSI BARU', 'Ikuti langkah-langkah berikut', 50) +
        '\n\n' +
        bold('Pilih jenis transaksi:') +
        '\n\n' +
        '1️⃣  📦 *PAKET* (Penjualan)\n' +
        '   Untuk mencatat penjualan paket\n\n' +
        '2️⃣  💳 *UTANG* (Piutang)\n' +
        '   Untuk mencatat utang pelanggan\n\n' +
        '3️⃣  🍔 *JAJAN* (Pengeluaran)\n' +
        '   Untuk mencatat pengeluaran operasional\n\n' +
        createDivider('━', 50) +
        '\n' +
        '💡 Ketik angka (1/2/3) atau nama jenis transaksi\n' +
        '❌ Ketik "batal" untuk membatalkan';

      await message.reply(welcomeText);

      logger.info('Transaction input flow started', { userId: user.id });
    } catch (error) {
      logger.error('Error in catat command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
  },
};
