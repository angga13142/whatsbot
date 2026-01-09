/**
 * Customer Service
 *
 * Business logic for customer management
 */

const customerRepository = require('../database/repositories/customerRepository');
const logger = require('../utils/logger');

class CustomerService {
  /**
   * Create new customer
   * @param {Object} customerData - Customer data
   * @param {number} createdBy - User ID creating the customer
   * @returns {Promise<Object>}
   */
  async createCustomer(customerData, createdBy) {
    try {
      // Validate input
      const validation = this._validateCustomerData(customerData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for duplicate phone number
      if (customerData.phone_number) {
        const existing = await customerRepository.getCustomerByPhone(customerData.phone_number);
        if (existing) {
          throw new Error('Customer with this phone number already exists');
        }
      }

      // Generate customer code if not provided
      if (!customerData.customer_code) {
        customerData.customer_code = await customerRepository.generateCustomerCode();
      }

      // Set defaults
      customerData.created_by = createdBy;
      customerData.status = customerData.status || 'active';
      customerData.customer_type = customerData.customer_type || 'regular';
      customerData.current_balance = 0;
      customerData.total_transactions = 0;
      customerData.total_revenue = 0;

      // Create customer
      const customer = await customerRepository.createCustomer(customerData);

      logger.info('Customer created via service', {
        customerId: customer.id,
        customerCode: customer.customer_code,
        createdBy,
      });

      return customer;
    } catch (error) {
      logger.error('Error in createCustomer service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer by ID
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomer(customerId) {
    try {
      const customer = await customerRepository.getCustomerById(customerId);

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    } catch (error) {
      logger.error('Error in getCustomer service', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer by phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object>}
   */
  async getCustomerByPhone(phoneNumber) {
    try {
      const customer = await customerRepository.getCustomerByPhone(phoneNumber);
      return customer;
    } catch (error) {
      logger.error('Error in getCustomerByPhone service', { error: error.message });
      throw error;
    }
  }

  /**
   * Update customer
   * @param {number} customerId - Customer ID
   * @param {Object} updates - Update data
   * @param {number} updatedBy - User ID making the update
   * @returns {Promise<Object>}
   */
  async updateCustomer(customerId, updates, updatedBy) {
    try {
      // Validate customer exists
      const customer = await this.getCustomer(customerId);

      // Validate updates
      if (updates.phone_number && updates.phone_number !== customer.phone_number) {
        const existing = await customerRepository.getCustomerByPhone(updates.phone_number);
        if (existing && existing.id !== customerId) {
          throw new Error('Phone number already in use by another customer');
        }
      }

      // Update customer
      const updatedCustomer = await customerRepository.updateCustomer(customerId, updates);

      logger.info('Customer updated via service', { customerId, updatedBy });

      return updatedCustomer;
    } catch (error) {
      logger.error('Error in updateCustomer service', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer balance and credit info
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomerBalance(customerId) {
    try {
      const balance = await customerRepository.getCustomerBalance(customerId);

      if (!balance) {
        throw new Error('Customer not found');
      }

      // Add additional calculations
      balance.credit_utilization =
        balance.credit_limit > 0
          ? ((balance.current_balance / balance.credit_limit) * 100).toFixed(2)
          : 0;

      balance.is_over_limit = balance.current_balance > balance.credit_limit;

      return balance;
    } catch (error) {
      logger.error('Error in getCustomerBalance service', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Get customer summary with all details
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomerSummary(customerId) {
    try {
      const summary = await customerRepository.getCustomerSummary(customerId);

      if (!summary) {
        throw new Error('Customer not found');
      }

      // Add calculated metrics
      summary.metrics = {
        payment_rate:
          summary.invoices.total_invoices > 0
            ? ((summary.invoices.paid_invoices / summary.invoices.total_invoices) * 100).toFixed(2)
            : 0,
        avg_invoice_amount:
          summary.invoices.total_invoices > 0
            ? (summary.invoices.total_invoiced / summary.invoices.total_invoices).toFixed(2)
            : 0,
        credit_utilization:
          summary.customer.credit_limit > 0
            ? ((summary.customer.current_balance / summary.customer.credit_limit) * 100).toFixed(2)
            : 0,
      };

      return summary;
    } catch (error) {
      logger.error('Error in getCustomerSummary service', { customerId, error: error.message });
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
      const customers = await customerRepository.getAllCustomers(filters);
      return customers;
    } catch (error) {
      logger.error('Error in getAllCustomers service', { error: error.message });
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
      await customerRepository.updateCustomerStatistics(customerId);
      logger.info('Customer statistics updated', { customerId });
    } catch (error) {
      logger.error('Error in updateCustomerStatistics service', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if customer can make purchase (credit limit check)
   * @param {number} customerId - Customer ID
   * @param {number} amount - Transaction amount
   * @returns {Promise<Object>}
   */
  async checkCreditLimit(customerId, amount) {
    try {
      const balance = await this.getCustomerBalance(customerId);

      const newBalance = balance.current_balance + amount;
      const wouldExceedLimit = newBalance > balance.credit_limit;

      return {
        allowed: !wouldExceedLimit,
        current_balance: balance.current_balance,
        credit_limit: balance.credit_limit,
        available_credit: balance.available_credit,
        requested_amount: amount,
        new_balance: newBalance,
        would_exceed: wouldExceedLimit,
        excess_amount: wouldExceedLimit ? newBalance - balance.credit_limit : 0,
      };
    } catch (error) {
      logger.error('Error in checkCreditLimit service', { customerId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate customer data
   * @private
   */
  _validateCustomerData(data) {
    const errors = [];

    if (!data.customer_name || data.customer_name.trim().length === 0) {
      errors.push('Customer name is required');
    }

    if (data.phone_number && !/^\+?[\d\s-]{10,15}$/.test(data.phone_number)) {
      errors.push('Invalid phone number format');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.credit_limit !== undefined) {
      const limit = parseFloat(data.credit_limit);
      if (isNaN(limit) || limit < 0) {
        errors.push('Credit limit must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get customer transaction history
   * @param {number} customerId - Customer ID
   * @param {Object} options - Options
   * @returns {Promise<Array>}
   */
  async getCustomerTransactionHistory(customerId, options = {}) {
    try {
      const knex = require('../database/connection');

      let query = knex('transactions')
        .where({ customer_id: customerId, status: 'approved' })
        .orderBy('transaction_date', 'desc');

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const transactions = await query;

      return transactions;
    } catch (error) {
      logger.error('Error getting customer transaction history', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CustomerService();
