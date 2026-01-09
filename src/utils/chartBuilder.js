/**
 * Chart Builder Utility
 *
 * Build chart configurations
 */

const chartConfig = require('../config/chartConfig');
const { getColorByType, getChartColors, addTransparency } = require('./colorPalette');
const { formatCurrency } = require('./formatter');

class ChartBuilder {
  constructor() {
    this.config = {};
  }

  /**
   * Create bar chart configuration
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart. js config
   */
  createBarChart(data, options = {}) {
    const { labels, datasets, title, horizontal = false } = data;

    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.color || getChartColors(datasets.length)[index],
          borderColor: dataset.borderColor || dataset.color,
          borderWidth: 2,
          borderRadius: 8,
          ...dataset,
        })),
      },
      options: {
        ...chartConfig.defaults.bar,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          ...chartConfig.defaults.bar.plugins,
          title: {
            display: !!title,
            text: title,
            font: {
              size: chartConfig.fonts.sizes.title,
              weight: 'bold',
            },
            padding: 20,
          },
        },
        ...options,
      },
    };

    return config;
  }

  /**
   * Create line chart configuration
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart.js config
   */
  createLineChart(data, options = {}) {
    const { labels, datasets, title } = data;

    const config = {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.color || getChartColors(datasets.length)[index],
          backgroundColor: addTransparency(
            dataset.color || getChartColors(datasets.length)[index],
            0.1
          ),
          fill: dataset.fill !== false,
          tension: dataset.tension || 0.4,
          ...dataset,
        })),
      },
      options: {
        ...chartConfig.defaults.line,
        plugins: {
          ...chartConfig.defaults.line.plugins,
          title: {
            display: !!title,
            text: title,
            font: {
              size: chartConfig.fonts.sizes.title,
              weight: 'bold',
            },
          },
        },
        ...options,
      },
    };

    return config;
  }

  /**
   * Create pie chart configuration
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart.js config
   */
  createPieChart(data, options = {}) {
    const { labels, values, title, colors } = data;

    const config = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors || getChartColors(labels.length),
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...chartConfig.defaults.pie,
        plugins: {
          ...chartConfig.defaults.pie.plugins,
          title: {
            display: !!title,
            text: title,
            font: {
              size: chartConfig.fonts.sizes.title,
              weight: 'bold',
            },
          },
        },
        ...options,
      },
    };

    return config;
  }

  /**
   * Create doughnut chart configuration
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart.js config
   */
  createDoughnutChart(data, options = {}) {
    const config = this.createPieChart(data, options);
    config.type = 'doughnut';
    config.options = {
      ...config.options,
      ...chartConfig.defaults.doughnut,
    };

    return config;
  }

  /**
   * Create income vs expense bar chart
   * @param {Object} data - Data with income and expense
   * @returns {Object} Chart config
   */
  createIncomeExpenseChart(data) {
    return this.createBarChart({
      labels: data.labels || ['Pemasukan', 'Pengeluaran'],
      datasets: [
        {
          label: 'Jumlah',
          data: [data.income, data.expense],
          backgroundColor: [getColorByType('income'), getColorByType('expense')],
        },
      ],
      title: data.title || 'Pemasukan vs Pengeluaran',
    });
  }

  /**
   * Create trend line chart
   * @param {Object} trendData - Trend data array
   * @returns {Object} Chart config
   */
  createTrendChart(trendData) {
    const labels = trendData.map((d) => d.period);
    const incomeData = trendData.map((d) => parseFloat(d.income || 0));
    const expenseData = trendData.map((d) => parseFloat(d.expense || 0));

    return this.createLineChart({
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          color: getColorByType('income'),
          fill: false,
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          color: getColorByType('expense'),
          fill: false,
        },
      ],
      title: 'Trend Pemasukan & Pengeluaran',
    });
  }

  /**
   * Create category breakdown pie chart
   * @param {Array} categoryData - Category grouped data
   * @returns {Object} Chart config
   */
  createCategoryPieChart(categoryData) {
    const labels = categoryData.map((c) => c.category_name || 'Uncategorized');
    const values = categoryData.map((c) => parseFloat(c.total));

    return this.createPieChart({
      labels,
      values,
      title: 'Breakdown by Category',
    });
  }

  /**
   * Create comparison bar chart
   * @param {Object} current - Current period data
   * @param {Object} previous - Previous period data
   * @param {Array} labels - Period labels
   * @returns {Object} Chart config
   */
  createComparisonChart(current, previous, labels) {
    return this.createBarChart({
      labels: labels || ['Current', 'Previous'],
      datasets: [
        {
          label: 'Pemasukan',
          data: [current.total_income, previous.total_income],
          backgroundColor: getColorByType('income'),
        },
        {
          label: 'Pengeluaran',
          data: [current.total_expense, previous.total_expense],
          backgroundColor: getColorByType('expense'),
        },
      ],
      title: 'Period Comparison',
    });
  }
}

module.exports = new ChartBuilder();
