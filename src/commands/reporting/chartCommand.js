/**
 * Chart Command
 *
 * Generate and send charts via WhatsApp
 */

const chartGeneratorService = require('../../services/chartGeneratorService');
const dateRangeHelper = require('../../utils/dateRangeHelper');
const logger = require('../../utils/logger');

module.exports = {
  name: 'chart',
  aliases: ['grafik'],
  description: 'Generate visual charts',
  usage: '/chart [bar|line|pie] [period]',

  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.showMenu(message);
        return;
      }

      const chartType = args[0].toLowerCase();
      const preset = args[1] || 'this_month';

      await this.generateChart(client, message, user, chartType, preset);
    } catch (error) {
      logger.error('Error in chart command', { userId: user.id, error: error.message });
      await message.reply('❌ Terjadi kesalahan saat membuat grafik.');
    }
  },

  async showMenu(message) {
    const presets = Object.keys(dateRangeHelper.getPresetRanges()).slice(0, 6);

    const text =
      '╔══════════════════════════════════════════════════╗\n' +
      '║  📊 CHART GENERATOR                              ║\n' +
      '╚══════════════════════════════════════════════════╝\n\n' +
      '*📈 JENIS GRAFIK*\n' +
      '• `bar` - Pemasukan vs Pengeluaran\n' +
      '• `line` / `trend` - Trend over time\n' +
      '• `pie` - Breakdown by category\n' +
      '• `doughnut` - Distribusi by type\n\n' +
      '*📅 PERIODE*\n' +
      presets.map((p) => `• \`${p}\``).join('\n') +
      '\n\n' +
      '*📝 CONTOH*\n' +
      '`/chart bar this_week`\n' +
      '`/chart line this_month`\n' +
      '`/chart pie last_30_days`\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 Grafik akan dikirim sebagai gambar';

    await message.reply(text);
  },

  async generateChart(client, message, user, chartType, preset) {
    try {
      // Validate chart type
      const validTypes = ['bar', 'line', 'trend', 'pie', 'doughnut'];
      if (!validTypes.includes(chartType)) {
        await message.reply(`❌ Jenis grafik tidak valid.\n\nGunakan: ${validTypes.join(', ')}`);
        return;
      }

      // Validate preset
      const presets = dateRangeHelper.getPresetRanges();
      if (!presets[preset]) {
        await message.reply(
          `❌ Periode tidak valid.\n\nGunakan: ${Object.keys(presets).slice(0, 6).join(', ')}`
        );
        return;
      }

      await message.reply('⏳ Generating chart...');

      const result = await chartGeneratorService.generateByPreset(chartType, preset);

      if (result.error) {
        await message.reply(`📭 ${result.error}`);
        return;
      }

      // Send image
      const { MessageMedia } = require('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(result.filepath);

      await client.sendMessage(message.from, media, {
        caption: `📊 *${chartType.toUpperCase()} CHART*\n📅 Periode: ${presets[preset].label}`,
      });

      logger.info('Chart sent', { userId: user.id, chartType, preset });
    } catch (error) {
      logger.error('Error generating chart', { error: error.message });
      await message.reply('❌ Gagal membuat grafik.');
    }
  },
};
