/**
 * PDF Generator Utility
 *
 * Generate professional PDF reports
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatCurrency, formatDate } = require('./formatter');
const logger = require('./logger');

class PDFGenerator {
  constructor() {
    this.outputPath = process.env.PDF_OUTPUT_PATH || './storage/pdfs';
    this._ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   * @private
   */
  async _ensureOutputDirectory() {
    try {
      await fs.promises.mkdir(this.outputPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating PDF output directory', { error: error.message });
    }
  }

  /**
   * Generate PDF report
   * @param {Object} reportData - Report data
   * @param {Object} options - PDF options
   * @returns {Promise<string>} PDF file path
   */
  async generatePDF(reportData, options = {}) {
    try {
      const filename = `report-${Date.now()}.pdf`;
      const filePath = path.join(this.outputPath, filename);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
          bufferPages: true,
        });

        const stream = fs.createWriteStream(filePath);

        stream.on('finish', () => {
          logger.info('PDF generated', { filePath });
          resolve(filePath);
        });

        stream.on('error', reject);

        doc.pipe(stream);

        // Generate PDF content
        this._generateCoverPage(doc, options.title || 'Financial Report');
        this._generateSummaryPage(doc, reportData.summary);

        if (reportData.groupedData) {
          this._generateDetailPage(doc, reportData.groupedData);
        }

        if (reportData.trendData) {
          this._generateTrendPage(doc, reportData.trendData);
        }

        this._generateFooter(doc);

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating PDF', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate cover page
   * @private
   */
  _generateCoverPage(doc, title) {
    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .text(title, {
        align: 'center',
      })
      .moveDown(2);

    doc
      .fontSize(16)
      .font('Helvetica')
      .text('Cashflow Report', {
        align: 'center',
      })
      .moveDown();

    doc.fontSize(12).text(formatDate(new Date(), 'DD MMMM YYYY'), {
      align: 'center',
    });

    doc.addPage();
  }

  /**
   * Generate summary page
   * @private
   */
  _generateSummaryPage(doc, summary) {
    doc.fontSize(20).font('Helvetica-Bold').text('Executive Summary').moveDown();

    // Draw summary boxes
    const boxY = doc.y;
    const boxWidth = 220;
    const boxHeight = 80;
    const spacing = 20;

    // Income box
    this._drawSummaryBox(doc, 50, boxY, boxWidth, boxHeight, {
      label: 'Total Income',
      value: formatCurrency(summary.total_income),
      color: '#10B981',
    });

    // Expense box
    this._drawSummaryBox(doc, 50 + boxWidth + spacing, boxY, boxWidth, boxHeight, {
      label: 'Total Expense',
      value: formatCurrency(summary.total_expense),
      color: '#EF4444',
    });

    doc.y = boxY + boxHeight + spacing * 2;

    // Net box
    this._drawSummaryBox(doc, 50, doc.y, boxWidth, boxHeight, {
      label: 'Net Cashflow',
      value: formatCurrency(summary.net),
      color: summary.net >= 0 ? '#3B82F6' : '#EF4444',
    });

    // Transactions box
    this._drawSummaryBox(doc, 50 + boxWidth + spacing, doc.y, boxWidth, boxHeight, {
      label: 'Total Transactions',
      value: summary.total_transactions.toString(),
      color: '#8B5CF6',
    });

    doc.y += boxHeight + spacing * 2;

    // Key metrics
    doc.fontSize(14).font('Helvetica-Bold').text('Key Metrics').moveDown();

    doc.fontSize(10).font('Helvetica');

    const profitMargin =
      summary.total_income > 0 ? ((summary.net / summary.total_income) * 100).toFixed(2) : 0;

    doc
      .text(`Profit Margin: ${profitMargin}%`)
      .text(`Average Transaction: ${formatCurrency(summary.avg_amount)}`)
      .text(`Largest Transaction: ${formatCurrency(summary.max_amount)}`)
      .text(`Smallest Transaction: ${formatCurrency(summary.min_amount)}`);

    doc.addPage();
  }

  /**
   * Generate detail page
   * @private
   */
  _generateDetailPage(doc, groupedData) {
    doc.fontSize(20).font('Helvetica-Bold').text('Detailed Breakdown').moveDown();

    doc.fontSize(12).font('Helvetica');

    // Table headers
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 300;
    const col3X = 450;

    doc
      .font('Helvetica-Bold')
      .text('Category', col1X, tableTop)
      .text('Transactions', col2X, tableTop)
      .text('Total', col3X, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica');

    let y = tableTop + 25;

    groupedData.slice(0, 15).forEach((item) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const name = item.category_name || item.type || 'Unknown';
      const count = item.count;
      const total = formatCurrency(item.total);

      doc.text(name, col1X, y).text(count.toString(), col2X, y).text(total, col3X, y);

      y += 20;
    });
  }

  /**
   * Generate trend page
   * @private
   */
  _generateTrendPage(doc, trendData) {
    doc.addPage();

    doc.fontSize(20).font('Helvetica-Bold').text('Trend Analysis').moveDown();

    doc.fontSize(10).font('Helvetica');

    trendData.slice(-14).forEach((item) => {
      const income = parseFloat(item.income || 0);
      const expense = parseFloat(item.expense || 0);
      const net = income - expense;

      doc.text(
        `${item.period}: Net ${formatCurrency(net)} (Income: ${formatCurrency(income)}, Expense: ${formatCurrency(expense)})`
      );
    });
  }

  /**
   * Generate footer
   * @private
   */
  _generateFooter(doc) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Page ${i + 1} of ${pages.count} | Generated by Cashflow Bot | ${formatDate(new Date(), 'DD/MM/YYYY HH:mm')}`,
          50,
          doc.page.height - 50,
          {
            align: 'center',
            lineBreak: false,
          }
        );
    }
  }

  /**
   * Draw summary box
   * @private
   */
  _drawSummaryBox(doc, x, y, width, height, data) {
    // Draw box
    doc.rect(x, y, width, height).fillAndStroke(data.color, '#000000').opacity(0.1);

    // Reset opacity
    doc.opacity(1);

    // Draw text
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(data.label, x + 10, y + 10);

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(data.value, x + 10, y + 35);
  }

  /**
   * Clean old PDFs
   * @param {number} daysOld - Delete files older than X days
   * @returns {Promise<number>}
   */
  async cleanOldPDFs(daysOld = 7) {
    try {
      const files = await fs.promises.readdir(this.outputPath);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.outputPath, file);
        const stats = await fs.promises.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info('Old PDF files cleaned', { deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning old PDFs', { error: error.message });
      return 0;
    }
  }
}

module.exports = new PDFGenerator();
