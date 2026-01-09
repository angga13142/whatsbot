/**
 * Chart Builder Utility
 *
 * Build Chart.js configurations
 */

const chartConfig = require('../config/chartConfig');
const colorPalette = require('./colorPalette');
const { formatCurrency } = require('./formatter');

module.exports = {
  /**
   * Build bar chart configuration
   */
  buildBarChart(data, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();
    const theme = colorPalette.getTheme(options.theme);

    return {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color || colorPalette.getCategoryColor(i),
          borderRadius: chartConfig.chartDefaults.bar.borderRadius,
          ...chartConfig.chartDefaults.bar,
        })),
      },
      options: this._getCommonOptions(options, theme),
    };
  },

  /**
   * Build line chart configuration
   */
  buildLineChart(data, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();
    const theme = colorPalette.getTheme(options.theme);

    return {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color || colorPalette.getCategoryColor(i),
          backgroundColor: colorPalette.withAlpha(
            ds.color || colorPalette.getCategoryColor(i),
            0.1
          ),
          ...chartConfig.chartDefaults.line,
          fill: options.fill !== false,
        })),
      },
      options: this._getCommonOptions(options, theme),
    };
  },

  /**
   * Build pie chart configuration
   */
  buildPieChart(data, options = {}) {
    const theme = colorPalette.getTheme(options.theme);
    const categoryColors = colorPalette.getCategoryColors(data.labels.length);

    return {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: categoryColors,
            ...chartConfig.chartDefaults.pie,
          },
        ],
      },
      options: {
        ...this._getCommonOptions(options, theme),
        plugins: {
          ...this._getCommonOptions(options, theme).plugins,
          legend: {
            position: 'right',
            labels: {
              font: { size: chartConfig.fonts.legendSize },
              color: theme.text,
              padding: 15,
              usePointStyle: true,
            },
          },
        },
      },
    };
  },

  /**
   * Build doughnut chart configuration
   */
  buildDoughnutChart(data, options = {}) {
    const config = this.buildPieChart(data, options);
    config.type = 'doughnut';
    config.data.datasets[0] = {
      ...config.data.datasets[0],
      ...chartConfig.chartDefaults.doughnut,
    };
    return config;
  },

  /**
   * Build income vs expense bar chart
   */
  buildIncomeExpenseChart(income, expense, labels, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();

    return this.buildBarChart(
      {
        labels,
        datasets: [
          { label: 'Pemasukan', data: income, color: colors.income },
          { label: 'Pengeluaran', data: expense, color: colors.expense },
        ],
      },
      { ...options, title: options.title || 'Pemasukan vs Pengeluaran' }
    );
  },

  /**
   * Build trend line chart
   */
  buildTrendChart(trendData, options = {}) {
    const colors = colorPalette.getIncomeExpenseColors();
    const netData = trendData.map((d) => d.income - d.expense);

    return this.buildLineChart(
      {
        labels: trendData.map((d) => d.period),
        datasets: [{ label: 'Net Cashflow', data: netData, color: colors.net }],
      },
      { ...options, title: options.title || 'Trend Cashflow' }
    );
  },

  /**
   * Build category breakdown chart
   */
  buildCategoryChart(categoryData, options = {}) {
    const sorted = [...categoryData].sort((a, b) => b.total - a.total);
    const top = sorted.slice(0, 8);
    const others = sorted.slice(8);

    const labels = top.map((c) => c.category_name || c.name || 'Unknown');
    const values = top.map((c) => parseFloat(c.total));

    if (others.length > 0) {
      labels.push('Lainnya');
      values.push(others.reduce((sum, c) => sum + parseFloat(c.total), 0));
    }

    return this.buildDoughnutChart({ labels, values }, options);
  },

  /**
   * Get common chart options
   */
  _getCommonOptions(options, theme) {
    return {
      responsive: false,
      maintainAspectRatio: false,
      animation: chartConfig.animation,
      plugins: {
        title: {
          display: !!options.title,
          text: options.title || '',
          font: { size: chartConfig.fonts.titleSize, weight: 'bold' },
          color: theme.text,
          padding: { bottom: 20 },
        },
        legend: {
          display: options.showLegend !== false,
          position: chartConfig.legend.position,
          labels: {
            font: { size: chartConfig.fonts.legendSize },
            color: theme.text,
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          ...chartConfig.tooltip,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y ?? context.parsed;
              return `${context.dataset.label || ''}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      scales:
        options.showScales !== false
          ? {
              x: {
                grid: { display: false },
                ticks: { color: theme.text, font: { size: chartConfig.fonts.tickSize } },
              },
              y: {
                grid: { ...chartConfig.grid },
                ticks: {
                  color: theme.text,
                  font: { size: chartConfig.fonts.tickSize },
                  callback: (value) => formatCurrency(value, { compact: true }),
                },
              },
            }
          : undefined,
    };
  },
};
