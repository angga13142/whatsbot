/**
 * Dashboard Service
 *
 * Generate dashboard data and layouts
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
const imageGenerator = require('../utils/imageGenerator');
const { formatCurrency } = require('../utils/formatter');
// const { getColorByType } = require('../utils/colorPalette'); // Unused
const chartBuilder = require('../utils/chartBuilder');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class DashboardService {
  /**
   * Generate full dashboard
   * @param {Object} filters - Data filters
   * @param {Object} options - Dashboard options
   * @returns {Promise<string>} Dashboard image path
   */
  async generateDashboard(filters, options = {}) {
    try {
      // Get all necessary data
      const [summary, trendData, categoryData] = await Promise.all([
        reportDataRepository.getReportSummary(filters),
        reportDataRepository.getTrendData(filters, 'day'),
        reportDataRepository.getGroupedData(filters, 'category'),
      ]);

      // Build dashboard data
      const dashboardData = {
        title: options.title || this._generateDashboardTitle(filters),
        metrics: this._buildMetricCards(summary, options),
        charts: await this._buildDashboardCharts(trendData, categoryData, filters),
        timestamp: new Date(),
      };

      // Generate dashboard image
      const imagePath = await imageGenerator.generateDashboardImage(dashboardData, options);

      logger.info('Dashboard generated', { filters, imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating dashboard', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate quick metrics dashboard (metrics only, no charts)
   * @param {Object} filters - Data filters
   * @param {Object} options - Options
   * @returns {Promise<string>} Image path
   */
  async generateQuickMetrics(filters, options = {}) {
    try {
      const summary = await reportDataRepository.getReportSummary(filters);

      const dashboardData = {
        title: 'Quick Metrics',
        metrics: this._buildMetricCards(summary, options),
        charts: [], // No charts
        timestamp: new Date(),
      };

      const imagePath = await imageGenerator.generateDashboardImage(dashboardData, options);

      logger.info('Quick metrics generated', { imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating quick metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate period comparison dashboard
   * @param {Object} currentFilters - Current period filters
   * @param {Object} previousFilters - Previous period filters
   * @param {Object} options - Options
   * @returns {Promise<string>} Image path
   */
  async generateComparisonDashboard(currentFilters, previousFilters, options = {}) {
    try {
      const [currentSummary, previousSummary] = await Promise.all([
        reportDataRepository.getReportSummary(currentFilters),
        reportDataRepository.getReportSummary(previousFilters),
      ]);

      // Calculate changes
      const metrics = this._buildComparisonMetrics(currentSummary, previousSummary);

      const dashboardData = {
        title: 'Period Comparison',
        metrics,
        charts: [],
        timestamp: new Date(),
      };

      const imagePath = await imageGenerator.generateDashboardImage(dashboardData, options);

      logger.info('Comparison dashboard generated', { imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating comparison dashboard', { error: error.message });
      throw error;
    }
  }

  /**
   * Build metric cards
   * @private
   */
  _buildMetricCards(summary, options = {}) {
    const metrics = [
      {
        icon: '💰',
        label: 'Total Income',
        value: formatCurrency(summary.total_income),
        change: options.previousSummary
          ? this._calculateChange(summary.total_income, options.previousSummary.total_income)
          : null,
      },
      {
        icon: '💸',
        label: 'Total Expense',
        value: formatCurrency(summary.total_expense),
        change: options.previousSummary
          ? this._calculateChange(summary.total_expense, options.previousSummary.total_expense)
          : null,
      },
      {
        icon: '📈',
        label: 'Net Cashflow',
        value: formatCurrency(summary.net),
        change: options.previousSummary
          ? this._calculateChange(summary.net, options.previousSummary.net)
          : null,
      },
      {
        icon: '📊',
        label: 'Transactions',
        value: summary.total_transactions.toString(),
        change: options.previousSummary
          ? this._calculateChange(
              summary.total_transactions,
              options.previousSummary.total_transactions
            )
          : null,
      },
    ];

    return metrics;
  }

  /**
   * Build comparison metrics
   * @private
   */
  _buildComparisonMetrics(current, previous) {
    return [
      {
        icon: '💰',
        label: 'Income Change',
        value: formatCurrency(current.total_income - previous.total_income),
        change: this._calculateChange(current.total_income, previous.total_income),
      },
      {
        icon: '💸',
        label: 'Expense Change',
        value: formatCurrency(current.total_expense - previous.total_expense),
        change: this._calculateChange(current.total_expense, previous.total_expense),
      },
      {
        icon: '📈',
        label: 'Net Change',
        value: formatCurrency(current.net - previous.net),
        change: this._calculateChange(current.net, previous.net),
      },
      {
        icon: '📊',
        label: 'Transaction Change',
        value: (current.total_transactions - previous.total_transactions).toString(),
        change: this._calculateChange(current.total_transactions, previous.total_transactions),
      },
    ];
  }

  /**
   * Build dashboard charts
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  async _buildDashboardCharts(trendData, categoryData, filters) {
    const charts = [];

    // Trend chart
    if (trendData && trendData.length > 0) {
      const trendConfig = chartBuilder.createTrendChart(trendData);
      charts.push({
        type: 'trend',
        config: trendConfig,
        height: 400,
      });
    }

    // Category pie chart
    if (categoryData && categoryData.length > 0) {
      const topCategories = categoryData.slice(0, 8);
      const pieConfig = chartBuilder.createCategoryPieChart(topCategories);
      charts.push({
        type: 'category',
        config: pieConfig,
        height: 400,
      });
    }

    return charts;
  }

  /**
   * Calculate percentage change
   * @private
   */
  _calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Generate dashboard title based on filters
   * @private
   */
  _generateDashboardTitle(filters) {
    if (filters.startDate && filters.endDate) {
      const start = dayjs(filters.startDate);
      const end = dayjs(filters.endDate);

      if (start.isSame(end, 'day')) {
        return `Dashboard - ${start.format('DD MMMM YYYY')}`;
      }

      return `Dashboard - ${start.format('DD MMM')} to ${end.format('DD MMM YYYY')}`;
    }

    return 'Cashflow Dashboard';
  }

  /**
   * Get dashboard data (without generating image)
   * @param {Object} filters - Data filters
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(filters) {
    try {
      const [summary, trendData, categoryData, userData] = await Promise.all([
        reportDataRepository.getReportSummary(filters),
        reportDataRepository.getTrendData(filters, 'day'),
        reportDataRepository.getGroupedData(filters, 'category'),
        reportDataRepository.getGroupedData(filters, 'user'),
      ]);

      return {
        summary,
        trendData: trendData.slice(-7), // Last 7 data points
        topCategories: categoryData.slice(0, 5),
        topUsers: userData.slice(0, 5),
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard data', { error: error.message });
      throw error;
    }
  }
}

module.exports = new DashboardService();
