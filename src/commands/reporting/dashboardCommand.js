/**
 * Dashboard Command
 *
 * Display dashboard summary via WhatsApp
 */

const dashboardService = require('../../services/dashboardService');
const visualAnalyticsService = require('../../services/visualAnalyticsService');
const dateRangeHelper = require('../../utils/dateRangeHelper');
const logger = require('../../utils/logger');

module.exports = {
  name: 'dashboard',
  aliases: ['db', 'dasbor'],
  description: 'View dashboard summary',
  usage: '/dashboard [period]',

  async handler(client, message, user, args) {
    try {
      const preset = args[0] || 'this_month';

      await this.showDashboard(message, user, preset);
    } catch (error) {
      logger.error('Error in dashboard command', { userId: user.id, error: error.message });
      await message.reply('❌ Terjadi kesalahan.');
    }
  },

  async showDashboard(message, user, preset) {
    try {
      // Validate preset
      const presets = dateRangeHelper.getPresetRanges();
      if (!presets[preset]) {
        const validPresets = Object.keys(presets).slice(0, 6);
        await message.reply(
          '📊 *DASHBOARD*\n\n' +
            'Pilih periode:\n' +
            validPresets.map((p) => `• \`/dashboard ${p}\``).join('\n')
        );
        return;
      }

      await message.reply('⏳ Loading dashboard...');

      // Get dashboard data
      const data = await dashboardService.getDashboardData(preset);

      // Get financial health
      const health = await visualAnalyticsService.getFinancialHealth({
        startDate: data.period.startDate,
        endDate: data.period.endDate,
      });

      // Format text dashboard
      let text = dashboardService.formatDashboardText(data);

      // Add health score
      text += '\n*💚 FINANCIAL HEALTH*\n';
      text += `${health.emoji} Score: ${health.score}/100 (${health.status})\n`;

      // Add quick actions
      text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += '*📊 GRAFIK*\n';
      text += `\`/chart bar ${preset}\` - Bar chart\n`;
      text += `\`/chart line ${preset}\` - Trend line\n`;
      text += `\`/chart pie ${preset}\` - Category pie\n`;

      await message.reply(text);

      logger.info('Dashboard displayed', { userId: user.id, preset });
    } catch (error) {
      logger.error('Error showing dashboard', { error: error.message });
      await message.reply('❌ Gagal memuat dashboard.');
    }
  },
};
