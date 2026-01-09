/**
 * Report Message Templates
 *
 * Templates for various report formats
 */

const { createBox, bold, createDivider } = require('../../utils/richText');
const { formatCurrency, formatDate } = require('../../utils/formatter');

module.exports = {
  /**
   * Daily report summary
   * @param {Object} reportData - Report data
   * @returns {string} Formatted report
   */
  dailyReportSummary(reportData) {
    let message = '';

    message += createBox('📊 LAPORAN HARIAN', reportData.date, 55);
    message += '\n\n';
    message += createDivider('━', 55) + '\n\n';

    message += bold('📈 RINGKASAN CASHFLOW') + '\n\n';

    // Income
    message += '💵 ' + bold('PEMASUKAN') + '\n';
    message += `   📦 Paket         : ${formatCurrency(reportData.by_type.paket || 0)}\n`;
    message += `   💳 Utang Dibayar :  ${formatCurrency(reportData.by_type.utang || 0)}\n`;
    message += `   ${createDivider('─', 50)}\n`;
    message += `   ${bold('TOTAL          :  ' + formatCurrency(reportData.summary.income))}\n\n`;

    // Expense
    message += '💸 ' + bold('PENGELUARAN') + '\n';
    message += `   🍔 Operasional   : ${formatCurrency(reportData.by_type.jajan || 0)}\n`;
    message += `   ${createDivider('─', 50)}\n`;
    message += `   ${bold('TOTAL          :  ' + formatCurrency(reportData.summary.expense))}\n\n`;

    message += createDivider('━', 55) + '\n';

    // Net
    const netColor = reportData.summary.net >= 0 ? '💰' : '⚠️';
    message += `${netColor} ${bold('SALDO BERSIH   : ' + formatCurrency(reportData.summary.net))}\n`;
    message += createDivider('━', 55) + '\n\n';

    // Stats
    message += bold('📊 STATISTIK') + '\n';
    message += `• Total Transaksi: ${reportData.summary.total_transactions}\n`;

    // By user (if available)
    if (reportData.by_user && Object.keys(reportData.by_user).length > 0) {
      message += '\n' + bold('👥 PER KARYAWAN') + '\n';
      Object.values(reportData.by_user).forEach((userData) => {
        message += `• ${userData.user_name}: ${userData.count} transaksi\n`;
      });
    }

    message += '\n' + createDivider('━', 55) + '\n';
    message += `📅 Generated: ${formatDate(reportData.generated_at, 'DD MMM YYYY HH:mm')}`;

    return message;
  },

  /**
   * User report summary
   * @param {Object} user - User object
   * @param {Object} reportData - Report data
   * @returns {string} Formatted report
   */
  userReportSummary(user, reportData) {
    let message = '';

    message += createBox('📊 LAPORAN ANDA', user.full_name, 50);
    message += '\n\n';
    message += `📅 Periode: ${reportData.period.start} - ${reportData.period.end}\n\n`;
    message += createDivider('━', 50) + '\n\n';

    message += bold('📈 RINGKASAN') + '\n\n';
    message += `📊 Total Transaksi: ${bold(reportData.summary.total_transactions.toString())}\n`;
    message += `💰 Total Nominal: ${bold(formatCurrency(reportData.summary.total_amount))}\n\n`;

    // By type
    message += bold('📋 PER JENIS') + '\n';
    Object.entries(reportData.by_type).forEach(([type, data]) => {
      const emoji = type === 'paket' ? '📦' : type === 'utang' ? '💳' : '🍔';
      message += `${emoji} ${type}: ${data.count}x - ${formatCurrency(data.total)}\n`;
    });

    message += '\n' + createDivider('━', 50) + '\n\n';

    // Recent transactions
    if (reportData.transactions && reportData.transactions.length > 0) {
      message += bold('📜 TRANSAKSI TERBARU') + '\n\n';
      reportData.transactions.slice(0, 5).forEach((trx, index) => {
        const emoji = trx.type === 'paket' ? '📦' : trx.type === 'utang' ? '💳' : '🍔';
        message += `${index + 1}. ${emoji} ${formatCurrency(trx.amount)}\n`;
        message += `   ${trx.description}\n`;
        message += `   ${formatDate(trx.transaction_date, 'DD/MM/YY HH:mm')}\n\n`;
      });

      if (reportData.transactions.length > 5) {
        message += `... dan ${reportData.transactions.length - 5} lainnya\n\n`;
      }
    }

    message += createDivider('━', 50) + '\n';
    message += '💪 Terus semangat! ';

    return message;
  },

  /**
   * Investor report summary (censored)
   * @param {Object} reportData - Report data
   * @returns {string} Formatted report
   */
  investorReportSummary(reportData) {
    let message = '';

    message += createBox('💼 LAPORAN INVESTOR', 'Ringkasan Keuangan', 50);
    message += '\n\n';
    message += `📅 Periode: ${reportData.period.start} - ${reportData.period.end}\n\n`;
    message += createDivider('━', 50) + '\n\n';

    message += bold('📊 RINGKASAN KEUANGAN') + '\n\n';
    message += `💵 Total Pemasukan  : ${bold(formatCurrency(reportData.summary.total_income))}\n`;
    message += `💸 Total Pengeluaran:  ${bold(formatCurrency(reportData.summary.total_expense))}\n`;
    message += createDivider('─', 50) + '\n';
    message += `💰 ${bold('Profit Bersih    : ' + formatCurrency(reportData.summary.net_profit))}\n\n`;

    message += createDivider('━', 50) + '\n\n';

    message += bold('📈 STATISTIK') + '\n';
    message += `• Total Transaksi: ${reportData.summary.total_transactions}\n\n`;

    message += createDivider('━', 50) + '\n';
    message += 'ℹ️ Laporan ini hanya menampilkan ringkasan\n';
    message += 'ℹ️ Detail transaksi tidak ditampilkan (privacy)';

    return message;
  },
};
