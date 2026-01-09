// File: src/commands/karyawan/laporanCommand.js

const reportService = require('../../services/reportService');
const { dailyReportSummary } = require('../../templates/messages/reportTemplate');

module.exports = {
  name: 'laporan',
  description: 'Laporan harian',
  async execute(message) {
    const data = await reportService.generateDailyReport();
    await message.reply(dailyReportSummary(data));
  },
};
