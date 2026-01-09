/**
 * Laporan Command (Karyawan)
 *
 * Show today's transaction summary for the user
 */

const reportService = require('../../services/reportService');
const reportTemplate = require('../../templates/messages/reportTemplate');
const logger = require('../../utils/logger');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Generate user report for today
      const report = await reportService.generateUserReport(user.id);

      // Format as text
      const reportText = reportTemplate.userReportSummary(user, report);

      await message.reply(reportText);

      logger.info('User report command executed', {
        userId: user.id,
        transactionCount: report.summary.total_transactions,
      });
    } catch (error) {
      logger.error('Error in laporan command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('Terjadi kesalahan saat membuat laporan.  Silakan coba lagi.');
    }
  },
};
