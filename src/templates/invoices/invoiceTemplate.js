/**
 * Invoice Template
 *
 * Professional invoice PDF template
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatCurrency, formatDate } = require('../../utils/formatter');
const logger = require('../../utils/logger');

class InvoiceTemplate {
  /**
   * Generate invoice PDF
   * @param {Object} invoice - Invoice data
   * @param {Object} options - Generation options
   * @returns {Promise<string>} PDF file path
   */
  async generatePDF(invoice, options = {}) {
    try {
      const outputPath = options.outputPath || './storage/invoices';

      // Ensure output directory exists
      await fs.promises.mkdir(outputPath, { recursive: true });

      const filename = `${invoice.invoice_number}.pdf`;
      const filePath = path.join(outputPath, filename);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const stream = fs.createWriteStream(filePath);

        stream.on('finish', () => {
          logger.info('Invoice PDF generated', {
            invoiceNumber: invoice.invoice_number,
            filePath,
          });
          resolve(filePath);
        });

        stream.on('error', reject);

        doc.pipe(stream);

        // Generate PDF content
        this._generateHeader(doc, invoice);
        this._generateCustomerInfo(doc, invoice);
        this._generateInvoiceInfo(doc, invoice);
        this._generateLineItems(doc, invoice);
        this._generateTotals(doc, invoice);
        this._generatePaymentInstructions(doc, invoice);
        this._generateFooter(doc, invoice);

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating invoice PDF', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate header section
   * @private
   */
  _generateHeader(doc, invoice) {
    // Company name/logo
    doc.fontSize(24).font('Helvetica-Bold').text('YOUR COMPANY NAME', 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Your Company Address', 50, 80)
      .text('City, Province 12345', 50, 95)
      .text('Phone: +62 812-3456-7890', 50, 110)
      .text('Email: info@yourcompany.com', 50, 125);

    // Invoice title
    doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });

    doc.moveDown(3);
  }

  /**
   * Generate customer information
   * @private
   */
  _generateCustomerInfo(doc, invoice) {
    const startY = 180;

    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, startY);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(invoice.customer_name, 50, startY + 20)
      .text(invoice.customer_address || '', 50, startY + 35)
      .text(invoice.customer_phone || '', 50, startY + 50);

    if (invoice.customer_email) {
      doc.text(invoice.customer_email, 50, startY + 65);
    }

    if (invoice.customer_tax_id) {
      doc.text(`Tax ID: ${invoice.customer_tax_id}`, 50, startY + 80);
    }
  }

  /**
   * Generate invoice information
   * @private
   */
  _generateInvoiceInfo(doc, invoice) {
    const startY = 180;
    const rightX = 400;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Invoice Number:', rightX, startY, { width: 100 })
      .font('Helvetica')
      .text(invoice.invoice_number, rightX + 110, startY);

    doc
      .font('Helvetica-Bold')
      .text('Invoice Date:', rightX, startY + 20, { width: 100 })
      .font('Helvetica')
      .text(formatDate(invoice.invoice_date, 'DD MMM YYYY'), rightX + 110, startY + 20);

    doc
      .font('Helvetica-Bold')
      .text('Due Date:', rightX, startY + 40, { width: 100 })
      .font('Helvetica')
      .text(formatDate(invoice.due_date, 'DD MMM YYYY'), rightX + 110, startY + 40);

    doc
      .font('Helvetica-Bold')
      .text('Payment Terms:', rightX, startY + 60, { width: 100 })
      .font('Helvetica')
      .text(`${invoice.payment_term_days} days`, rightX + 110, startY + 60);

    // Status badge
    const statusY = startY + 85;
    const statusColor = this._getStatusColor(invoice.status);

    doc.rect(rightX, statusY, 145, 25).fillAndStroke(statusColor, '#000000').opacity(0.2);

    doc
      .opacity(1)
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(invoice.status.toUpperCase(), rightX, statusY + 7, {
        width: 145,
        align: 'center',
      });

    doc.fillColor('#000000');
  }

  /**
   * Generate line items table
   * @private
   */
  _generateLineItems(doc, invoice) {
    const tableTop = 300;
    const itemX = 50;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 420;
    const amountX = 490;

    // Table header
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('#', itemX, tableTop)
      .text('Description', descriptionX, tableTop)
      .text('Qty', quantityX, tableTop)
      .text('Unit Price', priceX, tableTop)
      .text('Amount', amountX, tableTop);

    // Header line
    doc
      .moveTo(50, tableTop + 18)
      .lineTo(545, tableTop + 18)
      .stroke();

    // Line items
    let y = tableTop + 30;
    const lineItems = JSON.parse(invoice.line_items);

    doc.font('Helvetica').fontSize(10);

    lineItems.forEach((item, index) => {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      doc
        .text(index + 1, itemX, y)
        .text(item.description.substring(0, 40), descriptionX, y, { width: 180 })
        .text(item.quantity.toString(), quantityX, y)
        .text(formatCurrency(item.unit_price), priceX, y)
        .text(formatCurrency(item.amount), amountX, y);

      y += 25;
    });

    // Bottom line
    doc.moveTo(50, y).lineTo(545, y).stroke();

    return y + 10;
  }

  /**
   * Generate totals section
   * @private
   */
  _generateTotals(doc, invoice) {
    const startY = doc.y + 20;
    const labelX = 380;
    const valueX = 490;

    doc.fontSize(11);

    // Subtotal
    doc
      .font('Helvetica')
      .text('Subtotal:', labelX, startY)
      .text(formatCurrency(invoice.subtotal), valueX, startY);

    // Discount
    if (invoice.discount_amount > 0) {
      doc
        .text(`Discount (${invoice.discount_percentage}%):`, labelX, startY + 20)
        .text(`-${formatCurrency(invoice.discount_amount)}`, valueX, startY + 20);
    }

    // Tax
    const taxY = invoice.discount_amount > 0 ? startY + 40 : startY + 20;
    doc
      .text(`Tax (${invoice.tax_percentage}%):`, labelX, taxY)
      .text(formatCurrency(invoice.tax_amount), valueX, taxY);

    // Other charges
    if (invoice.other_charges > 0) {
      doc
        .text('Other Charges:', labelX, taxY + 20)
        .text(formatCurrency(invoice.other_charges), valueX, taxY + 20);
    }

    // Total line
    const totalY = taxY + (invoice.other_charges > 0 ? 35 : 15);
    doc.moveTo(labelX, totalY).lineTo(545, totalY).stroke();

    // Total
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TOTAL:', labelX, totalY + 10)
      .text(formatCurrency(invoice.total_amount), valueX, totalY + 10);

    // Amount paid and outstanding (if partial payment)
    if (invoice.paid_amount > 0) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('Amount Paid:', labelX, totalY + 35)
        .text(formatCurrency(invoice.paid_amount), valueX, totalY + 35);

      doc
        .font('Helvetica-Bold')
        .text('Outstanding:', labelX, totalY + 55)
        .text(formatCurrency(invoice.outstanding_amount), valueX, totalY + 55);
    }

    doc.moveDown(3);
  }

  /**
   * Generate payment instructions
   * @private
   */
  _generatePaymentInstructions(doc, invoice) {
    if (invoice.status === 'paid') {
      return;
    }

    const startY = doc.y + 20;

    doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT INSTRUCTIONS', 50, startY);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Please make payment via bank transfer to:', 50, startY + 20)
      .text('Bank: BCA', 50, startY + 40)
      .text('Account Number: 1234567890', 50, startY + 55)
      .text('Account Name: Your Company Name', 50, startY + 70)
      .text(`Reference: ${invoice.invoice_number}`, 50, startY + 85);

    doc.fontSize(9).text('* Please include invoice number in payment reference', 50, startY + 105);
  }

  /**
   * Generate footer
   * @private
   */
  _generateFooter(doc, invoice) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Footer line
      doc
        .moveTo(50, doc.page.height - 100)
        .lineTo(545, doc.page.height - 100)
        .stroke();

      // Notes/Terms
      if (invoice.notes) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text('Notes: ' + invoice.notes, 50, doc.page.height - 90, {
            width: 495,
          });
      }

      // Footer text
      doc
        .fontSize(8)
        .text(invoice.footer_text || 'Thank you for your business!', 50, doc.page.height - 50, {
          align: 'center',
          width: 495,
        });

      // Page number
      doc.fontSize(8).text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 30, {
        align: 'center',
        width: 495,
      });
    }
  }

  /**
   * Get status color
   * @private
   */
  _getStatusColor(status) {
    const colorMap = {
      draft: '#9CA3AF',
      sent: '#3B82F6',
      viewed: '#8B5CF6',
      partial: '#F59E0B',
      paid: '#10B981',
      overdue: '#EF4444',
      cancelled: '#6B7280',
      void: '#000000',
    };
    return colorMap[status] || '#9CA3AF';
  }
}

module.exports = new InvoiceTemplate();
