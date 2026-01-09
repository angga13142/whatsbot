/**
 * Report Formatter Utility
 *
 * Format report data for display
 */

const { formatCurrency, formatDate, formatPercentage } = require('./formatter');

module.exports = {
  /**
   * Format report summary for WhatsApp
   */
  formatReportSummary(summary, options = {}) {
    const title = options.title || 'REPORT SUMMARY';

    let text = `╔══════════════════════════════════════════════════╗\n`;
    text += `║  📊 ${title.padEnd(44)}║\n`;
    text += `╚══════════════════════════════════════════════════╝\n\n`;

    text += '*📊 RINGKASAN*\n';
    text += `Total Transaksi: ${summary.total_transactions}\n\n`;

    text += '*💰 KEUANGAN*\n';
    text += `Pemasukan:   ${formatCurrency(summary.total_income)}\n`;
    text += `Pengeluaran: ${formatCurrency(summary.total_expense)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Net Cashflow: ${formatCurrency(summary.net)}\n\n`;

    if (summary.avg_amount) {
      text += '*📈 STATISTIK*\n';
      text += `Rata-rata: ${formatCurrency(summary.avg_amount)}\n`;
      text += `Minimum:   ${formatCurrency(summary.min_amount)}\n`;
      text += `Maximum:   ${formatCurrency(summary.max_amount)}\n`;
    }

    return text;
  },

  /**
   * Format grouped data for display
   */
  formatGroupedData(groupedData, groupBy) {
    if (!groupedData || groupedData.length === 0) {
      return '📭 Tidak ada data terkelompok';
    }

    let text = `*📊 GROUPED BY ${groupBy.toUpperCase()}*\n\n`;

    groupedData.slice(0, 10).forEach((item, index) => {
      const label =
        item.category_name ||
        item.type ||
        item.user_name ||
        item.tag_name ||
        item.date ||
        'Unknown';
      const count = parseInt(item.count);
      const total = parseFloat(item.total);
      const icon = this._getGroupIcon(groupBy);

      text += `${index + 1}. ${icon} ${label}\n`;
      text += `   ${count} transaksi | ${formatCurrency(total)}\n\n`;
    });

    if (groupedData.length > 10) {
      text += `... dan ${groupedData.length - 10} lainnya\n`;
    }

    return text;
  },

  /**
   * Format trend data for display
   */
  formatTrendData(trendData, interval = 'day') {
    if (!trendData || trendData.length === 0) {
      return '📭 Tidak ada data trend';
    }

    let text = `*📈 TREND (${interval.toUpperCase()})*\n\n`;

    trendData.slice(0, 7).forEach((item) => {
      const income = parseFloat(item.income || 0);
      const expense = parseFloat(item.expense || 0);
      const net = income - expense;
      const trend = net >= 0 ? '📈' : '📉';

      text += `${item.period}\n`;
      text += `  ${trend} ${formatCurrency(net)}\n`;
      text += `  ↑ ${formatCurrency(income)} | ↓ ${formatCurrency(expense)}\n\n`;
    });

    return text;
  },

  /**
   * Format transaction list
   */
  formatTransactionList(transactions, options = {}) {
    if (!transactions || transactions.length === 0) {
      return '📭 Tidak ada transaksi';
    }

    const limit = options.limit || 10;
    let text = '';

    transactions.slice(0, limit).forEach((trx, index) => {
      const icon = trx.type === 'paket' ? '📦' : trx.type === 'utang' ? '💳' : '🍔';
      const status = trx.status === 'approved' ? '✅' : trx.status === 'pending' ? '⏳' : '❌';

      text += `${index + 1}. ${icon} ${trx.transaction_id}\n`;
      text += `   ${formatCurrency(trx.amount)} ${status}\n`;
      text += `   ${trx.description}\n`;
      text += `   ${formatDate(trx.transaction_date, 'DD MMM YYYY HH:mm')}\n\n`;
    });

    if (transactions.length > limit) {
      text += `... dan ${transactions.length - limit} transaksi lainnya\n`;
    }

    return text;
  },

  /**
   * Format comparison report
   */
  formatComparisonReport(current, previous, labels) {
    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║  📊 COMPARISON REPORT                            ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += `*Comparing: ${labels.label1} vs ${labels.label2}*\n\n`;

    // Income
    const incomeDiff = current.total_income - previous.total_income;
    const incomeChange =
      previous.total_income !== 0 ? (incomeDiff / previous.total_income) * 100 : 0;

    text += '*💰 PEMASUKAN*\n';
    text += `${labels.label1}: ${formatCurrency(current.total_income)}\n`;
    text += `${labels.label2}: ${formatCurrency(previous.total_income)}\n`;
    text += `Change: ${incomeDiff >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(incomeDiff))} `;
    text += `(${formatPercentage(Math.abs(incomeChange))})\n\n`;

    // Expense
    const expenseDiff = current.total_expense - previous.total_expense;
    const expenseChange =
      previous.total_expense !== 0 ? (expenseDiff / previous.total_expense) * 100 : 0;

    text += '*💸 PENGELUARAN*\n';
    text += `${labels.label1}: ${formatCurrency(current.total_expense)}\n`;
    text += `${labels.label2}: ${formatCurrency(previous.total_expense)}\n`;
    text += `Change: ${expenseDiff >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(expenseDiff))} `;
    text += `(${formatPercentage(Math.abs(expenseChange))})\n\n`;

    // Net
    const netDiff = current.net - previous.net;
    text += '*📈 NET CASHFLOW*\n';
    text += `${labels.label1}: ${formatCurrency(current.net)}\n`;
    text += `${labels.label2}: ${formatCurrency(previous.net)}\n`;
    text += `Change: ${netDiff >= 0 ? '📈' : '📉'} ${formatCurrency(Math.abs(netDiff))}\n`;

    return text;
  },

  _getGroupIcon(groupBy) {
    const icons = { category: '📂', type: '🏷️', user: '👤', tag: '🏷️', date: '📅' };
    return icons[groupBy] || '📊';
  },
};
