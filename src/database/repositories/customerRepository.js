/**
 * Customer Repository
 *
 * Database operations for customer management
 */

const knex = require('../connection');
const logger = require('../../utils/logger');

class CustomerRepository {
  /**
   * Create new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      const [id] = await knex('customers').insert({
        ...customerData,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const customer = await this.getCustomerById(id);

      logger.info('Customer created', { customerId: id, customerCode: customer.customer_code });

      return customer;
    } catch (error) {
      logger.error('Error creating customer', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer by ID
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomerById(customerId) {
    try {
      const customer = await knex('customers')
        .where({ id: customerId })
        .whereNull('deleted_at')
        .first();

      return customer;
    } catch (error) {
      logger.error('Error getting customer by ID', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer by code
   * @param {string} customerCode - Customer code
   * @returns {Promise<Object>}
   */
  async getCustomerByCode(customerCode) {
    try {
      const customer = await knex('customers')
        .where({ customer_code: customerCode })
        .whereNull('deleted_at')
        .first();

      return customer;
    } catch (error) {
      logger.error('Error getting customer by code', { customerCode, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer by phone or WhatsApp
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object>}
   */
  async getCustomerByPhone(phoneNumber) {
    try {
      const customer = await knex('customers')
        .where({ phone_number: phoneNumber })
        .orWhere({ whatsapp_number: phoneNumber })
        .whereNull('deleted_at')
        .first();

      return customer;
    } catch (error) {
      logger.error('Error getting customer by phone', { phoneNumber, error: error.message });
      throw error;
    }
  }

  /**
   * Get all customers with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getAllCustomers(filters = {}) {
    try {
      let query = knex('customers')
        .select('customers.*')
        .leftJoin('users as creator', 'customers.created_by', 'creator.id')
        .leftJoin('users as manager', 'customers.assigned_to', 'manager.id')
        .select('creator.full_name as created_by_name', 'manager.full_name as assigned_to_name')
        .whereNull('customers.deleted_at');

      // Apply filters
      if (filters.status) {
        query = query.where('customers.status', filters.status);
      }

      if (filters.customer_type) {
        query = query.where('customers.customer_type', filters.customer_type);
      }

      if (filters.search) {
        query = query.where(function () {
          this.where('customers.customer_name', 'like', `%${filters.search}%`)
            .orWhere('customers.customer_code', 'like', `%${filters.search}%`)
            .orWhere('customers.email', 'like', `%${filters.search}%`)
            .orWhere('customers.phone_number', 'like', `%${filters.search}%`);
        });
      }

      if (filters.assigned_to) {
        query = query.where('customers.assigned_to', filters.assigned_to);
      }

      // Sorting
      const sortBy = filters.sortBy || 'customer_name';
      const sortOrder = filters.sortOrder || 'asc';
      query = query.orderBy(sortBy, sortOrder);

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      const customers = await query;

      return customers;
    } catch (error) {
      logger.error('Error getting all customers', { error: error.message });
      throw error;
    }
  }

  /**
   * Update customer
   * @param {number} customerId - Customer ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>}
   */
  async updateCustomer(customerId, updates) {
    try {
      await knex('customers')
        .where({ id: customerId })
        .update({
          ...updates,
          updated_at: new Date(),
        });

      const customer = await this.getCustomerById(customerId);

      logger.info('Customer updated', { customerId });

      return customer;
    } catch (error) {
      logger.error('Error updating customer', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Update customer balance
   * @param {number} customerId - Customer ID
   * @param {number} amount - Amount to add (negative to subtract)
   * @returns {Promise<Object>}
   */
  async updateCustomerBalance(customerId, amount) {
    try {
      await knex('customers')
        .where({ id: customerId })
        .increment('current_balance', amount)
        .update({ updated_at: new Date() });

      const customer = await this.getCustomerById(customerId);

      logger.info('Customer balance updated', {
        customerId,
        amount,
        newBalance: customer.current_balance,
      });

      return customer;
    } catch (error) {
      logger.error('Error updating customer balance', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Update customer statistics
   * @param {number} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async updateCustomerStatistics(customerId) {
    try {
      // Calculate statistics from transactions
      const stats = await knex('transactions')
        .where({ customer_id: customerId, status: 'approved' })
        .select(
          knex.raw('COUNT(*) as total_transactions'),
          knex.raw('SUM(amount) as total_revenue'),
          knex.raw('MIN(transaction_date) as first_transaction_date'),
          knex.raw('MAX(transaction_date) as last_transaction_date')
        )
        .first();

      if (stats && stats.total_transactions > 0) {
        const daysSinceLast = stats.last_transaction_date
          ? Math.floor((new Date() - new Date(stats.last_transaction_date)) / (1000 * 60 * 60 * 24))
          : null;

        await knex('customers').where({ id: customerId }).update({
          total_transactions: stats.total_transactions,
          total_revenue: stats.total_revenue,
          lifetime_value: stats.total_revenue,
          first_transaction_date: stats.first_transaction_date,
          last_transaction_date: stats.last_transaction_date,
          days_since_last_transaction: daysSinceLast,
          updated_at: new Date(),
        });

        logger.info('Customer statistics updated', { customerId });
      }
    } catch (error) {
      logger.error('Error updating customer statistics', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer outstanding balance
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomerBalance(customerId) {
    try {
      const customer = await this.getCustomerById(customerId);

      if (!customer) {
        return null;
      }

      // Get unpaid invoices
      const unpaidInvoices = await knex('invoices')
        .where({ customer_id: customerId })
        .whereIn('status', ['sent', 'viewed', 'partial', 'overdue'])
        .select(
          knex.raw('COUNT(*) as invoice_count'),
          knex.raw('SUM(outstanding_amount) as total_outstanding')
        )
        .first();

      return {
        customer_id: customerId,
        customer_name: customer.customer_name,
        credit_limit: parseFloat(customer.credit_limit),
        current_balance: parseFloat(customer.current_balance),
        available_credit: parseFloat(customer.credit_limit) - parseFloat(customer.current_balance),
        unpaid_invoice_count: unpaidInvoices.invoice_count || 0,
        total_outstanding: parseFloat(unpaidInvoices.total_outstanding || 0),
      };
    } catch (error) {
      logger.error('Error getting customer balance', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer summary
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomerSummary(customerId) {
    try {
      const customer = await this.getCustomerById(customerId);

      if (!customer) {
        return null;
      }

      // Get transaction summary
      const transactionSummary = await knex('transactions')
        .where({ customer_id: customerId, status: 'approved' })
        .select(
          knex.raw('COUNT(*) as total_count'),
          knex.raw('SUM(amount) as total_amount'),
          knex.raw('AVG(amount) as avg_amount')
        )
        .first();

      // Get invoice summary
      const invoiceSummary = await knex('invoices')
        .where({ customer_id: customerId })
        .select(
          knex.raw('COUNT(*) as total_invoices'),
          knex.raw('SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid_invoices'),
          knex.raw('SUM(total_amount) as total_invoiced'),
          knex.raw('SUM(paid_amount) as total_paid'),
          knex.raw('SUM(outstanding_amount) as total_outstanding')
        )
        .first();

      return {
        customer,
        transactions: {
          total_count: transactionSummary.total_count || 0,
          total_amount: parseFloat(transactionSummary.total_amount || 0),
          avg_amount: parseFloat(transactionSummary.avg_amount || 0),
        },
        invoices: {
          total_invoices: invoiceSummary.total_invoices || 0,
          paid_invoices: invoiceSummary.paid_invoices || 0,
          total_invoiced: parseFloat(invoiceSummary.total_invoiced || 0),
          total_paid: parseFloat(invoiceSummary.total_paid || 0),
          total_outstanding: parseFloat(invoiceSummary.total_outstanding || 0),
        },
      };
    } catch (error) {
      logger.error('Error getting customer summary', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate next customer code
   * @returns {Promise<string>}
   */
  async generateCustomerCode() {
    try {
      const lastCustomer = await knex('customers').orderBy('id', 'desc').first();

      let nextNumber = 1;

      if (lastCustomer && lastCustomer.customer_code) {
        const match = lastCustomer.customer_code.match(/CUST-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `CUST-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating customer code', { error: error.message });
      throw error;
    }
  }

  /**
   * Soft delete customer
   * @param {number} customerId - Customer ID
   * @returns {Promise<boolean>}
   */
  async deleteCustomer(customerId) {
    try {
      await knex('customers').where({ id: customerId }).update({
        deleted_at: new Date(),
        status: 'inactive',
      });

      logger.info('Customer deleted (soft)', { customerId });

      return true;
    } catch (error) {
      logger.error('Error deleting customer', { customerId, error: error.message });
      throw error;
    }
  }
}

module.exports = new CustomerRepository();
