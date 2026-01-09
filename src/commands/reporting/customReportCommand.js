const reportBuilderService = require('../../services/reportBuilderService');
const customReportRepository = require('../../database/repositories/customReportRepository');
const authorizationMiddleware = require('../../middleware/authorizationMiddleware');
const logger = require('../../utils/logger');
const { createBox, bold } = require('../../utils/richText');

module.exports = {
  name: 'report',
  description: 'Manage custom reports',
  usage: '/report [create|list|execute|delete] [args]',
  aliases: ['laporan'],

  async handler(client, message, user, args) {
    if (args.length === 0) {
      await this.showMenu(message);
      return;
    }

    const command = args[0].toLowerCase();
    const subArgs = args.slice(1);

    switch (command) {
      case 'create':
        await this.createReport(message, user, subArgs);
        break;
      case 'list':
        await this.listReports(message, user, subArgs);
        break;
      case 'execute':
      case 'run':
        await this.executeReport(message, user, subArgs);
        break;
      case 'delete':
      case 'del':
        await this.deleteReport(message, user, subArgs);
        break;
      default:
        await message.reply('❌ Unknown command. Use /report list to see available reports.');
    }
  },

  async showMenu(message) {
    const menu = [
      bold('📊 Report Management'),
      '',
      '/report list - List saved reports',
      '/report execute [id] - Run specific report',
      '/report delete [id] - Delete report',
      '/report create - Create new report (follow instructions)',
    ].join('\n');

    await message.reply(createBox(menu));
  },

  async listReports(message, user) {
    try {
      const reports = await customReportRepository.findByUser(user.id);

      if (reports.length === 0) {
        await message.reply('You have no saved reports.');
        return;
      }

      const list = reports
        .map((r) => `• ${bold(r.name)} (ID: ${r.id}) - ${r.report_type}`)
        .join('\n');
      await message.reply(createBox(bold('📂 Your Reports') + '\n\n' + list));
    } catch (error) {
      logger.error('Error listing reports', error);
      await message.reply('❌ Error listing reports.');
    }
  },

  async executeReport(message, user, args) {
    const reportId = parseInt(args[0]);
    if (isNaN(reportId)) {
      await message.reply('❌ Please provide a valid report ID.');
      return;
    }

    try {
      // Check auth
      await authorizationMiddleware.requireReportAccess(user.id, reportId);

      await message.reply('⏳ Executing report...');
      const result = await reportBuilderService.executeReport(reportId, user.id);

      // Simplify result for reporting (in real app, we'd generate a PDF or summary text)
      const summary = result.summary
        ? Object.entries(result.summary)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        : 'No summary available.';

      await message.reply(createBox(bold(`📊 Report: ${result.report.name}`) + '\n\n' + summary));
    } catch (error) {
      logger.error('Error executing report', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  async deleteReport(message, user, args) {
    const reportId = parseInt(args[0]);
    if (isNaN(reportId)) {
      await message.reply('❌ Please provide a valid report ID.');
      return;
    }

    try {
      // Check auth
      await authorizationMiddleware.requireReportAccess(user.id, reportId);

      await customReportRepository.delete(reportId);
      await message.reply('✅ Report deleted successfully.');
    } catch (error) {
      logger.error('Error deleting report', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  async createReport(message, user, args) {
    // Stub for creation flow
    await message.reply(
      '🚧 Report creation is a complex flow currently supported via web interface or JSON input. (Stub)'
    );
  },
};
