/**
 * Export Command
 *
 * Export data to various formats
 */

const reportBuilderService = require('../../services/reportBuilderService');
const reportExporter = require('../../utils/reportExporter');
const auditRepository = require('../../database/repositories/auditRepository');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/formatter');
const dayjs = require('dayjs');

module.exports = {
  name: 'export',
  aliases: ['ekspor'],
  description: 'Export data ke berbagai format',
  usage: '/export [excel|csv|json] [options]',

  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.showMenu(message);
        return;
      }

      const format = args[0].toLowerCase();
      const options = this._parseOptions(args.slice(1));

      await this.exportData(client, message, user, format, options);
    } catch (error) {
      logger.error('Error in export command', { userId: user.id, error: error.message });
      await message.reply('❌ Terjadi kesalahan.');
    }
  },

  async showMenu(message) {
    const text =
      '╔══════════════════════════════════════════════════╗\n' +
      '║  📤 EXPORT DATA                                  ║\n' +
      '╚══════════════════════════════════════════════════╝\n\n' +
      '*📊 FORMAT TERSEDIA*\n' +
      '• Excel (.xlsx) - Dengan formatting\n' +
      '• CSV (.csv) - Untuk spreadsheet\n' +
      '• JSON (.json) - Untuk integrasi API\n\n' +
      '*🔧 OPSI*\n' +
      '• `days:N` - N hari terakhir (default: 30)\n' +
      '• `type:X` - Filter jenis (paket/utang/jajan)\n\n' +
      '*📝 CONTOH*\n' +
      '`/export excel` - Export 30 hari ke Excel\n' +
      '`/export excel days:7` - Export 7 hari\n' +
      '`/export csv type:paket` - Export paket only\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 File akan dikirim via WhatsApp';

    await message.reply(text);
  },

  async exportData(client, message, user, format, options) {
    try {
      if (!['excel', 'csv', 'json', 'xlsx'].includes(format)) {
        await message.reply('❌ Format tidak valid. Gunakan: excel, csv, atau json');
        return;
      }

      await message.reply('⏳ Menyiapkan export...');

      const filters = this._buildFilters(options, user);

      const reportData = await reportBuilderService.executeAdHocReport(
        { filters, report_type: 'standard' },
        user.id
      );

      if (!reportData.data || reportData.data.length === 0) {
        await message.reply('📭 Tidak ada data untuk di-export.');
        return;
      }

      const exported = await reportExporter.export(reportData, format, {
        filename: `export-${user.id}-${Date.now()}`,
      });

      const { MessageMedia } = require('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(exported.filepath);

      await client.sendMessage(message.from, media, {
        caption: this._formatExportCaption(reportData, format.toUpperCase()),
      });

      await auditRepository.log({
        user_id: user.id,
        action: 'EXPORT_DATA',
        entity_type: 'report',
        new_values: { format, recordCount: reportData.data.length },
      });

      logger.info('Data exported', {
        userId: user.id,
        format,
        recordCount: reportData.data.length,
      });
    } catch (error) {
      logger.error('Error exporting data', { error: error.message });
      await message.reply('❌ Gagal export data.');
    }
  },

  _parseOptions(args) {
    const options = {};
    args.forEach((arg) => {
      const [key, value] = arg.split(':');
      if (key && value) {
        options[key.toLowerCase()] = value;
      }
    });
    return options;
  },

  _buildFilters(options, user) {
    const filters = {};
    const days = parseInt(options.days) || 30;

    filters.startDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
    filters.endDate = dayjs().format('YYYY-MM-DD');

    if (options.type) {
      filters.type = options.type;
    }

    if (!['admin', 'superadmin'].includes(user.role)) {
      filters.userId = user.id;
    }

    return filters;
  },

  _formatExportCaption(reportData, format) {
    const s = reportData.summary;
    return (
      `📤 *DATA EXPORT - ${format}*\n\n` +
      `📊 Total Records: ${reportData.data.length}\n` +
      `💰 Pemasukan: ${formatCurrency(s.total_income)}\n` +
      `💸 Pengeluaran: ${formatCurrency(s.total_expense)}\n` +
      `📈 Net: ${formatCurrency(s.net)}`
    );
  },
};
