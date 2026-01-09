/**
 * Approve Command
 *
 * Approve pending transaction
 * Usage: /approve [TRX-ID]
 */

const transactionService = require('../../services/transactionService');
const notificationService = require('../../services/notificationService');
const { formatCurrency } = require('../../utils/formatter');
const { bold } = require('../../utils/richText');
const logger = require('../../utils/logger');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Validate arguments
      if (args.length === 0) {
        await message.reply(
          '❌ *Format salah!*\n\n' +
            'Penggunaan:\n' +
            '`/approve [TRX-ID]`\n\n' +
            'Contoh:\n' +
            '`/approve TRX-20260110-001`'
        );
        return;
      }

      const transactionId = args[0].toUpperCase();

      // Get transaction
      const transaction = await transactionService.getTransaction(transactionId);
      if (!transaction) {
        await message.reply(`❌ Transaksi ${transactionId} tidak ditemukan.`);
        return;
      }

      // Check if already processed
      if (transaction.status !== 'pending') {
        await message.reply(`⚠️ Transaksi sudah ${transaction.status}. `);
        return;
      }

      // Show transaction details and ask for confirmation
      const confirmText =
        bold('🔍 Detail Transaksi:') +
        '\n\n' +
        `ID: ${transaction.transaction_id}\n` +
        `Jenis: ${transaction.type}\n` +
        `Jumlah: ${formatCurrency(transaction.amount)}\n` +
        `Deskripsi: ${transaction.description}\n` +
        `Dibuat oleh: ${transaction.user_name}\n\n` +
        '❓ Approve transaksi ini?\n' +
        'Balas "ya" untuk approve';

      await message.reply(confirmText);

      // TODO: Implement confirmation flow
      // For now, approve directly

      // Approve transaction
      await transactionService.approveTransaction(transactionId, user.id);

      // Send success message
      await message.reply('✅ *Transaksi disetujui!*\n\n' + `${transactionId} telah disetujui. `);

      // Notify transaction creator
      await notificationService.notifyTransactionApproved(transaction);

      logger.info('Transaction approved', {
        transactionId,
        approvedBy: user.id,
      });
    } catch (error) {
      logger.error('Error in approve command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply(`❌ Gagal approve transaksi:\n${error.message}`);
    }
  },
};
