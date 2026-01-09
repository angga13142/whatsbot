/**
 * Invoice Service
 *
 * Business logic for invoice management
 */

const invoiceRepository = require('../database/repositories/invoiceRepository');
const customerRepository = require('../database/repositories/customerRepository');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class InvoiceService {
  /**
   * Create invoice from transactions
   * @param {number} customerId - Customer ID
   * @param {Array} transactionIds - Array of transaction IDs
   * @param {Object} options - Invoice options
   * @param {number} createdBy - User ID creating the invoice
   * @returns {Promise<Object>}
   */
  async createInvoice(customerId, transactionIds, options = {}, createdBy) {
    try {
      // Get customer
      const customer = await customerRepository.getCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get transactions
      const knex = require('../database/connection');
      const transactions = await knex('transactions')
        .whereIn('id', transactionIds)
        .where({ customer_id: customerId, status: 'approved' });

      if (transactions.length === 0) {
        throw new Error('No valid transactions found');
      }

      // Calculate totals
      const lineItems = transactions.map((t) => ({
        transaction_id: t.id,
        description: t.description,
        quantity: 1,
        unit_price: parseFloat(t.amount),
        amount: parseFloat(t.amount),
        transaction_date: t.transaction_date,
      }));

      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

      // Apply discount
      const discountPercentage = options.discount_percentage || customer.discount_percentage || 0;
      const discountAmount = (subtotal * discountPercentage) / 100;

      // Calculate tax
      const taxPercentage = options.tax_percentage || 11; // PPN 11%
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * taxPercentage) / 100;

      // Total
      const totalAmount = taxableAmount + taxAmount + (options.other_charges || 0);

      // Generate invoice number
      const invoiceNumber = await invoiceRepository.generateInvoiceNumber();

      // Prepare invoice data
      const invoiceData = {
        invoice_number: invoiceNumber,
        invoice_type: options.invoice_type || 'standard',
        customer_id: customerId,
        customer_name: customer.customer_name,
        customer_address: customer.address,
        customer_email: customer.email,
        customer_phone: customer.phone_number,
        customer_tax_id: customer.tax_id,
        invoice_date: options.invoice_date || new Date(),
        due_date:
          options.due_date ||
          dayjs()
            .add(customer.payment_term_days || 30, 'day')
            .toDate(),
        payment_term_days: customer.payment_term_days || 30,
        subtotal,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
        tax_amount: taxAmount,
        tax_percentage: taxPercentage,
        other_charges: options.other_charges || 0,
        total_amount: totalAmount,
        outstanding_amount: totalAmount,
        paid_amount: 0,
        currency: options.currency || 'IDR',
        exchange_rate: options.exchange_rate || 1,
        total_amount_idr: totalAmount,
        status: options.status || 'draft',
        line_items: JSON.stringify(lineItems),
        notes: options.notes || null,
        terms_and_conditions: options.terms || this._getDefaultTerms(),
        footer_text: options.footer || 'Thank you for your business!',
        created_by: createdBy,
      };

      // Create invoice
      const invoice = await invoiceRepository.createInvoice(invoiceData);

      // Update customer balance
      await customerRepository.updateCustomerBalance(customerId, totalAmount);

      logger.info('Invoice created via service', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerId,
        amount: totalAmount,
      });

      return invoice;
    } catch (error) {
      logger.error('Error in createInvoice service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>}
   */
  async getInvoice(invoiceId) {
    try {
      const invoice = await invoiceRepository.getInvoiceById(invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      logger.error('Error in getInvoice service', { invoiceId, error: error.message });
      throw error;
    }
  }

  /**
   * Get invoice by number
   * @param {string} invoiceNumber - Invoice number
   * @returns {Promise<Object>}
   */
  async getInvoiceByNumber(invoiceNumber) {
    try {
      const invoice = await invoiceRepository.getInvoiceByNumber(invoiceNumber);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      logger.error('Error in getInvoiceByNumber service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer invoices
   * @param {number} customerId - Customer ID
   * @param {Object} options - Options
   * @returns {Promise<Array>}
   */
  async getCustomerInvoices(customerId, options = {}) {
    try {
      const invoices = await invoiceRepository.getCustomerInvoices(customerId, options);
      return invoices;
    } catch (error) {
      logger.error('Error in getCustomerInvoices service', { error: error.message });
      throw error;
    }
  }

  /**
   * Send invoice to customer
   * @param {number} invoiceId - Invoice ID
   * @param {Object} options - Send options
   * @returns {Promise<Object>}
   */
  async sendInvoice(invoiceId, options = {}) {
    try {
      const invoice = await this.getInvoice(invoiceId);

      // Update status to sent
      const updates = {
        status: 'sent',
        sent_at: new Date(),
      };

      if (options.via_email) {
        updates.sent_via_email = true;
        updates.email_sent_at = new Date();
      }

      if (options.via_whatsapp) {
        updates.sent_via_whatsapp = true;
        updates.whatsapp_sent_at = new Date();
      }

      await invoiceRepository.updateInvoice(invoiceId, updates);

      // Send notification
      const notificationService = require('./notificationService');
      await notificationService.sendInvoiceNotification(invoice);

      logger.info('Invoice sent', { invoiceId, invoiceNumber: invoice.invoice_number });

      return await this.getInvoice(invoiceId);
    } catch (error) {
      logger.error('Error in sendInvoice service', { invoiceId, error: error.message });
      throw error;
    }
  }

  /**
   * Record payment on invoice
   * @param {number} invoiceId - Invoice ID
   * @param {number} amount - Payment amount
   * @param {Object} paymentInfo - Payment information
   * @returns {Promise<Object>}
   */
  async recordPayment(invoiceId, amount, paymentInfo = {}) {
    try {
      const invoice = await this.getInvoice(invoiceId);

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      if (amount > invoice.outstanding_amount) {
        throw new Error('Payment amount exceeds outstanding amount');
      }

      // Record payment
      const updatedInvoice = await invoiceRepository.recordPayment(invoiceId, amount, paymentInfo);

      // Update customer balance
      await customerRepository.updateCustomerBalance(invoice.customer_id, -amount);

      // Send notification
      const notificationService = require('./notificationService');
      await notificationService.sendPaymentReceivedNotification(updatedInvoice, amount);

      logger.info('Payment recorded', {
        invoiceId,
        amount,
        newStatus: updatedInvoice.status,
      });

      return updatedInvoice;
    } catch (error) {
      logger.error('Error in recordPayment service', { invoiceId, error: error.message });
      throw error;
    }
  }

  /**
   * Mark invoice as viewed
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>}
   */
  async markAsViewed(invoiceId) {
    try {
      const invoice = await invoiceRepository.markAsViewed(invoiceId);
      logger.info('Invoice viewed', { invoiceId });
      return invoice;
    } catch (error) {
      logger.error('Error in markAsViewed service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get overdue invoices
   * @param {Object} filters - Filters
   * @returns {Promise<Array>}
   */
  async getOverdueInvoices(filters = {}) {
    try {
      const invoices = await invoiceRepository.getOverdueInvoices(filters);

      // Calculate days overdue for each
      invoices.forEach((invoice) => {
        invoice.days_overdue = dayjs().diff(dayjs(invoice.due_date), 'day');
      });

      return invoices;
    } catch (error) {
      logger.error('Error in getOverdueInvoices service', { error: error.message });
      throw error;
    }
  }

  /**
   * Send payment reminders for overdue invoices
   * @returns {Promise<Object>}
   */
  async sendPaymentReminders() {
    try {
      const overdueInvoices = await this.getOverdueInvoices();

      const results = {
        total: overdueInvoices.length,
        sent: 0,
        failed: 0,
        errors: [],
      };

      const notificationService = require('./notificationService');

      for (const invoice of overdueInvoices) {
        try {
          await notificationService.sendPaymentReminderNotification(invoice);

          // Update reminder count
          await invoiceRepository.updateInvoice(invoice.id, {
            reminder_count: (invoice.reminder_count || 0) + 1,
            last_reminder_at: new Date(),
          });

          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            invoiceId: invoice.id,
            error: error.message,
          });
        }
      }

      logger.info('Payment reminders sent', results);

      return results;
    } catch (error) {
      logger.error('Error in sendPaymentReminders service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get invoice statistics
   * @param {Object} filters - Filters
   * @returns {Promise<Object>}
   */
  async getInvoiceStatistics(filters = {}) {
    try {
      const stats = await invoiceRepository.getInvoiceStatistics(filters);
      return stats;
    } catch (error) {
      logger.error('Error in getInvoiceStatistics service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get default terms and conditions
   * @private
   */
  _getDefaultTerms() {
    return `
Payment Terms:
1. Payment is due within the specified payment term.
2. Late payments may incur additional charges.
3. All prices are in Indonesian Rupiah (IDR) unless otherwise stated.
4. Please include invoice number in payment reference.

Bank Transfer Details:
Bank: BCA
Account Number: 1234567890
Account Name: Your Company Name

For questions regarding this invoice, please contact us.
    `.trim();
  }
}

module.exports = new InvoiceService();
