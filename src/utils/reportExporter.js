/**
 * Report Exporter Utility
 *
 * Export reports to various formats (Excel, CSV, JSON)
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { formatCurrency, formatDate } = require('./formatter');

const EXPORT_DIR = process.env.EXPORT_STORAGE_PATH || './storage/exports';

module.exports = {
  /**
   * Export report to specified format
   */
  async export(reportResult, format, options = {}) {
    try {
      await fs.mkdir(EXPORT_DIR, { recursive: true });

      const timestamp = Date.now();
      const filename = options.filename || `report-${timestamp}`;

      let result;
      switch (format.toLowerCase()) {
        case 'excel':
        case 'xlsx':
          result = await this._exportToExcel(reportResult, filename);
          break;
        case 'csv':
          result = await this._exportToCSV(reportResult, filename);
          break;
        case 'json':
          result = await this._exportToJSON(reportResult, filename);
          break;
        default:
          throw new Error(`Format export tidak didukung: ${format}`);
      }

      logger.info('Report exported', { format, filename: result.filename });
      return result;
    } catch (error) {
      logger.error('Error exporting report', { format, error: error.message });
      throw error;
    }
  },

  /**
   * Export to Excel
   */
  async _exportToExcel(reportResult, filename) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Cashflow Bot';
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    this._addSummarySheet(summarySheet, reportResult.summary);

    // Data Sheet
    if (reportResult.data && Array.isArray(reportResult.data)) {
      const dataSheet = workbook.addWorksheet('Data');
      this._addDataSheet(dataSheet, reportResult.data);
    }

    const filepath = path.join(EXPORT_DIR, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filepath);

    return {
      filename: `${filename}.xlsx`,
      filepath,
      format: 'xlsx',
      size: (await fs.stat(filepath)).size,
    };
  },

  _addSummarySheet(sheet, summary) {
    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    const rows = [
      { metric: 'Total Transaksi', value: summary.total_transactions },
      { metric: 'Total Pemasukan', value: formatCurrency(summary.total_income) },
      { metric: 'Total Pengeluaran', value: formatCurrency(summary.total_expense) },
      { metric: 'Net', value: formatCurrency(summary.net) },
    ];
    rows.forEach((row) => sheet.addRow(row));
  },

  _addDataSheet(sheet, data) {
    if (data.length === 0) return;

    sheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Jenis', key: 'type', width: 12 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Jumlah', key: 'amount', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };

    data.forEach((item) => {
      sheet.addRow({
        date: formatDate(item.transaction_date, 'DD/MM/YYYY'),
        type: item.type,
        description: item.description,
        amount: parseFloat(item.amount),
      });
    });
  },

  /**
   * Export to CSV
   */
  async _exportToCSV(reportResult, filename) {
    const data = reportResult.data || [];
    if (data.length === 0) throw new Error('Tidak ada data untuk diexport');

    const headers = ['Tanggal', 'Jenis', 'Deskripsi', 'Jumlah'];
    let csvContent = headers.join(',') + '\n';

    data.forEach((item) => {
      const row = [
        formatDate(item.transaction_date, 'YYYY-MM-DD'),
        item.type,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.amount,
      ];
      csvContent += row.join(',') + '\n';
    });

    const filepath = path.join(EXPORT_DIR, `${filename}.csv`);
    await fs.writeFile(filepath, csvContent, 'utf8');

    return {
      filename: `${filename}.csv`,
      filepath,
      format: 'csv',
      size: (await fs.stat(filepath)).size,
    };
  },

  /**
   * Export to JSON
   */
  async _exportToJSON(reportResult, filename) {
    const filepath = path.join(EXPORT_DIR, `${filename}.json`);
    await fs.writeFile(filepath, JSON.stringify(reportResult, null, 2), 'utf8');

    return {
      filename: `${filename}.json`,
      filepath,
      format: 'json',
      size: (await fs.stat(filepath)).size,
    };
  },

  /**
   * Cleanup old exports
   */
  async cleanupOldExports(daysOld = 7) {
    try {
      const files = await fs.readdir(EXPORT_DIR);
      const maxAge = daysOld * 24 * 60 * 60 * 1000;
      let deleted = 0;

      for (const file of files) {
        const filepath = path.join(EXPORT_DIR, file);
        const stats = await fs.stat(filepath);
        if (Date.now() - stats.mtimeMs > maxAge) {
          await fs.unlink(filepath);
          deleted++;
        }
      }
      return deleted;
    } catch (error) {
      return 0;
    }
  },
};
