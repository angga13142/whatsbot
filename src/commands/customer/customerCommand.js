/**
 * Customer Command
 *
 * WhatsApp commands for customer self-service
 */

const customerService = require('../../services/customerService');
const invoiceService = require('../../services/invoiceService');
const notificationService = require('../../services/notificationService');
const { createBox, bold, createDivider } = require('../../utils/richText');
const { formatCurrency, formatDate } = require('../../utils/formatter');
const logger = require('../../utils/logger');

module.exports = {
  name: 'customer',
  aliases: ['balance', 'history', 'invoice', 'pay'],
  description: 'Customer self-service commands',
  usage: '/balance, /history, /invoice [number], /pay [invoice-number]',

  async handler(client, message, user, args) {
    try {
      const command = message.body.split(' ')[0].toLowerCase();

      // Get customer by phone number
      const phoneNumber = message.from.replace('@c.us', '');
      const customer = await customerService.getCustomerByPhone(phoneNumber);

      if (!customer) {
        await message.reply(
          '❌ Customer account not found.\n\n' +
            'Please contact our admin to register your account.\n' +
            'Phone: ' +
            phoneNumber
        );
        return;
      }

      // Route to appropriate handler
      switch (command) {
        case '/balance':
          await this.handleBalance(message, customer);
          break;

        case '/history':
          await this.handleHistory(message, customer, args);
          break;

        case '/invoice':
          await this.handleInvoice(message, customer, args);
          break;

        case '/pay':
          await this.handlePay(message, customer, args);
          break;

        default:
          await this.showMenu(message);
      }
    } catch (error) {
      logger.error('Error in customer command', {
        error: error.message,
        user: user.id,
      });
      await message.reply('❌ An error occurred. Please try again or contact support.');
    }
  },

  /**
   * Handle balance inquiry
   */
  async handleBalance(message, customer) {
    try {
      const balance = await customerService.getCustomerBalance(customer.id);

      const utilizationPercent = parseFloat(balance.credit_utilization);
      const utilizationBar = this._getProgressBar(utilizationPercent, 20);

      let response = createBox('💰 YOUR BALANCE', customer.customer_name, 50) + '\n\n';

      response += bold('📊 ACCOUNT SUMMARY') + '\n';
      response += `Outstanding: ${formatCurrency(balance.current_balance)}\n`;
      response += `Credit Limit: ${formatCurrency(balance.credit_limit)}\n`;
      response += `Available: ${formatCurrency(balance.available_credit)}\n\n`;

      response += bold('📈 CREDIT UTILIZATION') + '\n';
      response += `${utilizationBar} ${utilizationPercent}%\n\n`;

      if (utilizationPercent > 80) {
        response += '⚠️ *HIGH UTILIZATION*\n';
        response += 'Please make payments to increase available credit.\n\n';
      }

      response += bold('📋 UNPAID INVOICES') + '\n';
      response += `Count: ${balance.unpaid_invoice_count}\n`;
      response += `Total: ${formatCurrency(balance.total_outstanding)}\n\n`;

      response += createDivider('─', 50) + '\n';
      response += '💡 *QUICK ACTIONS*\n';
      response += '• View history: /history\n';
      response += '• View invoices: /invoice\n';
      response += '• Submit payment: /pay [invoice-number]';

      await message.reply(response);

      logger.info('Balance inquiry', {
        customerId: customer.id,
        balance: balance.current_balance,
      });
    } catch (error) {
      logger.error('Error in handleBalance', { error: error.message });
      throw error;
    }
  },

  /**
   * Handle transaction history
   */
  async handleHistory(message, customer, args) {
    try {
      const limit = args[0] ? parseInt(args[0]) : 10;
      const transactions = await customerService.getCustomerTransactionHistory(customer.id, {
        limit,
      });

      if (transactions.length === 0) {
        await message.reply('📊 No transaction history found.');
        return;
      }

      let response =
        createBox('📜 TRANSACTION HISTORY', `Last ${transactions.length} transactions`, 50) +
        '\n\n';

      transactions.forEach((txn, index) => {
        response += `${index + 1}. ${bold(txn.description)}\n`;
        response += `   Amount: ${formatCurrency(txn.amount)}\n`;
        response += `   Date: ${formatDate(txn.transaction_date, 'DD MMM YYYY')}\n`;
        response += `   Type: ${txn.type.toUpperCase()}\n`;
        if (index < transactions.length - 1) {
          response += '\n';
        }
      });

      response += '\n' + createDivider('─', 50) + '\n';
      response += `Showing ${transactions.length} of ${customer.total_transactions} total transactions\n\n`;
      response += '💡 Check balance: /balance';

      await message.reply(response);

      logger.info('Transaction history viewed', {
        customerId: customer.id,
        count: transactions.length,
      });
    } catch (error) {
      logger.error('Error in handleHistory', { error: error.message });
      throw error;
    }
  },

  /**
   * Handle invoice request
   */
  async handleInvoice(message, customer, args) {
    try {
      // If invoice number provided, show specific invoice
      if (args.length > 0) {
        const invoiceNumber = args[0];
        await this._showInvoiceDetail(message, customer, invoiceNumber);
        return;
      }

      // Show all invoices
      const invoices = await invoiceService.getCustomerInvoices(customer.id, { limit: 10 });

      if (invoices.length === 0) {
        await message.reply('📄 No invoices found.');
        return;
      }

      let response =
        createBox('📄 YOUR INVOICES', `${invoices.length} recent invoices`, 50) + '\n\n';

      invoices.forEach((inv, index) => {
        const statusEmoji = this._getStatusEmoji(inv.status);
        response += `${index + 1}. ${bold(inv.invoice_number)}\n`;
        response += `   Amount: ${formatCurrency(inv.total_amount)}\n`;
        response += `   Due: ${formatDate(inv.due_date, 'DD MMM YYYY')}\n`;
        response += `   Status: ${statusEmoji} ${inv.status.toUpperCase()}\n`;

        if (inv.status !== 'paid') {
          response += `   Outstanding: ${formatCurrency(inv.outstanding_amount)}\n`;
        }

        if (index < invoices.length - 1) {
          response += '\n';
        }
      });

      response += '\n' + createDivider('─', 50) + '\n';
      response += '💡 *ACTIONS*\n';
      response += '• View detail: /invoice [number]\n';
      response += '• Submit payment: /pay [number]\n\n';
      response += '_Example: /invoice INV-202601-0001_';

      await message.reply(response);

      logger.info('Invoice list viewed', {
        customerId: customer.id,
        count: invoices.length,
      });
    } catch (error) {
      logger.error('Error in handleInvoice', { error: error.message });
      throw error;
    }
  },

  /**
   * Show invoice detail
   * @private
   */
  async _showInvoiceDetail(message, customer, invoiceNumber) {
    try {
      const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);

      if (!invoice || invoice.customer_id !== customer.id) {
        await message.reply(`❌ Invoice ${invoiceNumber} not found.`);
        return;
      }

      // Mark as viewed
      await invoiceService.markAsViewed(invoice.id);

      const statusEmoji = this._getStatusEmoji(invoice.status);

      let response = createBox('📄 INVOICE DETAIL', invoice.invoice_number, 50) + '\n\n';

      response += bold('📋 INVOICE INFORMATION') + '\n';
      response += `Date: ${formatDate(invoice.invoice_date, 'DD MMM YYYY')}\n`;
      response += `Due Date: ${formatDate(invoice.due_date, 'DD MMM YYYY')}\n`;
      response += `Status: ${statusEmoji} ${invoice.status.toUpperCase()}\n\n`;

      response += bold('💰 AMOUNT BREAKDOWN') + '\n';
      response += `Subtotal: ${formatCurrency(invoice.subtotal)}\n`;

      if (invoice.discount_amount > 0) {
        response += `Discount (${invoice.discount_percentage}%): -${formatCurrency(invoice.discount_amount)}\n`;
      }

      response += `Tax (${invoice.tax_percentage}%): ${formatCurrency(invoice.tax_amount)}\n`;
      response += `${bold('Total:')} ${formatCurrency(invoice.total_amount)}\n\n`;

      if (invoice.status !== 'paid') {
        response += bold('⚠️ PAYMENT REQUIRED') + '\n';
        response += `Paid: ${formatCurrency(invoice.paid_amount)}\n`;
        response += `${bold('Outstanding:')} ${formatCurrency(invoice.outstanding_amount)}\n\n`;
      } else {
        response += `✅ ${bold('PAID')} on ${formatDate(invoice.paid_date, 'DD MMM YYYY')}\n\n`;
      }

      // Payment instructions
      if (invoice.status !== 'paid') {
        response += bold('💳 PAYMENT INSTRUCTIONS') + '\n';
        response += 'Bank Transfer - BCA\n';
        response += 'Account: 1234567890\n';
        response += `Amount: ${formatCurrency(invoice.outstanding_amount)}\n`;
        response += `Reference: ${invoice.invoice_number}\n\n`;

        response += '📤 Submit payment: /pay ' + invoice.invoice_number;
      }

      await message.reply(response);

      logger.info('Invoice detail viewed', {
        invoiceId: invoice.id,
        customerId: customer.id,
      });
    } catch (error) {
      logger.error('Error showing invoice detail', { error: error.message });
      throw error;
    }
  },

  /**
   * Handle payment submission
   */
  async handlePay(message, customer, args) {
    try {
      if (args.length === 0) {
        await message.reply(
          '💳 *SUBMIT PAYMENT*\n\n' +
            'To submit payment proof:\n' +
            '1. Use: /pay [invoice-number]\n' +
            '2. Send payment proof screenshot\n\n' +
            'Example: /pay INV-202601-0001'
        );
        return;
      }

      const invoiceNumber = args[0];
      const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);

      if (!invoice || invoice.customer_id !== customer.id) {
        await message.reply(`❌ Invoice ${invoiceNumber} not found.`);
        return;
      }

      if (invoice.status === 'paid') {
        await message.reply(`✅ Invoice ${invoiceNumber} is already paid.`);
        return;
      }

      let response = `💳 *PAYMENT SUBMISSION*\n\n`;
      response += `Invoice: ${bold(invoice.invoice_number)}\n`;
      response += `Amount Due: ${formatCurrency(invoice.outstanding_amount)}\n\n`;

      response += `${bold('PAYMENT INSTRUCTIONS:')}\n`;
      response += '1. Transfer to:\n';
      response += '   Bank: BCA\n';
      response += '   Account: 1234567890\n';
      response += `   Amount: ${formatCurrency(invoice.outstanding_amount)}\n`;
      response += `   Reference: ${invoice.invoice_number}\n\n`;

      response += '2. Take screenshot of transfer proof\n';
      response += '3. Send the screenshot to this chat\n';
      response += '4. Our team will verify and update status\n\n';

      response += '⏱️ Processing time: 1-2 business hours\n';
      response += '✅ You will receive confirmation when payment is verified';

      await message.reply(response);

      logger.info('Payment instructions sent', {
        invoiceId: invoice.id,
        customerId: customer.id,
      });
    } catch (error) {
      logger.error('Error in handlePay', { error: error.message });
      throw error;
    }
  },

  /**
   * Show customer menu
   */
  async showMenu(message) {
    const menuText =
      createBox('👤 CUSTOMER PORTAL', 'Self-Service Commands', 50) +
      '\n\n' +
      bold('💰 BALANCE & ACCOUNT') +
      '\n' +
      '`/balance` - Check your balance & credit\n' +
      '`/history [limit]` - View transaction history\n\n' +
      bold('📄 INVOICES') +
      '\n' +
      '`/invoice` - List all invoices\n' +
      '`/invoice [number]` - View invoice detail\n\n' +
      bold('💳 PAYMENTS') +
      '\n' +
      '`/pay [invoice-number]` - Submit payment proof\n\n' +
      bold('📝 EXAMPLES') +
      '\n' +
      '`/balance` - Check current balance\n' +
      '`/history 20` - View last 20 transactions\n' +
      '`/invoice INV-202601-0001` - View invoice\n' +
      '`/pay INV-202601-0001` - Pay invoice\n\n' +
      createDivider('━', 50) +
      '\n' +
      '💡 Need help? Reply to this message';

    await message.reply(menuText);
  },

  /**
   * Get status emoji
   * @private
   */
  _getStatusEmoji(status) {
    const emojiMap = {
      draft: '📝',
      sent: '📤',
      viewed: '👁️',
      partial: '⚠️',
      paid: '✅',
      overdue: '🚨',
      cancelled: '❌',
      void: '🚫',
    };
    return emojiMap[status] || '❓';
  },

  /**
   * Get progress bar
   * @private
   */
  _getProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
  },
};
