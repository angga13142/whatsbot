/**
 * Chart Generator Service
 *
 * Generate various chart types as images
 */

const chartBuilder = require('../utils/chartBuilder');
const imageGenerator = require('../utils/imageGenerator');
const reportDataRepository = require('../database/repositories/reportDataRepository');
const dateRangeHelper = require('../utils/dateRangeHelper');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Generate bar chart
   */
  async generateBarChart(filters, options = {}) {
    try {
      const trendData = await reportDataRepository.getTrendData(filters, options.interval || 'day');

      if (trendData.length === 0) {
        return { error: 'Tidak ada data untuk periode ini' };
      }

      const income = trendData.map((d) => parseFloat(d.income || 0));
      const expense = trendData.map((d) => parseFloat(d.expense || 0));
      const labels = trendData.map((d) => d.period);

      const chartConfig = chartBuilder.buildIncomeExpenseChart(income, expense, labels, {
        title: options.title || 'Pemasukan vs Pengeluaran',
      });

      const filename = imageGenerator.generateFilename('bar-chart');
      const result = await imageGenerator.renderToFile(chartConfig, filename, 'whatsapp');

      logger.info('Bar chart generated', { filename });
      return result;
    } catch (error) {
      logger.error('Error generating bar chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate line chart (trend)
   */
  async generateLineChart(filters, options = {}) {
    try {
      const trendData = await reportDataRepository.getTrendData(filters, options.interval || 'day');

      if (trendData.length === 0) {
        return { error: 'Tidak ada data untuk periode ini' };
      }

      const chartConfig = chartBuilder.buildTrendChart(trendData, {
        title: options.title || 'Trend Cashflow',
      });

      const filename = imageGenerator.generateFilename('line-chart');
      const result = await imageGenerator.renderToFile(chartConfig, filename, 'whatsapp');

      logger.info('Line chart generated', { filename });
      return result;
    } catch (error) {
      logger.error('Error generating line chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate pie chart (category breakdown)
   */
  async generatePieChart(filters, groupBy = 'category', options = {}) {
    try {
      const groupedData = await reportDataRepository.getGroupedData(filters, groupBy);

      if (groupedData.length === 0) {
        return { error: 'Tidak ada data untuk periode ini' };
      }

      const chartConfig = chartBuilder.buildCategoryChart(groupedData, {
        title: options.title || `Breakdown by ${groupBy}`,
      });

      const filename = imageGenerator.generateFilename('pie-chart');
      const result = await imageGenerator.renderToFile(chartConfig, filename, 'whatsapp');

      logger.info('Pie chart generated', { filename, groupBy });
      return result;
    } catch (error) {
      logger.error('Error generating pie chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate doughnut chart
   */
  async generateDoughnutChart(filters, groupBy = 'type', options = {}) {
    try {
      const groupedData = await reportDataRepository.getGroupedData(filters, groupBy);

      if (groupedData.length === 0) {
        return { error: 'Tidak ada data untuk periode ini' };
      }

      const chartConfig = chartBuilder.buildCategoryChart(groupedData, {
        title: options.title || `Distribusi by ${groupBy}`,
      });

      // Convert to doughnut
      chartConfig.type = 'doughnut';

      const filename = imageGenerator.generateFilename('doughnut-chart');
      const result = await imageGenerator.renderToFile(chartConfig, filename, 'whatsapp');

      logger.info('Doughnut chart generated', { filename });
      return result;
    } catch (error) {
      logger.error('Error generating doughnut chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate chart by preset period
   */
  async generateByPreset(chartType, preset, options = {}) {
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

      switch (chartType) {
        case 'bar':
          return await this.generateBarChart(filters, { ...options, title: range.label });
        case 'line':
        case 'trend':
          return await this.generateLineChart(filters, {
            ...options,
            title: `Trend - ${range.label}`,
          });
        case 'pie':
          return await this.generatePieChart(filters, 'category', {
            ...options,
            title: `Kategori - ${range.label}`,
          });
        case 'doughnut':
          return await this.generateDoughnutChart(filters, 'type', {
            ...options,
            title: `Jenis - ${range.label}`,
          });
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }
    } catch (error) {
      logger.error('Error generating chart by preset', { chartType, preset, error: error.message });
      throw error;
    }
  },

  /**
   * Get available chart types
   */
  getChartTypes() {
    return [
      { value: 'bar', label: 'Bar Chart', description: 'Pemasukan vs Pengeluaran' },
      { value: 'line', label: 'Line Chart', description: 'Trend over time' },
      { value: 'pie', label: 'Pie Chart', description: 'Category breakdown' },
      { value: 'doughnut', label: 'Doughnut Chart', description: 'Type distribution' },
    ];
  },
};
