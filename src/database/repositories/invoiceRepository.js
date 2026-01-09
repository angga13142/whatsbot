/**
 * Invoice Repository
 *
 * Database operations for invoice management
 */

const knex = require('../connection');
const logger = require('../../utils/logger');

class InvoiceRepository {
  /**
   * Create new invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(invoiceData) {
    try {
      const [id] = await knex('invoices').insert({
        ...invoiceData,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const invoice = await this.getInvoiceById(id);

      logger.info('Invoice created', { invoiceId: id, invoiceNumber: invoice.invoice_number });

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice', { error: error.message });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>}
   */
  async getInvoiceById(invoiceId) {
    try {
      const invoice = await knex('invoices')
        .select(
          'invoices.*',
          'customers.customer_name as customer_full_name',
          'customers.customer_type',
          'customers.credit_limit',
          'creator.full_name as created_by_name'
        )
        .leftJoin('customers', 'invoices.customer_id', 'customers.id')
        .leftJoin('users as creator', 'invoices.created_by', 'creator.id')
        .where('invoices.id', invoiceId)
        .whereNull('invoices.deleted_at')
        .first();

      if (invoice && invoice.line_items) {
        invoice.line_items = JSON.parse(invoice.line_items);
      }

      if (invoice && invoice.metadata) {
        invoice.metadata = JSON.parse(invoice.metadata);
      }

      if (invoice && invoice.audit_trail) {
        invoice.audit_trail = JSON.parse(invoice.audit_trail);
      }

      return invoice;
    } catch (error) {
      logger.error('Error getting invoice by ID', { invoiceId, error: error.message });
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
      const invoice = await knex('invoices')
        .where({ invoice_number: invoiceNumber })
        .whereNull('deleted_at')
        .first();

      if (invoice && invoice.line_items) {
        invoice.line_items = JSON.parse(invoice.line_items);
      }

      return invoice;
    } catch (error) {
      logger.error('Error getting invoice by number', { invoiceNumber, error: error.message });
      throw error;
    }
  }

  /**
   * Get all invoices with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getAllInvoices(filters = {}) {
    try {
      let query = knex('invoices')
        .select(
          'invoices.*',
          'customers.customer_name as customer_full_name',
          'customers.customer_type'
        )
        .leftJoin('customers', 'invoices.customer_id', 'customers.id')
        .whereNull('invoices.deleted_at');

      // Apply filters
      if (filters.customer_id) {
        query = query.where('invoices.customer_id', filters.customer_id);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.whereIn('invoices.status', filters.status);
        } else {
          query = query.where('invoices.status', filters.status);
        }
      }

      if (filters.invoice_type) {
        query = query.where('invoices.invoice_type', filters.invoice_type);
      }

      if (filters.startDate && filters.endDate) {
        query = query.whereBetween('invoices.invoice_date', [filters.startDate, filters.endDate]);
      }

      if (filters.dueStartDate && filters.dueEndDate) {
        query = query.whereBetween('invoices.due_date', [filters.dueStartDate, filters.dueEndDate]);
      }

      if (filters.search) {
        query = query.where(function () {
          this.where('invoices.invoice_number', 'like', `%${filters.search}%`).orWhere(
            'invoices.customer_name',
            'like',
            `%${filters.search}%`
          );
        });
      }

      // Get overdue invoices
      if (filters.overdue === true) {
        query = query
          .where('invoices.due_date', '<', new Date())
          .whereIn('invoices.status', ['sent', 'viewed', 'partial']);
      }

      // Sorting
      const sortBy = filters.sortBy || 'invoice_date';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.orderBy(sortBy, sortOrder);

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      const invoices = await query;

      return invoices;
    } catch (error) {
      logger.error('Error getting all invoices', { error: error.message });
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
      let query = knex('invoices').where({ customer_id: customerId }).whereNull('deleted_at');

      if (options.status) {
        query = query.where('status', options.status);
      }

      query = query.orderBy('invoice_date', 'desc');

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const invoices = await query;

      return invoices;
    } catch (error) {
      logger.error('Error getting customer invoices', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Update invoice
   * @param {number} invoiceId - Invoice ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>}
   */
  async updateInvoice(invoiceId, updates) {
    try {
      // Add to audit trail
      const invoice = await this.getInvoiceById(invoiceId);

      if (invoice && updates.status && invoice.status !== updates.status) {
        const auditTrail = invoice.audit_trail || [];
        auditTrail.push({
          timestamp: new Date(),
          from_status: invoice.status,
          to_status: updates.status,
          changed_by: updates.updated_by || null,
        });
        updates.audit_trail = JSON.stringify(auditTrail);
      }

      await knex('invoices')
        .where({ id: invoiceId })
        .update({
          ...updates,
          updated_at: new Date(),
        });

      const updatedInvoice = await this.getInvoiceById(invoiceId);

      logger.info('Invoice updated', { invoiceId });

      return updatedInvoice;
    } catch (error) {
      logger.error('Error updating invoice', { invoiceId, error: error.message });
      throw error;
    }
  }

  /**
   * Update invoice status
   * @param {number} invoiceId - Invoice ID
   * @param {string} status - New status
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>}
   */
  async updateInvoiceStatus(invoiceId, status, metadata = {}) {
    try {
      const updates = {
        status,
        ...metadata,
      };

      // Set specific timestamps based on status
      if (status === 'sent' && !metadata.sent_at) {
        updates.sent_at = new Date();
      }

      if (status === 'viewed' && !metadata.viewed_at) {
        updates.viewed_at = new Date();
      }

      if (status === 'paid' && !metadata.paid_date) {
        updates.paid_date = new Date();
        updates.outstanding_amount = 0;
      }

      return await this.updateInvoice(invoiceId, updates);
    } catch (error) {
      logger.error('Error updating invoice status', { invoiceId, status, error: error.message });
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
      const invoice = await this.getInvoiceById(invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
      const newOutstanding = parseFloat(invoice.total_amount) - newPaidAmount;

      let newStatus = invoice.status;

      if (newOutstanding <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      const updates = {
        paid_amount: newPaidAmount,
        outstanding_amount: Math.max(0, newOutstanding),
        status: newStatus,
        payment_method: paymentInfo.payment_method || invoice.payment_method,
        payment_reference: paymentInfo.payment_reference || invoice.payment_reference,
        payment_notes: paymentInfo.payment_notes || invoice.payment_notes,
      };

      if (newStatus === 'paid') {
        updates.paid_date = new Date();
      }

      return await this.updateInvoice(invoiceId, updates);
    } catch (error) {
      logger.error('Error recording payment', { invoiceId, amount, error: error.message });
      throw error;
    }
  }

  /**
   * Generate next invoice number
   * @param {string} invoiceType - Invoice type
   * @returns {Promise<string>}
   */
  async generateInvoiceNumber(invoiceType = 'standard') {
    try {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

      // Get last invoice for this year/month
      const lastInvoice = await knex('invoices')
        .where('invoice_number', 'like', `INV-${year}${month}-%`)
        .orderBy('id', 'desc')
        .first();

      let nextNumber = 1;

      if (lastInvoice && lastInvoice.invoice_number) {
        const match = lastInvoice.invoice_number.match(/INV-\d{6}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `INV-${year}${month}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating invoice number', { error: error.message });
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
      let query = knex('invoices').whereNull('deleted_at');

      if (filters.customer_id) {
        query = query.where('customer_id', filters.customer_id);
      }

      if (filters.startDate && filters.endDate) {
        query = query.whereBetween('invoice_date', [filters.startDate, filters.endDate]);
      }

      const stats = await query
        .select(
          knex.raw('COUNT(*) as total_invoices'),
          knex.raw('SUM(CASE WHEN status = "draft" THEN 1 ELSE 0 END) as draft_count'),
          knex.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent_count'),
          knex.raw('SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid_count'),
          knex.raw('SUM(CASE WHEN status = "overdue" THEN 1 ELSE 0 END) as overdue_count'),
          knex.raw('SUM(total_amount) as total_invoiced'),
          knex.raw('SUM(paid_amount) as total_paid'),
          knex.raw('SUM(outstanding_amount) as total_outstanding'),
          knex.raw('AVG(total_amount) as avg_invoice_amount')
        )
        .first();

      return {
        total_invoices: stats.total_invoices || 0,
        by_status: {
          draft: stats.draft_count || 0,
          sent: stats.sent_count || 0,
          paid: stats.paid_count || 0,
          overdue: stats.overdue_count || 0,
        },
        amounts: {
          total_invoiced: parseFloat(stats.total_invoiced || 0),
          total_paid: parseFloat(stats.total_paid || 0),
          total_outstanding: parseFloat(stats.total_outstanding || 0),
          avg_invoice_amount: parseFloat(stats.avg_invoice_amount || 0),
        },
      };
    } catch (error) {
      logger.error('Error getting invoice statistics', { error: error.message });
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
      const invoice = await this.getInvoiceById(invoiceId);

      const updates = {
        view_count: (invoice.view_count || 0) + 1,
      };

      if (!invoice.viewed_at) {
        updates.viewed_at = new Date();
        if (invoice.status === 'sent') {
          updates.status = 'viewed';
        }
      }

      return await this.updateInvoice(invoiceId, updates);
    } catch (error) {
      logger.error('Error marking invoice as viewed', { invoiceId, error: error.message });
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
      let query = knex('invoices')
        .select(
          'invoices.*',
          'customers.customer_name as customer_full_name',
          'customers.whatsapp_number',
          'customers.email'
        )
        .leftJoin('customers', 'invoices.customer_id', 'customers.id')
        .where('invoices.due_date', '<', new Date())
        .whereIn('invoices.status', ['sent', 'viewed', 'partial'])
        .whereNull('invoices.deleted_at');

      if (filters.customer_id) {
        query = query.where('invoices.customer_id', filters.customer_id);
      }

      const invoices = await query.orderBy('invoices.due_date', 'asc');

      return invoices;
    } catch (error) {
      logger.error('Error getting overdue invoices', { error: error.message });
      throw error;
    }
  }

  /**
   * Soft delete invoice
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<boolean>}
   */
  async deleteInvoice(invoiceId) {
    try {
      await knex('invoices').where({ id: invoiceId }).update({
        deleted_at: new Date(),
        status: 'void',
      });

      logger.info('Invoice deleted (soft)', { invoiceId });

      return true;
    } catch (error) {
      logger.error('Error deleting invoice', { invoiceId, error: error.message });
      throw error;
    }
  }
}

module.exports = new InvoiceRepository();
