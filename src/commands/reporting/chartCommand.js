/**
 * Chart Command
 *
 * Generate various chart types
 */

const chartGeneratorService = require('../../services/chartGeneratorService');
const reportBuilderService = require('../../services/reportBuilderService');
const logger = require('../../utils/logger');
const { createBox, bold, createDivider } = require('../../utils/richText');
const { MessageMedia } = require('whatsapp-web.js');
const dayjs = require('dayjs');

module.exports = {
  name: 'chart',
  aliases: ['grafik'],
  description: 'Generate visual charts',
  usage: '/chart [type] [period]',

  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.showMenu(message);
        return;
      }

      const chartType = args[0].toLowerCase();
      const period = args[1] || 'this_month';

      // Get filters for period
      const filters = this._getFiltersForPeriod(period);

      await message.reply('📊 Generating chart...');

      switch (chartType) {
        case 'bar':
          await this.generateBarChart(client, message, filters);
          break;

        case 'line':
        case 'trend':
          await this.generateLineChart(client, message, filters);
          break;

        case 'pie':
          await this.generatePieChart(client, message, filters, args[2] || 'category');
          break;

        case 'category':
          await this.generateCategoryChart(client, message, filters);
          break;

        case 'user':
          await this.generateUserChart(client, message, filters);
          break;

        case 'compare':
        case 'comparison':
          await this.generateComparisonChart(client, message, period);
          break;

        default:
          await message.reply(
            '❌ Invalid chart type.  Use: bar, line, pie, category, user, compare'
          );
      }
    } catch (error) {
      logger.error('Error in chart command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Failed to generate chart.');
    }
  },

  /**
   * Show chart menu
   */
  async showMenu(message) {
    const menuText =
      createBox('📊 CHART GENERATOR', 'Create visual charts', 50) +
      '\n\n' +
      bold('📊 CHART TYPES') +
      '\n' +
      '`/chart bar [period]` - Bar chart (income vs expense)\n' +
      '`/chart line [period]` - Line chart (trend)\n' +
      '`/chart pie [groupBy]` - Pie chart (breakdown)\n' +
      '`/chart category` - Category breakdown\n' +
      '`/chart user` - User performance\n' +
      '`/chart compare` - Period comparison\n\n' +
      bold('📅 PERIODS') +
      '\n' +
      '• today, yesterday\n' +
      '• this_week, last_week\n' +
      '• this_month, last_month\n' +
      '• last_30_days\n\n' +
      bold('📝 EXAMPLES') +
      '\n' +
      '`/chart bar this_month`\n' +
      '`/chart line last_30_days`\n' +
      '`/chart pie category`\n\n' +
      createDivider('━', 50) +
      '\n' +
      '💡 Charts are sent as images';

    await message.reply(menuText);
  },

  /**
   * Generate bar chart
   */
  async generateBarChart(client, message, filters) {
    try {
      const imagePath = await chartGeneratorService.generateBarChart(filters);

      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, { caption: '📊 Income vs Expense Chart' });

      // Cleanup
      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);
    } catch (error) {
      logger.error('Error generating bar chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate line chart
   */
  async generateLineChart(client, message, filters) {
    try {
      const imagePath = await chartGeneratorService.generateLineChart(filters, {
        interval: 'day',
      });

      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, { caption: '📈 Trend Chart' });

      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);
    } catch (error) {
      logger.error('Error generating line chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate pie chart
   */
  async generatePieChart(client, message, filters, groupBy) {
    try {
      const imagePath = await chartGeneratorService.generatePieChart(filters, groupBy);

      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, {
        caption: `📊 ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} Breakdown`,
      });

      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);
    } catch (error) {
      logger.error('Error generating pie chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate category chart
   */
  async generateCategoryChart(client, message, filters) {
    try {
      const imagePath = await chartGeneratorService.generateCategoryChart(filters);

      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, { caption: '📂 Top Categories Chart' });

      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);
    } catch (error) {
      logger.error('Error generating category chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate user chart
   */
  async generateUserChart(client, message, filters) {
    try {
      const imagePath = await chartGeneratorService.generateUserPerformanceChart(filters);

      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, { caption: '👥 User Performance Chart' });

      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);
    } catch (error) {
      logger.error('Error generating user chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate comparison chart
   */
  async generateComparisonChart(client, message, period) {
    try {
      const { current, previous } = this._getComparisonFilters(period);

      const imagePath = await chartGeneratorService.generateComparisonChart(current, previous, {
        currentLabel: 'Current',
        previousLabel: 'Previous',
      });

      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, { caption: '📊 Period Comparison Chart' });

      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);
    } catch (error) {
      logger.error('Error generating comparison chart', { error: error.message });
      throw error;
    }
  },

  /**
   * Get filters for period
   * @private
   */
  _getFiltersForPeriod(period) {
    const dateRangeHelper = require('../../utils/dateRangeHelper');
    const presets = dateRangeHelper.getPresetRanges();

    if (presets[period]) {
      return {
        startDate: presets[period].startDate,
        endDate: presets[period].endDate,
      };
    }

    // Default to this month
    return {
      startDate: presets.this_month.startDate,
      endDate: presets.this_month.endDate,
    };
  },

  /**
   * Get comparison filters
   * @private
   */
  _getComparisonFilters(period) {
    const dateRangeHelper = require('../../utils/dateRangeHelper');
    return dateRangeHelper.getComparisonRange(period || 'this_month');
  },
};
