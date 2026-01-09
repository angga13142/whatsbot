/**
 * Report Command
 *
 * Manage custom reports
 */

const reportBuilderService = require('../../services/reportBuilderService');
const logger = require('../../utils/logger');
const { formatCurrency, formatDate } = require('../../utils/formatter');

module.exports = {
  name: 'report',
  aliases: ['laporan', 'reports'],
  description: 'Kelola laporan custom',
  usage: '/report [list|create|run|export|schedule]',

  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.showMenu(message, user);
        return;
      }

      const action = args[0].toLowerCase();

      switch (action) {
        case 'list':
          await this.listReports(message, user);
          break;
        case 'create':
          await this.createReport(message, user);
          break;
        case 'run':
          await this.runReport(message, user, args.slice(1));
          break;
        case 'export':
          await this.exportReport(client, message, user, args.slice(1));
          break;
        case 'quick':
          await this.quickReport(message, user, args.slice(1));
          break;
        case 'schedule':
          await this.manageSchedule(message, user, args.slice(1));
          break;
        case 'templates':
          await this.showTemplates(message, user);
          break;
        default:
          await this.showMenu(message, user);
      }
    } catch (error) {
      logger.error('Error in report command', { userId: user.id, error: error.message });
      await message.reply('❌ Terjadi kesalahan.');
    }
  },

  async showMenu(message, user) {
    const text =
      '╔══════════════════════════════════════════════════╗\n' +
      '║  📊 LAPORAN CUSTOM                               ║\n' +
      '╚══════════════════════════════════════════════════╝\n\n' +
      '*📋 Laporan Tersimpan*\n' +
      '`/report list` - Lihat laporan\n\n' +
      '*➕ Buat Laporan*\n' +
      '`/report create` - Buat laporan baru\n\n' +
      '*▶️ Jalankan Laporan*\n' +
      '`/report run [nomor]` - Jalankan laporan\n\n' +
      '*📤 Export*\n' +
      '`/report export [nomor] [format]` - Export ke Excel/CSV\n\n' +
      '*⚡ Laporan Cepat*\n' +
      '`/report quick [7d|30d|month]` - Laporan cepat\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 Gunakan `/report templates` untuk template siap pakai';

    await message.reply(text);
  },

  async listReports(message, user) {
    try {
      const reports = await reportBuilderService.getUserReports(user.id);

      if (reports.length === 0) {
        await message.reply('📊 Belum ada laporan tersimpan.\n\nBuat baru: `/report create`');
        return;
      }

      let text = '*📊 LAPORAN TERSIMPAN*\n\n';

      reports.forEach((report, index) => {
        const star = report.is_favorite ? '⭐ ' : '';
        const type = this._getReportTypeEmoji(report.report_type);
        text += `${index + 1}. ${star}${type} *${report.name}*\n`;
        text += `   ${report.description || 'No description'}\n`;
        text += `   Digunakan: ${report.usage_count}x\n\n`;
      });

      text += '━━━━━━━━━━━━━\n';
      text += '💡 `/report run [nomor]` untuk menjalankan';

      await message.reply(text);
    } catch (error) {
      logger.error('Error listing reports', { error: error.message });
      throw error;
    }
  },

  async createReport(message, user) {
    const text =
      '*📊 BUAT LAPORAN BARU*\n\n' +
      'Format:\n```\n' +
      'Nama Laporan\n' +
      'Jenis (standard/trend/comparison/summary)\n' +
      'Periode (7d/30d/month/custom)\n' +
      'Filter (type:paket,jajan / category:ID)\n```\n\n' +
      'Contoh:\n```\nLaporan Bulanan\nstandard\nmonth\ntype:paket,utang\n```';

    await message.reply(text);

    const sessionManager = require('../../utils/sessionManager');
    await sessionManager.setState(user.phone_number, 'AWAITING_REPORT_CREATE');
  },

  async processReportCreation(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 2) {
        await message.reply('❌ Format tidak lengkap');
        return;
      }

      const name = lines[0].trim();
      const reportType = lines[1].trim().toLowerCase();
      const period = lines[2] ? lines[2].trim() : '30d';
      const filterStr = lines[3] ? lines[3].trim() : '';

      // Build config
      const config = { filters: this._parsePeriod(period), report_type: reportType };

      // Parse additional filters
      if (filterStr) {
        const parts = filterStr.split('/');
        parts.forEach((part) => {
          const [key, value] = part.split(':');
          if (key === 'type') config.filters.type = value.split(',');
          if (key === 'category') config.filters.categoryId = parseInt(value);
        });
      }

      const report = await reportBuilderService.createReport(
        { name, config, report_type: reportType },
        user.id
      );

      await message.reply(
        `✅ Laporan "${report.name}" berhasil dibuat!\n\nJalankan: \`/report run 1\``
      );
    } catch (error) {
      await message.reply(`❌ Gagal: ${error.message}`);
    }
  },

  async runReport(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/report run [nomor]`');
        return;
      }

      const index = parseInt(args[0]) - 1;
      const reports = await reportBuilderService.getUserReports(user.id);

      if (index < 0 || index >= reports.length) {
        await message.reply('❌ Laporan tidak ditemukan');
        return;
      }

      await message.reply('⏳ Menjalankan laporan...');

      const result = await reportBuilderService.executeReport(reports[index].id, user.id);
      const text = this._formatReportResult(result);

      await message.reply(text);
    } catch (error) {
      await message.reply(`❌ Gagal: ${error.message}`);
    }
  },

  async quickReport(message, user, args) {
    try {
      const period = args[0] || '7d';
      const filters = this._parsePeriod(period);

      await message.reply('⏳ Membuat laporan...');

      const result = await reportBuilderService.executeAdHocReport(
        { filters, report_type: 'summary' },
        user.id
      );

      const text = this._formatReportResult(result);
      await message.reply(text);
    } catch (error) {
      await message.reply(`❌ Gagal: ${error.message}`);
    }
  },

  async exportReport(client, message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/report export [nomor] [excel|csv]`');
        return;
      }

      const index = parseInt(args[0]) - 1;
      const format = args[1] || 'excel';
      const reports = await reportBuilderService.getUserReports(user.id);

      if (index < 0 || index >= reports.length) {
        await message.reply('❌ Laporan tidak ditemukan');
        return;
      }

      await message.reply('⏳ Mengexport laporan...');

      const result = await reportBuilderService.executeReport(reports[index].id, user.id);
      const reportExporter = require('../../utils/reportExporter');
      const exported = await reportExporter.export(result, format);

      const { MessageMedia } = require('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(exported.filepath);

      await client.sendMessage(message.from, media, {
        caption: `📊 Export: ${reports[index].name}`,
      });
    } catch (error) {
      await message.reply(`❌ Gagal export: ${error.message}`);
    }
  },

  async showTemplates(message, user) {
    try {
      const templates = await reportBuilderService.getPublicTemplates();

      if (templates.length === 0) {
        await message.reply('📋 Belum ada template tersedia');
        return;
      }

      let text = '*📋 TEMPLATE LAPORAN*\n\n';
      templates.forEach((t, i) => {
        text += `${i + 1}. *${t.name}*\n   ${t.description || '-'}\n\n`;
      });

      await message.reply(text);
    } catch (error) {
      throw error;
    }
  },

  async manageSchedule(message, user, args) {
    await message.reply(
      '*📅 JADWAL LAPORAN*\n\n' +
        'Fitur jadwal otomatis akan segera tersedia.\n\n' +
        'Sementara gunakan `/report run` untuk menjalankan manual.'
    );
  },

  _getReportTypeEmoji(type) {
    const emojis = { standard: '📋', trend: '📈', comparison: '🔄', summary: '📊' };
    return emojis[type] || '📋';
  },

  _parsePeriod(period) {
    const dayjs = require('dayjs');
    const now = dayjs();
    let startDate,
      endDate = now.format('YYYY-MM-DD');

    switch (period) {
      case '7d':
        startDate = now.subtract(7, 'day').format('YYYY-MM-DD');
        break;
      case '30d':
        startDate = now.subtract(30, 'day').format('YYYY-MM-DD');
        break;
      case 'month':
        startDate = now.startOf('month').format('YYYY-MM-DD');
        break;
      default:
        startDate = now.subtract(30, 'day').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
  },

  _formatReportResult(result) {
    const s = result.summary;
    let text = '*📊 HASIL LAPORAN*\n\n';
    text += `📈 Total Transaksi: ${s.total_transactions}\n`;
    text += `💵 Pemasukan: ${formatCurrency(s.total_income)}\n`;
    text += `💸 Pengeluaran: ${formatCurrency(s.total_expense)}\n`;
    text += `💰 Net: ${formatCurrency(s.net)}\n\n`;
    text += `⏱️ Waktu: ${result.execution_time_ms}ms`;
    return text;
  },
};
