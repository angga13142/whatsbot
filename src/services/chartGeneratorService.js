/**
 * Chart Generator Service
 *
 * Generate various types of charts
 */

const chartBuilder = require('../utils/chartBuilder');
const imageGenerator = require('../utils/imageGenerator');
const reportDataRepository = require('../database/repositories/reportDataRepository');
const { getColorByType } = require('../utils/colorPalette');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class ChartGeneratorService {
  /**
   * Generate bar chart
   * @param {Object} filters - Data filters
   * @param {Object} options - Chart options
   * @returns {Promise<string>} Image file path
   */
  async generateBarChart(filters, options = {}) {
    try {
      // Get data
      const summary = await reportDataRepository.getReportSummary(filters);

      // Build chart config
      const chartConfig = chartBuilder.createIncomeExpenseChart({
        income: summary.total_income,
        expense: summary.total_expense,
        title: options.title || 'Income vs Expense',
      });

      // Generate image
      const imagePath = await imageGenerator.generateChartImage(chartConfig, options);

      logger.info('Bar chart generated', { filters, imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating bar chart', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate line chart (trend)
   * @param {Object} filters - Data filters
   * @param {Object} options - Chart options
   * @returns {Promise<string>} Image file path
   */
  async generateLineChart(filters, options = {}) {
    try {
      const interval = options.interval || 'day';

      // Get trend data
      const trendData = await reportDataRepository.getTrendData(filters, interval);

      if (trendData.length === 0) {
        throw new Error('No data available for trend chart');
      }

      // Build chart config
      const chartConfig = chartBuilder.createTrendChart(trendData);

      // Generate image
      const imagePath = await imageGenerator.generateChartImage(chartConfig, options);

      logger.info('Line chart generated', { filters, imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating line chart', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate pie chart
   * @param {Object} filters - Data filters
   * @param {string} groupBy - Group by dimension
   * @param {Object} options - Chart options
   * @returns {Promise<string>} Image file path
   */
  async generatePieChart(filters, groupBy, options = {}) {
    try {
      // Get grouped data
      const groupedData = await reportDataRepository.getGroupedData(filters, groupBy);

      if (groupedData.length === 0) {
        throw new Error('No data available for pie chart');
      }

      // Limit to top 10 + Others
      const topData = groupedData.slice(0, 10);
      const othersTotal = groupedData
        .slice(10)
        .reduce((sum, item) => sum + parseFloat(item.total), 0);

      if (othersTotal > 0) {
        topData.push({
          category_name: 'Others',
          total: othersTotal,
          count: groupedData.slice(10).reduce((sum, item) => sum + parseInt(item.count), 0),
        });
      }

      // Build chart config
      const chartConfig = chartBuilder.createCategoryPieChart(topData);
      chartConfig.options.plugins.title.text = options.title || `Breakdown by ${groupBy}`;

      // Generate image
      const imagePath = await imageGenerator.generateChartImage(chartConfig, {
        ...options,
        width: 1000,
        height: 1000,
      });

      logger.info('Pie chart generated', { filters, groupBy, imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating pie chart', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate comparison chart
   * @param {Object} currentFilters - Current period filters
   * @param {Object} previousFilters - Previous period filters
   * @param {Object} options - Chart options
   * @returns {Promise<string>} Image file path
   */
  async generateComparisonChart(currentFilters, previousFilters, options = {}) {
    try {
      // Get data for both periods
      const [currentData, previousData] = await Promise.all([
        reportDataRepository.getReportSummary(currentFilters),
        reportDataRepository.getReportSummary(previousFilters),
      ]);

      // Build chart config
      const chartConfig = chartBuilder.createComparisonChart(currentData, previousData, [
        options.currentLabel || 'Current',
        options.previousLabel || 'Previous',
      ]);

      // Generate image
      const imagePath = await imageGenerator.generateChartImage(chartConfig, options);

      logger.info('Comparison chart generated', { imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating comparison chart', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate category breakdown chart
   * @param {Object} filters - Data filters
   * @param {Object} options - Chart options
   * @returns {Promise<string>} Image file path
   */
  async generateCategoryChart(filters, options = {}) {
    try {
      const groupedData = await reportDataRepository.getGroupedData(filters, 'category');

      if (groupedData.length === 0) {
        throw new Error('No category data available');
      }

      // Sort by total descending
      const sorted = groupedData.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

      // Build horizontal bar chart
      const labels = sorted.slice(0, 10).map((item) => item.category_name || 'Uncategorized');
      const data = sorted.slice(0, 10).map((item) => parseFloat(item.total));

      const chartConfig = chartBuilder.createBarChart({
        labels,
        datasets: [
          {
            label: 'Total Amount',
            data,
            backgroundColor: getColorByType('income'),
          },
        ],
        title: options.title || 'Top 10 Categories',
        horizontal: true,
      });

      // Generate image
      const imagePath = await imageGenerator.generateChartImage(chartConfig, {
        ...options,
        width: 1200,
        height: 800,
      });

      logger.info('Category chart generated', { imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating category chart', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate user performance chart
   * @param {Object} filters - Data filters
   * @param {Object} options - Chart options
   * @returns {Promise<string>} Image file path
   */
  async generateUserPerformanceChart(filters, options = {}) {
    try {
      const groupedData = await reportDataRepository.getGroupedData(filters, 'user');

      if (groupedData.length === 0) {
        throw new Error('No user data available');
      }

      // Sort by total descending
      const sorted = groupedData.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

      const labels = sorted.map((item) => item.user_name);
      const data = sorted.map((item) => parseFloat(item.total));

      const chartConfig = chartBuilder.createBarChart({
        labels,
        datasets: [
          {
            label: 'Total Transactions',
            data,
            backgroundColor: getColorByType('net'),
          },
        ],
        title: options.title || 'User Performance',
        horizontal: true,
      });

      const imagePath = await imageGenerator.generateChartImage(chartConfig, options);

      logger.info('User performance chart generated', { imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating user performance chart', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate monthly summary chart
   * @param {number} year - Year
   * @param {Object} options - Options
   * @returns {Promise<string>} Image file path
   */
  async generateMonthlySummaryChart(year, options = {}) {
    try {
      const monthlyData = [];

      // Get data for each month
      for (let month = 0; month < 12; month++) {
        const startDate = dayjs().year(year).month(month).startOf('month').toDate();
        const endDate = dayjs().year(year).month(month).endOf('month').toDate();

        const summary = await reportDataRepository.getReportSummary({
          startDate,
          endDate,
        });

        monthlyData.push(summary);
      }

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const incomeData = monthlyData.map((m) => m.total_income);
      const expenseData = monthlyData.map((m) => m.total_expense);

      const chartConfig = chartBuilder.createLineChart({
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            color: getColorByType('income'),
          },
          {
            label: 'Expense',
            data: expenseData,
            color: getColorByType('expense'),
          },
        ],
        title: `${year} Monthly Summary`,
      });

      const imagePath = await imageGenerator.generateChartImage(chartConfig, options);

      logger.info('Monthly summary chart generated', { year, imagePath });

      return imagePath;
    } catch (error) {
      logger.error('Error generating monthly summary chart', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ChartGeneratorService();
