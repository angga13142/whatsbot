// File: src/commands/bos/laporanBosCommand.js

const reportService = require('../../services/reportService');
const { dailyReportSummary } = require('../../templates/messages/reportTemplate');

module.exports = {
  name: 'laporan_bos', // Alias /laporan for admin
  async execute(message) {
    const data = await reportService.generateDailyReport();
    await message.reply(dailyReportSummary(data));
  },
};
