/**
 * Dashboard Service
 *
 * Generate dashboard data and layouts
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
const dateRangeHelper = require('../utils/dateRangeHelper');
const chartGeneratorService = require('./chartGeneratorService');
const { formatCurrency, formatPercentage } = require('../utils/formatter');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Get dashboard summary data
   */
  async getDashboardData(preset = 'this_month') {
    try {
      const presets = dateRangeHelper.getPresetRanges();
      const range = presets[preset];

      if (!range) {
        throw new Error(`Invalid preset: ${preset}`);
      }

      const filters = {
        startDate: range.startDate,
        endDate: range.endDate,
      };

      // Get current period data
      const summary = await reportDataRepository.getReportSummary(filters);

      // Get comparison data (previous period)
      const comparison = dateRangeHelper.getComparisonRange(preset);
      const previousFilters = {
        startDate: comparison.previous.startDate,
        endDate: comparison.previous.endDate,
      };
      const previousSummary = await reportDataRepository.getReportSummary(previousFilters);

      // Calculate changes
      const incomeChange = this._calculateChange(
        summary.total_income,
        previousSummary.total_income
      );
      const expenseChange = this._calculateChange(
        summary.total_expense,
        previousSummary.total_expense
      );
      const netChange = this._calculateChange(summary.net, previousSummary.net);
      const transactionChange = this._calculateChange(
        summary.total_transactions,
        previousSummary.total_transactions
      );

      // Get trend data (last 7 periods)
      const trendData = await reportDataRepository.getTrendData(filters, 'day');

      // Get category breakdown
      const categoryData = await reportDataRepository.getGroupedData(filters, 'category');

      // Get type breakdown
      const typeData = await reportDataRepository.getGroupedData(filters, 'type');

      return {
        period: {
          label: range.label,
          startDate: range.startDate,
          endDate: range.endDate,
        },
        metrics: {
          income: {
            value: summary.total_income,
            formatted: formatCurrency(summary.total_income),
            change: incomeChange,
            trend: incomeChange.value >= 0 ? 'up' : 'down',
          },
          expense: {
            value: summary.total_expense,
            formatted: formatCurrency(summary.total_expense),
            change: expenseChange,
            trend: expenseChange.value >= 0 ? 'up' : 'down',
          },
          net: {
            value: summary.net,
            formatted: formatCurrency(summary.net),
            change: netChange,
            trend: netChange.value >= 0 ? 'up' : 'down',
          },
          transactions: {
            value: summary.total_transactions,
            formatted: summary.total_transactions.toString(),
            change: transactionChange,
            trend: transactionChange.value >= 0 ? 'up' : 'down',
          },
        },
        charts: {
          trend: trendData.slice(-7),
          categories: categoryData.slice(0, 5),
          types: typeData,
        },
        comparison: {
          period: comparison.previous.label,
          income: previousSummary.total_income,
          expense: previousSummary.total_expense,
          net: previousSummary.net,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard data', { error: error.message });
      throw error;
    }
  },

  /**
   * Format dashboard data as text
   */
  formatDashboardText(data) {
    let text = '╔══════════════════════════════════════════════════╗\n';
    text += `║  📊 DASHBOARD - ${data.period.label.padEnd(33)}║\n`;
    text += '╚══════════════════════════════════════════════════╝\n\n';

    // Metrics
    text += '*💰 METRICS*\n\n';

    const { income, expense, net, transactions } = data.metrics;

    text += `💵 Pemasukan: ${income.formatted}\n`;
    text += `   ${income.trend === 'up' ? '↑' : '↓'} ${formatPercentage(Math.abs(income.change.percentage))} vs periode lalu\n\n`;

    text += `💸 Pengeluaran: ${expense.formatted}\n`;
    text += `   ${expense.trend === 'up' ? '↑' : '↓'} ${formatPercentage(Math.abs(expense.change.percentage))} vs periode lalu\n\n`;

    text += `📈 Net Cashflow: ${net.formatted}\n`;
    text += `   ${net.trend === 'up' ? '📈' : '📉'} ${formatPercentage(Math.abs(net.change.percentage))}\n\n`;

    text += `📝 Transaksi: ${transactions.formatted}\n`;
    text += `   ${transactions.trend === 'up' ? '↑' : '↓'} ${Math.abs(transactions.change.value)} transaksi\n\n`;

    // Top categories
    if (data.charts.categories.length > 0) {
      text += '*📂 TOP KATEGORI*\n';
      data.charts.categories.slice(0, 3).forEach((cat, i) => {
        text += `${i + 1}. ${cat.category_name || 'Other'}: ${formatCurrency(cat.total)}\n`;
      });
      text += '\n';
    }

    // Mini trend
    if (data.charts.trend.length > 0) {
      text += '*📈 TREND (7 hari)*\n';
      const sparkline = data.charts.trend
        .map((d) => {
          const net = parseFloat(d.income || 0) - parseFloat(d.expense || 0);
          return net >= 0 ? '▲' : '▼';
        })
        .join('');
      text += `${sparkline}\n`;
    }

    return text;
  },

  /**
   * Calculate change between two values
   */
  _calculateChange(current, previous) {
    const diff = current - previous;
    const percentage = previous !== 0 ? (diff / previous) * 100 : 0;

    return {
      value: diff,
      percentage,
      formatted: formatCurrency(Math.abs(diff)),
    };
  },
};
