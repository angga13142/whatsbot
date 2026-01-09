/**
 * Dashboard Command
 *
 * Generate visual dashboards
 */

const dashboardService = require('../../services/dashboardService');
const logger = require('../../utils/logger');
const { createBox, bold } = require('../../utils/richText');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
  name: 'dashboard',
  aliases: ['dash'],
  description: 'Generate visual dashboard',
  usage: '/dashboard [period]',

  async handler(client, message, user, args) {
    try {
      const period = args[0] || 'this_month';
      const quick = args.includes('quick');

      // Get filters
      const filters = this._getFiltersForPeriod(period);

      await message.reply('📊 Generating dashboard...');

      let imagePath;

      if (quick) {
        // Quick metrics only
        imagePath = await dashboardService.generateQuickMetrics(filters);
      } else {
        // Full dashboard
        imagePath = await dashboardService.generateDashboard(filters);
      }

      // Send image
      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(message.from, media, {
        caption: `📊 Dashboard - ${period.replace('_', ' ').toUpperCase()}`,
      });

      // Cleanup
      setTimeout(async () => {
        const fs = require('fs').promises;
        await fs.unlink(imagePath).catch(() => {});
      }, 60000);

      logger.info('Dashboard generated', { userId: user.id, period });
    } catch (error) {
      logger.error('Error in dashboard command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Failed to generate dashboard.');
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

    return {
      startDate: presets.this_month.startDate,
      endDate: presets.this_month.endDate,
    };
  },
};
