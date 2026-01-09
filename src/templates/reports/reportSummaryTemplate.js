/**
 * Report Summary Template
 *
 * Generate formatted report summaries
 */

const { formatCurrency, formatDate, formatPercentage } = require('../../utils/formatter');

module.exports = {
  /**
   * Generate executive summary
   */
  executiveSummary(reportData, options = {}) {
    const { summary, metadata } = reportData;
    const title = options.title || 'EXECUTIVE SUMMARY';

    let text = '╔══════════════════════════════════════════════════╗\n';
    text += `║  📊 ${title.padEnd(44)}║\n`;
    text += '╚══════════════════════════════════════════════════╝\n\n';

    if (metadata?.filters?.startDate && metadata?.filters?.endDate) {
      text += '*📅 PERIODE*\n';
      text += `${formatDate(metadata.filters.startDate, 'DD MMMM YYYY')} - `;
      text += `${formatDate(metadata.filters.endDate, 'DD MMMM YYYY')}\n\n`;
    }

    text += '*🎯 METRICS UTAMA*\n';
    text += `Total Transaksi: ${summary.total_transactions}\n`;
    text += `Pemasukan:   ${formatCurrency(summary.total_income)}\n`;
    text += `Pengeluaran: ${formatCurrency(summary.total_expense)}\n`;
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += `Net Cashflow: *${formatCurrency(summary.net)}*\n\n`;

    const healthScore = this._calculateHealthScore(summary);
    text += '*💚 FINANCIAL HEALTH*\n';
    text += `Score: ${healthScore.emoji} ${healthScore.score}/100\n`;
    text += `Status: ${healthScore.status}\n\n`;

    if (summary.avg_amount) {
      text += '*📈 STATISTIK*\n';
      text += `Rata-rata: ${formatCurrency(summary.avg_amount)}\n`;
      text += `Terbesar:  ${formatCurrency(summary.max_amount)}\n`;
      text += `Terkecil:  ${formatCurrency(summary.min_amount)}\n`;
    }

    return text;
  },

  /**
   * Generate detailed summary
   */
  detailedSummary(reportData, groupedData = null) {
    let text = this.executiveSummary(reportData);

    if (groupedData && groupedData.length > 0) {
      text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      text += '*📊 BREAKDOWN BY CATEGORY*\n\n';

      groupedData.slice(0, 5).forEach((item, index) => {
        const name = item.category_name || item.type || 'Unknown';
        const icon = item.category_icon || '📌';
        const percentage = (parseFloat(item.total) / reportData.summary.total_income) * 100 || 0;

        text += `${index + 1}. ${icon} ${name}\n`;
        text += `   ${formatCurrency(item.total)} (${formatPercentage(percentage)})\n`;
        text += `   ${item.count} transaksi\n\n`;
      });
    }

    return text;
  },

  /**
   * Generate comparison summary
   */
  comparisonSummary(currentData, previousData, labels) {
    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║  📊 COMPARISON SUMMARY                           ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    text += '*📅 PERIODE*\n';
    text += `Current:  ${labels.current}\n`;
    text += `Previous: ${labels.previous}\n\n`;

    const incomeDiff = currentData.total_income - previousData.total_income;
    const incomeChange =
      previousData.total_income !== 0 ? (incomeDiff / previousData.total_income) * 100 : 0;

    text += '*💰 PEMASUKAN*\n';
    text += `Current:  ${formatCurrency(currentData.total_income)}\n`;
    text += `Previous: ${formatCurrency(previousData.total_income)}\n`;
    text += `Change: ${this._formatChange(incomeDiff, incomeChange)}\n\n`;

    const expenseDiff = currentData.total_expense - previousData.total_expense;
    const expenseChange =
      previousData.total_expense !== 0 ? (expenseDiff / previousData.total_expense) * 100 : 0;

    text += '*💸 PENGELUARAN*\n';
    text += `Current:  ${formatCurrency(currentData.total_expense)}\n`;
    text += `Previous: ${formatCurrency(previousData.total_expense)}\n`;
    text += `Change: ${this._formatChange(expenseDiff, expenseChange)}\n\n`;

    const netDiff = currentData.net - previousData.net;

    text += '*📈 NET CASHFLOW*\n';
    text += `Current:  ${formatCurrency(currentData.net)}\n`;
    text += `Previous: ${formatCurrency(previousData.net)}\n`;
    text += `Change: ${netDiff >= 0 ? '📈' : '📉'} ${formatCurrency(Math.abs(netDiff))}\n\n`;

    text += '*💡 INSIGHTS*\n';
    text += this._generateInsights(currentData, previousData);

    return text;
  },

  /**
   * Generate trend summary
   */
  trendSummary(trendData, options = {}) {
    let text = '╔══════════════════════════════════════════════════╗\n';
    text += '║  📈 TREND ANALYSIS                               ║\n';
    text += '╚══════════════════════════════════════════════════╝\n\n';

    if (!trendData || trendData.length === 0) {
      return text + '📭 Tidak ada data trend';
    }

    const interval = options.interval || 'period';
    text += `*TREND BY ${interval.toUpperCase()}*\n\n`;

    const periods = options.periods || 7;
    const recentData = trendData.slice(-periods);

    recentData.forEach((item) => {
      const income = parseFloat(item.income || 0);
      const expense = parseFloat(item.expense || 0);
      const net = income - expense;
      const indicator = net >= 0 ? '📈' : '📉';

      text += `${item.period} ${indicator}\n`;
      text += `  Net: ${formatCurrency(net)}\n`;
      text += `  In: ${formatCurrency(income)} | Out: ${formatCurrency(expense)}\n\n`;
    });

    if (trendData.length >= 2) {
      const trendDirection = this._calculateTrendDirection(trendData);
      text += '*📊 TREND DIRECTION*\n';
      text += `${trendDirection.emoji} ${trendDirection.description}\n`;
    }

    return text;
  },

  _calculateHealthScore(summary) {
    let score = 50;

    if (summary.net > 0) score += 20;
    else score -= 20;

    if (summary.total_expense > 0) {
      const ratio = summary.total_income / summary.total_expense;
      if (ratio > 1.5) score += 20;
      else if (ratio > 1.2) score += 10;
      else if (ratio < 1) score -= 20;
    }

    if (summary.total_transactions > 50) score += 10;
    else if (summary.total_transactions < 10) score -= 10;

    score = Math.max(0, Math.min(100, score));

    let status, emoji;
    if (score >= 80) {
      status = 'Excellent';
      emoji = '💚';
    } else if (score >= 60) {
      status = 'Good';
      emoji = '💛';
    } else if (score >= 40) {
      status = 'Fair';
      emoji = '🧡';
    } else {
      status = 'Needs Attention';
      emoji = '❤️';
    }

    return { score, status, emoji };
  },

  _formatChange(diff, percentage) {
    const arrow = diff >= 0 ? '↑' : '↓';
    const sign = diff >= 0 ? '+' : '';
    return `${arrow} ${sign}${formatCurrency(Math.abs(diff))} (${sign}${formatPercentage(Math.abs(percentage))})`;
  },

  _generateInsights(current, previous) {
    const insights = [];

    if (current.total_income > previous.total_income) {
      insights.push('✅ Pemasukan meningkat');
    } else if (current.total_income < previous.total_income) {
      insights.push('⚠️ Pemasukan menurun');
    }

    if (current.total_expense < previous.total_expense) {
      insights.push('✅ Pengeluaran terkontrol');
    } else if (current.total_expense > previous.total_expense * 1.2) {
      insights.push('⚠️ Pengeluaran meningkat');
    }

    if (current.net > previous.net) {
      insights.push('📈 Cashflow membaik');
    } else {
      insights.push('📉 Cashflow menurun');
    }

    return insights.join('\n');
  },

  _calculateTrendDirection(trendData) {
    const recent = trendData.slice(-5);
    let upCount = 0;
    let downCount = 0;

    for (let i = 1; i < recent.length; i++) {
      const prevNet =
        parseFloat(recent[i - 1].income || 0) - parseFloat(recent[i - 1].expense || 0);
      const currNet = parseFloat(recent[i].income || 0) - parseFloat(recent[i].expense || 0);

      if (currNet > prevNet) upCount++;
      else if (currNet < prevNet) downCount++;
    }

    if (upCount > downCount) {
      return { emoji: '📈', description: 'Upward Trend - Improving' };
    } else if (downCount > upCount) {
      return { emoji: '📉', description: 'Downward Trend - Need attention' };
    }
    return { emoji: '➡️', description: 'Stable - Maintaining level' };
  },
};
