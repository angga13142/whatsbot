/**
 * History Command
 *
 * Show transaction history for user
 */

const transactionRepository = require('../../database/repositories/transactionRepository');
const { createBox, createDivider, bold } = require('../../utils/richText');
const { formatCurrency, formatDate } = require('../../utils/formatter');
const logger = require('../../utils/logger');
const dayjs = require('dayjs');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Get number of days from args (default:  7)
      const days = parseInt(args[0]) || 7;

      if (days > 30) {
        await message.reply('Maksimal 30 hari.  Menggunakan 30 hari.');
      }

      const actualDays = Math.min(days, 30);

      // Get transactions
      const startDate = dayjs().subtract(actualDays, 'day').startOf('day').toDate();
      const endDate = dayjs().endOf('day').toDate();

      const transactions = await transactionRepository.findByUser(user.id, {
        startDate,
        endDate,
      });

      if (transactions.length === 0) {
        await message.reply(`Tidak ada transaksi dalam ${actualDays} hari terakhir. `);
        return;
      }

      // Build history message
      let historyText = '';
      historyText += createBox('📜 RIWAYAT TRANSAKSI', `${actualDays} hari terakhir`, 50);
      historyText += '\n\n';

      // Show latest 10 transactions
      const recentTransactions = transactions.slice(0, 10);

      for (const trx of recentTransactions) {
        const emoji = trx.type === 'paket' ? '📦' : trx.type === 'utang' ? '💳' : '🍔';
        const statusEmoji =
          trx.status === 'approved' ? '✅' : trx.status === 'pending' ? '⏳' : '❌';

        historyText += `${emoji} ${bold(trx.transaction_id)}\n`;
        historyText += `   ${formatDate(trx.transaction_date, 'DD/MM/YY HH:mm')} • ${formatCurrency(trx.amount)}\n`;
        historyText += `   ${trx.description}\n`;
        historyText += `   Status: ${statusEmoji} ${trx.status}\n\n`;
      }

      if (transactions.length > 10) {
        historyText += `... dan ${transactions.length - 10} transaksi lainnya\n\n`;
      }

      historyText += createDivider('━', 50) + '\n';
      historyText += `📊 Total:  ${transactions.length} transaksi`;

      await message.reply(historyText);

      logger.info('History command executed', {
        userId: user.id,
        days: actualDays,
        transactionCount: transactions.length,
      });
    } catch (error) {
      logger.error('Error in history command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
  },
};
