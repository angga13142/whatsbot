/**
 * Report Service
 *
 * Business logic for report generation including:
 * - Daily reports
 * - User-specific reports
 * - Investor reports (censored)
 * - Excel/PDF export
 * - Report caching
 */

const transactionService = require('./transactionService');
const userRepository = require('../database/repositories/userRepository');
const logger = require('../utils/logger');
const { formatCurrency, formatDate } = require('../utils/formatter');
const { createTable, createBox, createDivider } = require('../utils/richText');
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');
const config = require('../config/app');

class ReportService {
  constructor() {
    this.reportCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Generate daily report
   * @param {Date} date - Date to generate report for
   * @returns {Promise<Object>} Report data
   */
  async generateDailyReport(date = new Date()) {
    try {
      const cacheKey = `daily-${dayjs(date).format('YYYYMMDD')}`;
      const cached = this.getCachedReport(cacheKey);
      if (cached) {
        return cached;
      }

      const summary = await transactionService.calculateDailySummary(date);

      const report = {
        type: 'daily',
        date: summary.date,
        generated_at: new Date(),
        summary: {
          total_transactions: summary.total_transactions,
          income: summary.income,
          expense: summary.expense,
          net: summary.net,
        },
        by_type: summary.by_type,
        by_user: summary.by_user,
        transactions: summary.transactions,
      };

      this.cacheReport(cacheKey, report);

      logger.info('Daily report generated', { date: summary.date });

      return report;
    } catch (error) {
      logger.error('Error generating daily report', {
        date,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate user report
   * @param {number} userId - User ID
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} Report data
   */
  async generateUserReport(userId, dateRange = {}) {
    try {
      const summary = await transactionService.calculateUserSummary(userId, dateRange);

      const report = {
        type: 'user',
        user_id: userId,
        user_name: summary.user_name,
        period: summary.period,
        generated_at: new Date(),
        summary: {
          total_transactions: summary.total_transactions,
          total_amount: summary.total_amount,
        },
        by_type: summary.by_type,
        transactions: summary.transactions,
      };

      logger.info('User report generated', { userId, period: summary.period });

      return report;
    } catch (error) {
      logger.error('Error generating user report', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate investor report (censored data)
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} Censored report data
   */
  async generateInvestorReport(dateRange = {}) {
    try {
      const startDate = dateRange.startDate || dayjs().startOf('month').toDate();
      const endDate = dateRange.endDate || dayjs().endOf('month').toDate();

      // Get summary for date range
      let totalIncome = 0;
      let totalExpense = 0;
      let transactionCount = 0;

      const currentDate = dayjs(startDate);
      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dailySummary = await transactionService.calculateDailySummary(currentDate.toDate());
        totalIncome += dailySummary.income;
        totalExpense += dailySummary.expense;
        transactionCount += dailySummary.total_transactions;
        currentDate.add(1, 'day');
      }

      const report = {
        type: 'investor',
        period: {
          start: formatDate(startDate, 'DD MMM YYYY'),
          end: formatDate(endDate, 'DD MMM YYYY'),
        },
        generated_at: new Date(),
        summary: {
          total_transactions: transactionCount,
          total_income: totalIncome,
          total_expense: totalExpense,
          net_profit: totalIncome - totalExpense,
        },
        // Note: No user names, no individual transactions
        // Only aggregated totals
      };

      logger.info('Investor report generated', { period: report.period });

      return report;
    } catch (error) {
      logger.error('Error generating investor report', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Format report as rich text
   * @param {Object} reportData - Report data
   * @returns {string} Formatted text
   */
  formatReportText(reportData) {
    let text = '';

    if (reportData.type === 'daily') {
      text += createBox('📊 LAPORAN HARIAN', reportData.date, 50);
      text += '\n\n';
      text += createDivider('━', 50);
      text += '\n';
      text += '📈 *RINGKASAN CASHFLOW*\n\n';
      text += `💵 Pemasukan     : ${formatCurrency(reportData.summary.income)}\n`;
      text += `💸 Pengeluaran   : ${formatCurrency(reportData.summary.expense)}\n`;
      text += createDivider('─', 50);
      text += '\n';
      text += `💰 *Saldo Bersih* : ${formatCurrency(reportData.summary.net)}\n`;
      text += '\n';
      text += createDivider('━', 50);
      text += '\n';
      text += `📊 Total Transaksi:  ${reportData.summary.total_transactions}\n`;
    }

    return text;
  }

  /**
   * Export report to Excel
   * @param {Object} reportData - Report data
   * @returns {Promise<string>} File path
   */
  async exportToExcel(reportData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Add title
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = `LAPORAN ${reportData.type.toUpperCase()}`;
      worksheet.getCell('A1').font = { size: 14, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add headers
      worksheet.addRow([]);
      const headerRow = worksheet.addRow(['No', 'Tanggal', 'Jenis', 'Deskripsi', 'Jumlah']);
      headerRow.font = { bold: true };

      // Add data
      reportData.transactions.forEach((trx, index) => {
        worksheet.addRow([
          index + 1,
          formatDate(trx.transaction_date, 'DD/MM/YYYY HH:mm'),
          trx.type,
          trx.description,
          parseFloat(trx.amount),
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      // Save file
      const fileName = `report-${reportData.type}-${Date.now()}.xlsx`;
      const reportPath = config.business?.reportPath || './storage/reports';

      // Ensure directory exists
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
      }

      const filePath = path.join(reportPath, fileName);

      await workbook.xlsx.writeFile(filePath);

      logger.info('Report exported to Excel', { filePath });

      return filePath;
    } catch (error) {
      logger.error('Error exporting to Excel', { error: error.message });
      throw error;
    }
  }

  /**
   * Export report to PDF
   * @param {Object} reportData - Report data
   * @returns {Promise<string>} File path
   */
  async exportToPDF(reportData) {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();

      const fileName = `report-${reportData.type}-${Date.now()}.pdf`;
      const reportPath = config.business?.reportPath || './storage/reports';

      // Ensure directory exists
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
      }

      const filePath = path.join(reportPath, fileName);

      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(18).text(`Laporan ${reportData.type.toUpperCase()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${formatDate(new Date(), 'DD MMMM YYYY HH:mm')}`);

      doc.end();

      logger.info('Report exported to PDF', { filePath });

      return filePath;
    } catch (error) {
      logger.error('Error exporting to PDF', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cached report
   * @param {string} key - Cache key
   * @returns {Object|null} Cached report or null
   */
  getCachedReport(key) {
    const cached = this.reportCache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.reportCache.delete(key);
      return null;
    }

    logger.debug('Report retrieved from cache', { key });
    return cached.data;
  }

  /**
   * Cache report
   * @param {string} key - Cache key
   * @param {Object} data - Report data
   */
  cacheReport(key, data) {
    this.reportCache.set(key, {
      data,
      timestamp: Date.now(),
    });
    logger.debug('Report cached', { key });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.reportCache.clear();
    logger.info('Report cache cleared');
  }
}

module.exports = new ReportService();
