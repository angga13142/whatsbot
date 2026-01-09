/**
 * Advanced Conversation Flow Handler
 *
 * Handles multi-step flows for advanced features
 */

const sessionManager = require('../../utils/sessionManager');
const logger = require('../../utils/logger');

// Lazy load to avoid circular dependencies
const getServices = () => ({
  categoryService: require('../../services/categoryService'),
  transactionService: require('../../services/transactionService'),
  recurringTransactionService: require('../../services/recurringTransactionService'),
});

const getCommands = () => ({
  bulkCommand: require('../transaction/bulkTransactionCommand'),
  templateCommand: require('../transaction/templateCommand'),
  recurringCommand: require('../transaction/recurringCommand'),
});

module.exports = {
  /**
   * Handle advanced conversation states
   */
  async handleState(client, message, user, session) {
    const messageBody = message.body.trim();

    // Check for cancel
    if (['batal', 'cancel', 'stop'].includes(messageBody.toLowerCase())) {
      await this._cancelFlow(message, user);
      return;
    }

    // Route based on state
    switch (session.current_state) {
      // Import flow
      case 'AWAITING_IMPORT_FILE':
        await this._handleImportFile(message, user);
        break;

      // Bulk approve confirmation
      case 'AWAITING_BULK_APPROVE_CONFIRM':
        await this._handleBulkApproveConfirm(message, user, messageBody);
        break;

      // Template creation
      case 'AWAITING_TEMPLATE_DATA':
        await this._handleTemplateData(message, user, messageBody);
        break;

      // Template amount input
      case 'AWAITING_TEMPLATE_AMOUNT':
        await this._handleTemplateAmount(message, user, messageBody);
        break;

      // Category creation
      case 'AWAITING_CATEGORY_DATA':
        await this._handleCategoryData(message, user, messageBody);
        break;

      // Budget setting
      case 'AWAITING_BUDGET_DATA':
        await this._handleBudgetData(message, user, messageBody);
        break;

      // Recurring transaction creation
      case 'AWAITING_RECURRING_DATA':
        await this._handleRecurringData(message, user, messageBody);
        break;

      // Recurring cancel confirmation
      case 'AWAITING_RECURRING_CANCEL_CONFIRM':
        await this._handleRecurringCancelConfirm(message, user, messageBody);
        break;

      default:
        logger.warn('Unknown advanced state', {
          userId: user.id,
          state: session.current_state,
        });
        await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle import file upload
   */
  async _handleImportFile(message, user) {
    try {
      if (!message.hasMedia) {
        await message.reply('❌ Silakan kirim file Excel atau CSV.');
        return;
      }

      const media = await message.downloadMedia();
      const { bulkCommand } = getCommands();

      await bulkCommand.processImportFile(message, user, media);

      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling import file', { error: error.message });
      await message.reply('❌ Gagal memproses file.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle bulk approve confirmation
   */
  async _handleBulkApproveConfirm(message, user, input) {
    try {
      if (input.toLowerCase() !== 'ya') {
        await message.reply('❌ Bulk approve dibatalkan.');
        await sessionManager.deleteSession(user.phone_number);
        return;
      }

      await message.reply('⏳ Memproses bulk approve...');

      const { bulkCommand } = getCommands();
      const result = await bulkCommand.executeBulkApprove(user);

      const resultText =
        `✅ *BULK APPROVE SELESAI*\n\n` +
        `✅ Disetujui: ${result.approved}\n` +
        `❌ Gagal: ${result.failed}\n` +
        `📊 Total: ${result.total}`;

      await message.reply(resultText);

      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling bulk approve confirm', { error: error.message });
      await message.reply('❌ Gagal memproses bulk approve.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle template data input
   */
  async _handleTemplateData(message, user, input) {
    try {
      const { templateCommand } = getCommands();
      await templateCommand.processTemplateCreation(message, user, input);
      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling template data', { error: error.message });
      await message.reply('❌ Gagal membuat template.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle template amount input
   */
  async _handleTemplateAmount(message, user, input) {
    try {
      const templateData = await sessionManager.getData(user.phone_number, 'template');

      // Parse amount
      const parser = require('../../utils/parser');
      const parsed = parser.parseNaturalAmount(input);

      if (!parsed.amount || parsed.amount <= 0) {
        await message.reply('❌ Jumlah tidak valid. Silakan coba lagi.');
        return;
      }

      // Create transaction
      const { transactionService } = getServices();
      const transaction = await transactionService.createTransaction(
        user.id,
        templateData.type,
        parsed.amount,
        templateData.description,
        {
          category_id: templateData.categoryId,
        }
      );

      // Update template usage
      const knex = require('../../database/connection');
      await knex('transaction_templates')
        .where({ id: templateData.templateId })
        .increment('usage_count', 1)
        .update({ last_used_at: knex.fn.now() });

      const transactionTemplate = require('../../templates/messages/transactionTemplate');
      const successText = transactionTemplate.transactionCreated(transaction);

      await message.reply(successText);

      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling template amount', { error: error.message });
      await message.reply('❌ Gagal membuat transaksi dari template.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle category data input
   */
  async _handleCategoryData(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 2) {
        await message.reply('❌ Format tidak lengkap. Minimal: Nama dan Jenis');
        return;
      }

      const name = lines[0].trim();
      const type = lines[1].trim().toLowerCase();
      const icon = lines[2] ? lines[2].trim() : '📌';

      if (!['income', 'expense', 'both'].includes(type)) {
        await message.reply('❌ Jenis tidak valid. Harus: income, expense, atau both');
        return;
      }

      const { categoryService } = getServices();
      const category = await categoryService.createCategory(
        {
          name,
          type,
          icon,
        },
        user.id
      );

      await message.reply(
        `✅ Kategori "${category.name}" berhasil dibuat!\n\n` +
          `${category.icon} ${category.name} (${category.type})`
      );

      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling category data', { error: error.message });
      await message.reply(`❌ Gagal membuat kategori: ${error.message}`);
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle budget data input
   */
  async _handleBudgetData(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 3) {
        await message.reply('❌ Format tidak lengkap.');
        return;
      }

      const categoryName = lines[0].trim();
      const amountStr = lines[1].trim();
      const period = lines[2].trim().toLowerCase();

      // Find category
      const { categoryService } = getServices();
      const categories = await categoryService.getAllCategories();
      const category = categories.find((c) =>
        c.name.toLowerCase().includes(categoryName.toLowerCase())
      );

      if (!category) {
        await message.reply(`❌ Kategori "${categoryName}" tidak ditemukan.`);
        return;
      }

      // Parse amount
      const parser = require('../../utils/parser');
      const parsed = parser.parseNaturalAmount(amountStr);

      if (!parsed.amount || parsed.amount <= 0) {
        await message.reply('❌ Jumlah tidak valid.');
        return;
      }

      // Set budget
      const dayjs = require('dayjs');
      await categoryService.setBudget(
        category.id,
        {
          amount: parsed.amount,
          period,
          start_date: dayjs().format('YYYY-MM-DD'),
        },
        user.id
      );

      const { formatCurrency } = require('../../utils/formatter');
      await message.reply(
        `✅ Budget berhasil diset!\n\n` +
          `📂 Kategori: ${category.name}\n` +
          `💰 Budget: ${formatCurrency(parsed.amount)}\n` +
          `📅 Periode: ${period}`
      );

      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling budget data', { error: error.message });
      await message.reply('❌ Gagal set budget.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle recurring data input
   */
  async _handleRecurringData(message, user, input) {
    try {
      const { recurringCommand } = getCommands();
      await recurringCommand.processRecurringCreation(message, user, input);
      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling recurring data', { error: error.message });
      await message.reply('❌ Gagal membuat transaksi berulang.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle recurring cancel confirmation
   */
  async _handleRecurringCancelConfirm(message, user, input) {
    try {
      if (input.toLowerCase() !== 'ya') {
        await message.reply('❌ Pembatalan dibatalkan.');
        await sessionManager.deleteSession(user.phone_number);
        return;
      }

      const data = await sessionManager.getData(user.phone_number, 'recurring_cancel');

      const { recurringTransactionService } = getServices();
      await recurringTransactionService.cancelRecurringTransaction(data.recurringId, user.id);

      await message.reply('✅ Transaksi berulang berhasil dibatalkan.');

      await sessionManager.deleteSession(user.phone_number);
    } catch (error) {
      logger.error('Error handling recurring cancel confirm', { error: error.message });
      await message.reply('❌ Gagal membatalkan transaksi berulang.');
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Cancel flow
   */
  async _cancelFlow(message, user) {
    await sessionManager.deleteSession(user.phone_number);
    await message.reply('❌ Proses dibatalkan.');

    logger.info('Advanced flow cancelled', { userId: user.id });
  },
};
