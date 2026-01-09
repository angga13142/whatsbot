/**
 * Chart Templates
 *
 * Pre-defined chart configurations
 */

const colorPalette = require('../../utils/colorPalette');
const chartConfig = require('../../config/chartConfig');

module.exports = {
  /**
   * Income vs Expense template
   */
  incomeVsExpense(data, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();

    return {
      type: 'bar',
      title: options.title || 'Pemasukan vs Pengeluaran',
      config: {
        labels: data.labels,
        datasets: [
          {
            label: 'Pemasukan',
            data: data.income,
            backgroundColor: colors.income,
          },
          {
            label: 'Pengeluaran',
            data: data.expense,
            backgroundColor: colors.expense,
          },
        ],
      },
      dimensions: 'whatsapp',
    };
  },

  /**
   * Net cashflow trend template
   */
  netCashflowTrend(data, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();

    return {
      type: 'line',
      title: options.title || 'Trend Net Cashflow',
      config: {
        labels: data.labels,
        datasets: [
          {
            label: 'Net Cashflow',
            data: data.values,
            borderColor: colors.net,
            backgroundColor: colorPalette.withAlpha(colors.net, 0.1),
            fill: true,
          },
        ],
      },
      dimensions: 'whatsapp',
    };
  },

  /**
   * Category breakdown pie template
   */
  categoryBreakdown(data, options = {}) {
    const categoryColors = colorPalette.getCategoryColors(data.labels.length);

    return {
      type: 'pie',
      title: options.title || 'Breakdown by Category',
      config: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: categoryColors,
          },
        ],
      },
      dimensions: 'square',
    };
  },

  /**
   * Type distribution doughnut template
   */
  typeDistribution(data, options = {}) {
    const colors = {
      paket: '#22c55e',
      utang: '#3b82f6',
      jajan: '#f59e0b',
    };

    return {
      type: 'doughnut',
      title: options.title || 'Distribusi Jenis Transaksi',
      config: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: data.labels.map((l) => colors[l.toLowerCase()] || '#6b7280'),
          },
        ],
      },
      dimensions: 'square',
    };
  },

  /**
   * Comparison bar template
   */
  periodComparison(data, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();

    return {
      type: 'bar',
      title: options.title || 'Period Comparison',
      config: {
        labels: ['Pemasukan', 'Pengeluaran', 'Net'],
        datasets: [
          {
            label: data.period1.label,
            data: [data.period1.income, data.period1.expense, data.period1.net],
            backgroundColor: colorPalette.withAlpha(colors.net, 0.7),
          },
          {
            label: data.period2.label,
            data: [data.period2.income, data.period2.expense, data.period2.net],
            backgroundColor: colors.net,
          },
        ],
      },
      dimensions: 'wide',
    };
  },

  /**
   * Daily activity template
   */
  dailyActivity(data, options = {}) {
    return {
      type: 'bar',
      title: options.title || 'Daily Activity',
      config: {
        labels: data.labels,
        datasets: [
          {
            label: 'Transaksi',
            data: data.counts,
            backgroundColor: colorPalette.getCategoryColor(0),
          },
        ],
      },
      dimensions: 'wide',
    };
  },

  /**
   * Top performers horizontal bar template
   */
  topPerformers(data, options = {}) {
    const categoryColors = colorPalette.getCategoryColors(data.labels.length);

    return {
      type: 'bar',
      title: options.title || 'Top Performers',
      config: {
        labels: data.labels,
        datasets: [
          {
            label: 'Total',
            data: data.values,
            backgroundColor: categoryColors,
          },
        ],
      },
      options: {
        indexAxis: 'y', // Horizontal bars
      },
      dimensions: 'tall',
    };
  },
};
