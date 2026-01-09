/**
 * Notification Service
 *
 * Send notifications via WhatsApp, Email, and other channels
 */

const logger = require('../utils/logger');
const { formatCurrency, formatDate } = require('../utils/formatter');
const dayjs = require('dayjs');

class NotificationService {
  constructor() {
    this.channels = {
      whatsapp: true,
      email: false, // Set to true when email service is configured
      sms: false,
    };
  }

  /**
   * Send transaction notification to customer
   * @param {Object} transaction - Transaction object
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>}
   */
  async sendTransactionNotification(transaction, customer) {
    try {
      const message = this._buildTransactionMessage(transaction, customer);

      const notification = await this._createNotification({
        recipient_type: 'customer',
        recipient_id: customer.id,
        recipient_name: customer.customer_name,
        recipient_contact: customer.whatsapp_number || customer.phone_number,
        notification_type: 'transaction_alert',
        channel: 'whatsapp',
        subject: 'New Transaction Recorded',
        message,
        related_type: 'transaction',
        related_id: transaction.id,
        priority: 'normal',
      });

      // Send via WhatsApp if available
      if (this.channels.whatsapp && customer.whatsapp_number) {
        await this._sendWhatsApp(customer.whatsapp_number, message);
        await this._updateNotificationStatus(notification.id, 'sent');
      }

      logger.info('Transaction notification sent', {
        transactionId: transaction.id,
        customerId: customer.id,
      });

      return notification;
    } catch (error) {
      logger.error('Error sending transaction notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Send invoice notification to customer
   * @param {Object} invoice - Invoice object
   * @returns {Promise<Object>}
   */
  async sendInvoiceNotification(invoice) {
    try {
      const message = this._buildInvoiceMessage(invoice);

      const notification = await this._createNotification({
        recipient_type: 'customer',
        recipient_id: invoice.customer_id,
        recipient_name: invoice.customer_name,
        recipient_contact: invoice.customer_phone,
        notification_type: 'invoice_sent',
        channel: 'whatsapp',
        subject: `Invoice ${invoice.invoice_number}`,
        message,
        related_type: 'invoice',
        related_id: invoice.id,
        priority: 'high',
        requires_action: true,
        action_text: 'View Invoice',
        action_url: `/invoice ${invoice.invoice_number}`,
      });

      // Get WhatsApp number from customer
      const customerRepository = require('../database/repositories/customerRepository');
      const customer = await customerRepository.getCustomerById(invoice.customer_id);

      if (this.channels.whatsapp && customer && customer.whatsapp_number) {
        await this._sendWhatsApp(customer.whatsapp_number, message);
        await this._updateNotificationStatus(notification.id, 'sent');
      }

      logger.info('Invoice notification sent', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
      });

      return notification;
    } catch (error) {
      logger.error('Error sending invoice notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Send payment reminder to customer
   * @param {Object} invoice - Invoice object
   * @returns {Promise<Object>}
   */
  async sendPaymentReminderNotification(invoice) {
    try {
      const daysOverdue = dayjs().diff(dayjs(invoice.due_date), 'day');
      const message = this._buildPaymentReminderMessage(invoice, daysOverdue);

      const notification = await this._createNotification({
        recipient_type: 'customer',
        recipient_id: invoice.customer_id,
        recipient_name: invoice.customer_name,
        recipient_contact: invoice.customer_phone,
        notification_type: 'payment_reminder',
        channel: 'whatsapp',
        subject: `Payment Reminder - ${invoice.invoice_number}`,
        message,
        related_type: 'invoice',
        related_id: invoice.id,
        priority: daysOverdue > 7 ? 'urgent' : 'high',
        requires_action: true,
        action_text: 'Pay Now',
        action_url: `/pay ${invoice.invoice_number}`,
      });

      // Get WhatsApp number from customer
      const customerRepository = require('../database/repositories/customerRepository');
      const customer = await customerRepository.getCustomerById(invoice.customer_id);

      if (this.channels.whatsapp && customer && customer.whatsapp_number) {
        await this._sendWhatsApp(customer.whatsapp_number, message);
        await this._updateNotificationStatus(notification.id, 'sent');
      }

      logger.info('Payment reminder sent', {
        invoiceId: invoice.id,
        daysOverdue,
      });

      return notification;
    } catch (error) {
      logger.error('Error sending payment reminder', { error: error.message });
      throw error;
    }
  }

  /**
   * Send payment received notification
   * @param {Object} invoice - Invoice object
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>}
   */
  async sendPaymentReceivedNotification(invoice, amount) {
    try {
      const message = this._buildPaymentReceivedMessage(invoice, amount);

      const notification = await this._createNotification({
        recipient_type: 'customer',
        recipient_id: invoice.customer_id,
        recipient_name: invoice.customer_name,
        recipient_contact: invoice.customer_phone,
        notification_type: 'payment_confirmed',
        channel: 'whatsapp',
        subject: `Payment Received - ${invoice.invoice_number}`,
        message,
        related_type: 'invoice',
        related_id: invoice.id,
        priority: 'normal',
      });

      // Get WhatsApp number from customer
      const customerRepository = require('../database/repositories/customerRepository');
      const customer = await customerRepository.getCustomerById(invoice.customer_id);

      if (this.channels.whatsapp && customer && customer.whatsapp_number) {
        await this._sendWhatsApp(customer.whatsapp_number, message);
        await this._updateNotificationStatus(notification.id, 'sent');
      }

      logger.info('Payment received notification sent', {
        invoiceId: invoice.id,
        amount,
      });

      return notification;
    } catch (error) {
      logger.error('Error sending payment received notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Send balance update notification
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>}
   */
  async sendBalanceUpdateNotification(customer) {
    try {
      const message = this._buildBalanceUpdateMessage(customer);

      const notification = await this._createNotification({
        recipient_type: 'customer',
        recipient_id: customer.id,
        recipient_name: customer.customer_name,
        recipient_contact: customer.whatsapp_number,
        notification_type: 'balance_update',
        channel: 'whatsapp',
        subject: 'Balance Update',
        message,
        related_type: 'customer',
        related_id: customer.id,
        priority: 'low',
      });

      if (this.channels.whatsapp && customer.whatsapp_number) {
        await this._sendWhatsApp(customer.whatsapp_number, message);
        await this._updateNotificationStatus(notification.id, 'sent');
      }

      return notification;
    } catch (error) {
      logger.error('Error sending balance update notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Build transaction notification message
   * @private
   */
  _buildTransactionMessage(transaction, customer) {
    return `
📦 *New Transaction Recorded*

*Transaction Details:*
Type: ${transaction.type.toUpperCase()}
Amount: ${formatCurrency(transaction.amount)}
Description: ${transaction.description}
Date: ${formatDate(transaction.transaction_date, 'DD MMM YYYY')}

*Your Balance:*
Outstanding: ${formatCurrency(customer.current_balance)}
Credit Limit: ${formatCurrency(customer.credit_limit)}
Available: ${formatCurrency(customer.credit_limit - customer.current_balance)}

Need to check your history? Send: /history

_Thank you for your business!_
    `.trim();
  }

  /**
   * Build invoice notification message
   * @private
   */
  _buildInvoiceMessage(invoice) {
    return `
📄 *New Invoice*

*Invoice:* ${invoice.invoice_number}
*Date:* ${formatDate(invoice.invoice_date, 'DD MMM YYYY')}
*Due Date:* ${formatDate(invoice.due_date, 'DD MMM YYYY')}

*Amount:* ${formatCurrency(invoice.total_amount)}
*Status:* ${invoice.status.toUpperCase()}

*Payment Instructions:*
Bank Transfer - BCA
Account: 1234567890
Amount: ${formatCurrency(invoice.total_amount)}

Please include invoice number in payment reference.

📥 Download Invoice: /invoice ${invoice.invoice_number}
💳 Submit Payment: /pay ${invoice.invoice_number}

_Questions? Reply to this message._
    `.trim();
  }

  /**
   * Build payment reminder message
   * @private
   */
  _buildPaymentReminderMessage(invoice, daysOverdue) {
    const urgency = daysOverdue > 7 ? '🚨 *URGENT* ' : daysOverdue > 0 ? '⏰ ' : '⏰ ';
    const status =
      daysOverdue > 0
        ? `*OVERDUE by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}*`
        : '*Payment Due Soon*';

    return `
${urgency}${status}

*Invoice:* ${invoice.invoice_number}
*Original Due Date:* ${formatDate(invoice.due_date, 'DD MMM YYYY')}

*Amount Outstanding:* ${formatCurrency(invoice.outstanding_amount)}

${daysOverdue > 0 ? '⚠️ This invoice is overdue. Please make payment immediately to avoid late fees.\n' : ''}

*Payment Instructions:*
Bank Transfer - BCA
Account: 1234567890
Amount: ${formatCurrency(invoice.outstanding_amount)}
Reference: ${invoice.invoice_number}

💳 Submit Payment Proof: /pay ${invoice.invoice_number}
📄 View Invoice: /invoice ${invoice.invoice_number}

Need assistance? Reply to this message.
    `.trim();
  }

  /**
   * Build payment received message
   * @private
   */
  _buildPaymentReceivedMessage(invoice, amount) {
    return `
✅ *Payment Received*

Thank you for your payment!

*Invoice:* ${invoice.invoice_number}
*Payment Amount:* ${formatCurrency(amount)}
*Date:* ${formatDate(new Date(), 'DD MMM YYYY HH:mm')}

*Invoice Status:*
Total: ${formatCurrency(invoice.total_amount)}
Paid: ${formatCurrency(invoice.paid_amount)}
Outstanding: ${formatCurrency(invoice.outstanding_amount)}
Status: ${invoice.status.toUpperCase()}

${invoice.status === 'paid' ? '🎉 Invoice is now fully paid!' : '⚠️ Partial payment recorded. Remaining balance due.'}

📄 View Invoice: /invoice ${invoice.invoice_number}
💰 Check Balance: /balance

_We appreciate your business!_
    `.trim();
  }

  /**
   * Build balance update message
   * @private
   */
  _buildBalanceUpdateMessage(customer) {
    const utilizationPercent =
      customer.credit_limit > 0
        ? ((customer.current_balance / customer.credit_limit) * 100).toFixed(1)
        : 0;

    return `
💰 *Balance Update*

*Current Balance:* ${formatCurrency(customer.current_balance)}
*Credit Limit:* ${formatCurrency(customer.credit_limit)}
*Available Credit:* ${formatCurrency(customer.credit_limit - customer.current_balance)}

*Credit Utilization:* ${utilizationPercent}%

${utilizationPercent > 80 ? '⚠️ Your credit utilization is high. Please make payments to increase available credit.' : ''}

📊 View Details: /balance
📜 Transaction History: /history

_Questions? Contact your account manager._
    `.trim();
  }

  /**
   * Create notification record in database
   * @private
   */
  async _createNotification(notificationData) {
    try {
      const knex = require('../database/connection');

      const [id] = await knex('notifications').insert({
        ...notificationData,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const notification = await knex('notifications').where({ id }).first();

      return notification;
    } catch (error) {
      logger.error('Error creating notification record', { error: error.message });
      throw error;
    }
  }

  /**
   * Update notification status
   * @private
   */
  async _updateNotificationStatus(notificationId, status, errorMessage = null) {
    try {
      const knex = require('../database/connection');

      const updates = {
        status,
        updated_at: new Date(),
      };

      if (status === 'sent') {
        updates.sent_at = new Date();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date();
      } else if (status === 'failed') {
        updates.failed_at = new Date();
        updates.error_message = errorMessage;
        updates.retry_count = knex.raw('retry_count + 1');
      }

      await knex('notifications').where({ id: notificationId }).update(updates);
    } catch (error) {
      logger.error('Error updating notification status', { error: error.message });
    }
  }

  /**
   * Send WhatsApp message
   * @private
   */
  async _sendWhatsApp(phoneNumber, message) {
    try {
      // This would integrate with your WhatsApp bot client
      // For now, just log the message
      logger.info('WhatsApp message queued', {
        to: phoneNumber,
        messageLength: message.length,
      });

      // In production, you would:
      // const client = getWhatsAppClient();
      // await client.sendMessage(`${phoneNumber}@c.us`, message);

      return true;
    } catch (error) {
      logger.error('Error sending WhatsApp message', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer notifications
   * @param {number} customerId - Customer ID
   * @param {Object} options - Options
   * @returns {Promise<Array>}
   */
  async getCustomerNotifications(customerId, options = {}) {
    try {
      const knex = require('../database/connection');

      let query = knex('notifications')
        .where({
          recipient_type: 'customer',
          recipient_id: customerId,
        })
        .orderBy('created_at', 'desc');

      if (options.unread_only) {
        query = query.whereNull('read_at');
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const notifications = await query;

      return notifications;
    } catch (error) {
      logger.error('Error getting customer notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise<boolean>}
   */
  async markAsRead(notificationId) {
    try {
      const knex = require('../database/connection');

      await knex('notifications').where({ id: notificationId }).update({
        read_at: new Date(),
        status: 'read',
      });

      return true;
    } catch (error) {
      logger.error('Error marking notification as read', { error: error.message });
      throw error;
    }
  }
}

module.exports = new NotificationService();
