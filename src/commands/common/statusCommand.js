/**
 * Status Command
 *
 * Shows user account status and information
 */

const transactionRepository = require('../../database/repositories/transactionRepository');
const { createBox, bold } = require('../../utils/richText');
const { formatPhoneNumber, formatDate } = require('../../utils/formatter');
const { EMOJIS } = require('../../utils/constants');
const logger = require('../../utils/logger');
const dayjs = require('dayjs');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Get user statistics
      const today = dayjs().startOf('day').toDate();
      const todayEnd = dayjs().endOf('day').toDate();

      const todayTransactions = await transactionRepository.findByUser(user.id, {
        startDate: today,
        endDate: todayEnd,
      });

      const totalTransactions = await transactionRepository.findByUser(user.id);

      // Build status message
      let statusText = '';

      statusText += createBox('👤 STATUS AKUN', user.full_name, 50);
      statusText += '\n\n';

      statusText += bold('📋 Informasi Akun:') + '\n';
      statusText += `• Nama:  ${user.full_name}\n`;
      statusText += `• Telepon: ${formatPhoneNumber(user.phone_number)}\n`;
      statusText += `• Role: ${EMOJIS[user.role.toUpperCase()] || '👤'} ${user.role}\n`;
      statusText += `• Status: ${user.status === 'active' ? '✅ Aktif' : '⚠️ ' + user.status}\n`;
      statusText += `• Terdaftar: ${formatDate(user.created_at, 'DD MMM YYYY')}\n`;
      statusText += '\n';

      // Show transaction stats if karyawan/admin/superadmin
      if (['karyawan', 'admin', 'superadmin'].includes(user.role)) {
        statusText += bold('📊 Statistik Transaksi:') + '\n';
        statusText += `• Hari ini: ${todayTransactions.length} transaksi\n`;
        statusText += `• Total: ${totalTransactions.length} transaksi\n`;
      }

      await message.reply(statusText);

      logger.info('Status command executed', { userId: user.id });
    } catch (error) {
      logger.error('Error in status command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
  },
};
