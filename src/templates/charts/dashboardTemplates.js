/**
 * Dashboard Templates
 *
 * Pre-defined dashboard layouts
 */

const { formatCurrency, formatPercentage } = require('../../utils/formatter');

module.exports = {
  /**
   * Generate metric card text
   */
  metricCard(label, value, change, emoji = '📊') {
    const trend = change >= 0 ? '↑' : '↓';
    const changeFormatted = formatPercentage(Math.abs(change));

    return (
      `┌────────────────────────┐\n` +
      `│ ${emoji} ${label.padEnd(18)}│\n` +
      `│ ${value.padEnd(22)}│\n` +
      `│ ${trend} ${changeFormatted} vs periode lalu │\n` +
      `└────────────────────────┘`
    );
  },

  /**
   * Generate full dashboard text
   */
  fullDashboard(data) {
    const { metrics, period, charts } = data;

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += `║ 📊 DASHBOARD - ${period.label.padEnd(34)}║\n`;
    text += '╚══════════════════════════════════════════════════╝\n\n';

    // Metrics section
    text += '*💰 RINGKASAN KEUANGAN*\n\n';

    text += `💵 *Pemasukan*\n`;
    text += `   ${metrics.income.formatted}\n`;
    text += `   ${metrics.income.trend === 'up' ? '↑' : '↓'} ${formatPercentage(Math.abs(metrics.income.change.percentage))}\n\n`;

    text += `💸 *Pengeluaran*\n`;
    text += `   ${metrics.expense.formatted}\n`;
    text += `   ${metrics.expense.trend === 'up' ? '↑' : '↓'} ${formatPercentage(Math.abs(metrics.expense.change.percentage))}\n\n`;

    text += `📈 *Net Cashflow*\n`;
    text += `   ${metrics.net.formatted}\n`;
    text += `   ${metrics.net.trend === 'up' ? '📈' : '📉'} ${formatPercentage(Math.abs(metrics.net.change.percentage))}\n\n`;

    text += `📝 *Transaksi*\n`;
    text += `   ${metrics.transactions.value} transaksi\n\n`;

    // Categories section
    if (charts.categories && charts.categories.length > 0) {
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      text += '*📂 TOP KATEGORI*\n\n';

      charts.categories.slice(0, 5).forEach((cat, i) => {
        const name = cat.category_name || 'Lainnya';
        const total = formatCurrency(cat.total);
        text += `${i + 1}. ${name}\n   ${total}\n\n`;
      });
    }

    // Trend section
    if (charts.trend && charts.trend.length > 0) {
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      text += '*📈 TREND (7 HARI)*\n\n';

      charts.trend.slice(-7).forEach((d) => {
        const net = parseFloat(d.income || 0) - parseFloat(d.expense || 0);
        const emoji = net >= 0 ? '▲' : '▼';
        text += `${d.period}: ${emoji} ${formatCurrency(net)}\n`;
      });
    }

    return text;
  },

  /**
   * Generate quick summary
   */
  quickSummary(data) {
    const { metrics, period } = data;

    return (
      `📊 *QUICK SUMMARY* - ${period.label}\n\n` +
      `💵 Pemasukan: ${metrics.income.formatted}\n` +
      `💸 Pengeluaran: ${metrics.expense.formatted}\n` +
      `📈 Net: ${metrics.net.formatted}\n` +
      `📝 Transaksi: ${metrics.transactions.value}`
    );
  },

  /**
   * Generate comparison view
   */
  comparisonView(comparison) {
    const { period1, period2, comparison: comp } = comparison;

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║ 📊 PERIOD COMPARISON                             ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += `*${period1.label}* vs *${period2.label}*\n\n`;

    // Income
    text += `*💵 PEMASUKAN*\n`;
    text += `${period1.label}: ${formatCurrency(comp.income.value1)}\n`;
    text += `${period2.label}: ${formatCurrency(comp.income.value2)}\n`;
    text += `Change: ${comp.income.trend === 'up' ? '↑' : '↓'} ${comp.income.formatted.percentage}\n\n`;

    // Expense
    text += `*💸 PENGELUARAN*\n`;
    text += `${period1.label}: ${formatCurrency(comp.expense.value1)}\n`;
    text += `${period2.label}: ${formatCurrency(comp.expense.value2)}\n`;
    text += `Change: ${comp.expense.trend === 'up' ? '↑' : '↓'} ${comp.expense.formatted.percentage}\n\n`;

    // Net
    text += `*📈 NET*\n`;
    text += `${period1.label}: ${formatCurrency(comp.net.value1)}\n`;
    text += `${period2.label}: ${formatCurrency(comp.net.value2)}\n`;
    text += `Change: ${comp.net.trend === 'up' ? '📈' : '📉'} ${comp.net.formatted.percentage}\n`;

    return text;
  },

  /**
   * Generate health score display
   */
  healthScore(health) {
    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║ 💚 FINANCIAL HEALTH                              ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += `${health.emoji} *Score: ${health.score}/100*\n`;
    text += `Status: ${health.status}\n\n`;

    text += '*Faktor:*\n';
    health.factors.forEach((f) => {
      const icon = f.status === 'good' ? '✅' : '❌';
      text += `${icon} ${f.name} (${f.impact})\n`;
    });

    return text;
  },
};
