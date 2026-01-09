/**
 * Transaction Message Templates
 *
 * Templates for transaction-related messages
 */

const { createBox, bold, createDivider, addEmoji } = require('../../utils/richText');
const { formatCurrency, formatDate } = require('../../utils/formatter');
const { EMOJIS } = require('../../utils/constants');

module.exports = {
  /**
   * Transaction created message
   * @param {Object} transaction - Transaction object
   * @returns {string} Formatted message
   */
  transactionCreated(transaction) {
    const emoji =
      transaction.type === 'paket'
        ? EMOJIS.PACKAGE
        : transaction.type === 'utang'
          ? EMOJIS.DEBT
          : EMOJIS.EXPENSE;

    let message = '';

    message += addEmoji(bold('TRANSAKSI BERHASIL DICATAT! '), '✅') + '\n\n';
    message += createDivider('━', 50) + '\n\n';

    message += `${emoji} ${bold('ID Transaksi: ')}\n`;
    message += `   ${transaction.transaction_id}\n\n`;

    message += `💰 ${bold('Nominal:')}\n`;
    message += `   ${formatCurrency(transaction.amount)}\n\n`;

    message += `📝 ${bold('Deskripsi:')}\n`;
    message += `   ${transaction.description}\n\n`;

    if (transaction.customer_name) {
      message += `👤 ${bold('Pelanggan:')}\n`;
      message += `   ${transaction.customer_name}\n\n`;
    }

    message += `📅 ${bold('Waktu:')}\n`;
    message += `   ${formatDate(transaction.transaction_date, 'DD MMMM YYYY HH:mm')}\n\n`;

    message += createDivider('━', 50) + '\n\n';

    // Status
    if (transaction.status === 'approved') {
      message += addEmoji(bold('Status:  DISETUJUI'), '✅') + '\n';
      message += 'Transaksi langsung masuk ke laporan';
    } else if (transaction.status === 'pending') {
      message += addEmoji(bold('Status: MENUNGGU APPROVAL'), '⏳') + '\n';
      message += 'Admin akan mereview transaksi ini';
    }

    return message;
  },

  /**
   * Transaction approved message
   * @param {Object} transaction - Transaction object
   * @returns {string} Formatted message
   */
  transactionApproved(transaction) {
    let message = '';

    message += addEmoji(bold('TRANSAKSI DISETUJUI!'), '✅') + '\n\n';
    message += createDivider('━', 50) + '\n\n';

    message += `🆔 ${bold('ID:')} ${transaction.transaction_id}\n`;
    message += `💰 ${bold('Jumlah:')} ${formatCurrency(transaction.amount)}\n`;
    message += `📝 ${bold('Deskripsi:')} ${transaction.description}\n\n`;

    message += `✅ Disetujui oleh: ${transaction.approved_by_name || 'Admin'}\n`;
    message += `⏰ Waktu approval: ${formatDate(transaction.approved_at, 'DD MMM YYYY HH:mm')}\n\n`;

    message += createDivider('━', 50) + '\n';
    message += '💡 Transaksi sudah masuk ke laporan';

    return message;
  },

  /**
   * Transaction rejected message
   * @param {Object} transaction - Transaction object
   * @param {string} reason - Rejection reason
   * @returns {string} Formatted message
   */
  transactionRejected(transaction, reason) {
    let message = '';

    message += addEmoji(bold('TRANSAKSI DITOLAK'), '❌') + '\n\n';
    message += createDivider('━', 50) + '\n\n';

    message += `🆔 ${bold('ID:')} ${transaction.transaction_id}\n`;
    message += `💰 ${bold('Jumlah:')} ${formatCurrency(transaction.amount)}\n`;
    message += `📝 ${bold('Deskripsi:')} ${transaction.description}\n\n`;

    message += `❌ Ditolak oleh: ${transaction.rejected_by_name || 'Admin'}\n\n`;

    if (reason) {
      message += `📋 ${bold('Alasan: ')}\n`;
      message += `   ${reason}\n\n`;
    }

    message += createDivider('━', 50) + '\n';
    message += '💡 Silakan hubungi admin jika ada pertanyaan';

    return message;
  },

  /**
   * Transaction pending message
   * @param {Object} transaction - Transaction object
   * @returns {string} Formatted message
   */
  transactionPending(transaction) {
    const emoji =
      transaction.type === 'paket'
        ? EMOJIS.PACKAGE
        : transaction.type === 'utang'
          ? EMOJIS.DEBT
          : EMOJIS.EXPENSE;

    let message = '';

    message += `${emoji} ${bold(transaction.transaction_id)}\n`;
    message += `💰 ${formatCurrency(transaction.amount)}\n`;
    message += `📝 ${transaction.description}\n`;
    message += `👤 ${transaction.user_name}\n`;
    message += `📅 ${formatDate(transaction.transaction_date, 'DD/MM/YY HH:mm')}\n`;
    message += `⏳ Status:  PENDING`;

    return message;
  },

  /**
   * Transaction summary
   * @param {Array} transactions - Array of transactions
   * @returns {string} Formatted message
   */
  transactionSummary(transactions) {
    if (transactions.length === 0) {
      return '📭 Tidak ada transaksi';
    }

    let message = '';
    message += bold(`📊 Total:  ${transactions.length} transaksi`) + '\n\n';

    transactions.slice(0, 5).forEach((trx, index) => {
      const emoji = trx.type === 'paket' ? '📦' : trx.type === 'utang' ? '💳' : '🍔';
      message += `${index + 1}. ${emoji} ${formatCurrency(trx.amount)}\n`;
      message += `   ${trx.description}\n`;
      message += `   ${formatDate(trx.transaction_date, 'DD/MM HH:mm')}\n\n`;
    });

    if (transactions.length > 5) {
      message += `... dan ${transactions.length - 5} transaksi lainnya`;
    }

    return message;
  },

  /**
   * Pending transactions list
   * @param {Array} transactions - Pending transactions
   * @returns {string} Formatted message
   */
  pendingTransactionsList(transactions) {
    if (transactions.length === 0) {
      return addEmoji('Tidak ada transaksi pending', '✅');
    }

    let message = '';

    message += createBox('⏳ TRANSAKSI PENDING', `${transactions.length} menunggu approval`, 50);
    message += '\n\n';

    transactions.forEach((trx, index) => {
      message += `${index + 1}. ${this.transactionPending(trx)}\n\n`;
      message += createDivider('─', 50) + '\n\n';
    });

    message += '💡 Gunakan `/approve [TRX-ID]` untuk menyetujui\n';
    message += '💡 Gunakan `/reject [TRX-ID] [alasan]` untuk menolak';

    return message;
  },
};
