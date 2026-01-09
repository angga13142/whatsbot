/**
 * Custom Report Template
 *
 * Templates for custom report formats
 */

const { formatCurrency, formatDate } = require('../../utils/formatter');

module.exports = {
  /**
   * Transaction detail report
   */
  transactionDetail(transactions, options = {}) {
    if (!transactions || transactions.length === 0) {
      return '📭 Tidak ada transaksi';
    }

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║  📋 TRANSACTION DETAIL REPORT                    ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    transactions.forEach((trx, index) => {
      const typeEmoji = trx.type === 'paket' ? '📦' : trx.type === 'utang' ? '💳' : '🍔';
      const statusEmoji = trx.status === 'approved' ? '✅' : trx.status === 'pending' ? '⏳' : '❌';

      text += `${index + 1}. ${typeEmoji} *${trx.transaction_id}*\n`;
      text += `   Date: ${formatDate(trx.transaction_date, 'DD MMM YYYY HH:mm')}\n`;
      text += `   Amount: ${formatCurrency(trx.amount)} ${statusEmoji}\n`;
      text += `   Description: ${trx.description}\n`;

      if (trx.category_name) text += `   Category: ${trx.category_name}\n`;
      if (trx.user_name) text += `   By: ${trx.user_name}\n`;

      text += '\n';
    });

    return text;
  },

  /**
   * Category breakdown report
   */
  categoryBreakdown(groupedData, total) {
    if (!groupedData || groupedData.length === 0) {
      return '📭 Tidak ada data kategori';
    }

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║  📂 CATEGORY BREAKDOWN                           ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    groupedData.forEach((item, index) => {
      const icon = item.category_icon || '📌';
      const name = item.category_name || 'Uncategorized';
      const amount = parseFloat(item.total);
      const count = parseInt(item.count);
      const percentage = total > 0 ? (amount / total) * 100 : 0;

      const barLength = Math.round(percentage / 5);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

      text += `${index + 1}. ${icon} *${name}*\n`;
      text += `   ${formatCurrency(amount)} (${percentage.toFixed(1)}%)\n`;
      text += `   [${bar}]\n`;
      text += `   ${count} transaksi\n\n`;
    });

    return text;
  },

  /**
   * User performance report
   */
  userPerformance(userData, options = {}) {
    if (!userData || userData.length === 0) {
      return '📭 Tidak ada data karyawan';
    }

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║  👥 USER PERFORMANCE REPORT                      ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    const sorted = [...userData].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    sorted.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const amount = parseFloat(user.total);
      const count = parseInt(user.count);
      const avg = count > 0 ? amount / count : 0;

      text += `${medal} ${index + 1}. *${user.user_name}*\n`;
      text += `   Total: ${formatCurrency(amount)}\n`;
      text += `   Transactions: ${count}\n`;
      text += `   Average: ${formatCurrency(avg)}\n\n`;
    });

    return text;
  },

  /**
   * Daily summary report
   */
  dailySummary(date, transactions, summary) {
    let text = '╔══════════════════════════════════════════════════╗\n';
    text += `║  📅 DAILY SUMMARY - ${formatDate(date, 'DD/MM/YYYY').padEnd(29)}║\n`;
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += '*📊 OVERVIEW*\n';
    text += `Total Transaksi: ${summary.total_transactions}\n`;
    text += `Pemasukan: ${formatCurrency(summary.total_income)}\n`;
    text += `Pengeluaran: ${formatCurrency(summary.total_expense)}\n`;
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += `Net: *${formatCurrency(summary.net)}*\n\n`;

    const byType = this._groupByType(transactions);

    text += '*📦 BY TYPE*\n';
    Object.entries(byType).forEach(([type, data]) => {
      const emoji = type === 'paket' ? '📦' : type === 'utang' ? '💳' : '🍔';
      text += `${emoji} ${type}: ${data.count}x | ${formatCurrency(data.total)}\n`;
    });

    return text;
  },

  /**
   * Weekly summary report
   */
  weeklySummary(weekData) {
    const { start, end, transactions, summary } = weekData;

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += `║  📅 WEEKLY SUMMARY                               ║\n`;
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += `*${formatDate(start, 'DD MMM')} - ${formatDate(end, 'DD MMM YYYY')}*\n\n`;

    text += '*📊 WEEK OVERVIEW*\n';
    text += `Total Transaksi: ${summary.total_transactions}\n`;
    text += `Pemasukan: ${formatCurrency(summary.total_income)}\n`;
    text += `Pengeluaran: ${formatCurrency(summary.total_expense)}\n`;
    text += `Net: *${formatCurrency(summary.net)}*\n`;

    return text;
  },

  /**
   * Monthly summary report
   */
  monthlySummary(monthData) {
    const { month, year, summary } = monthData;

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += `║  📅 MONTHLY SUMMARY - ${month} ${year}`.padEnd(51) + '║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += '*📊 MONTH OVERVIEW*\n';
    text += `Total Transaksi: ${summary.total_transactions}\n`;
    text += `Pemasukan: ${formatCurrency(summary.total_income)}\n`;
    text += `Pengeluaran: ${formatCurrency(summary.total_expense)}\n`;
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += `Net: *${formatCurrency(summary.net)}*\n`;

    return text;
  },

  _groupByType(transactions) {
    const grouped = {};

    transactions.forEach((trx) => {
      if (!grouped[trx.type]) {
        grouped[trx.type] = { count: 0, total: 0 };
      }
      grouped[trx.type].count++;
      grouped[trx.type].total += parseFloat(trx.amount);
    });

    return grouped;
  },
};
