/**
 * Category Command
 *
 * Manage categories
 */

const categoryService = require('../../services/categoryService');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/formatter');

module.exports = {
  name: 'category',
  aliases: ['kategori'],
  description: 'Kelola kategori transaksi',
  usage: '/category [list|create|budget|stats]',

  async handler(client, message, user, args) {
    try {
      // Check permission
      if (!['admin', 'superadmin'].includes(user.role)) {
        await message.reply('❌ Hanya admin yang dapat mengelola kategori.');
        return;
      }

      if (args.length === 0) {
        await this.listCategories(message);
        return;
      }

      const action = args[0].toLowerCase();

      switch (action) {
        case 'list':
          await this.listCategories(message);
          break;

        case 'create':
          await this.createCategory(message, user);
          break;

        case 'budget':
          await this.setBudget(message, user);
          break;

        case 'stats':
          await this.showStats(message);
          break;

        default:
          await this.listCategories(message);
      }
    } catch (error) {
      logger.error('Error in category command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Terjadi kesalahan.');
    }
  },

  /**
   * List all categories
   */
  async listCategories(message) {
    try {
      const categories = await categoryService.getAllCategories();

      if (categories.length === 0) {
        await message.reply('📂 Belum ada kategori.');
        return;
      }

      let text =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📂 KATEGORI TRANSAKSI                           ║\n' +
        `║  ${categories.length} kategori tersedia                         ║\n` +
        '╚══════════════════════════════════════════════════╝\n\n';

      // Group by type
      const income = categories.filter((c) => c.type === 'income');
      const expense = categories.filter((c) => c.type === 'expense');
      const both = categories.filter((c) => c.type === 'both');

      if (income.length > 0) {
        text += '*💵 PEMASUKAN*\n';
        income.forEach((cat) => {
          text += `${cat.icon || '📌'} ${cat.name}\n`;
        });
        text += '\n';
      }

      if (expense.length > 0) {
        text += '*💸 PENGELUARAN*\n';
        expense.forEach((cat) => {
          text += `${cat.icon || '📌'} ${cat.name}\n`;
        });
        text += '\n';
      }

      if (both.length > 0) {
        text += '*📋 UMUM*\n';
        both.forEach((cat) => {
          text += `${cat.icon || '📌'} ${cat.name}\n`;
        });
      }

      text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += '💡 Buat baru: `/category create`\n';
      text += '💡 Set budget: `/category budget`';

      await message.reply(text);
    } catch (error) {
      logger.error('Error listing categories', { error: error.message });
      throw error;
    }
  },

  /**
   * Create new category
   */
  async createCategory(message, user) {
    try {
      const instructionText =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📂 BUAT KATEGORI BARU                           ║\n' +
        '║  Format input                                    ║\n' +
        '╚══════════════════════════════════════════════════╝\n\n' +
        'Format:\n' +
        '```\n' +
        'Nama Kategori\n' +
        'Jenis (income/expense/both)\n' +
        'Icon (emoji)\n' +
        '```\n\n' +
        'Contoh:\n' +
        '```\n' +
        'Marketing\n' +
        'expense\n' +
        '📣\n' +
        '```';

      await message.reply(instructionText);

      // Set state
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_CATEGORY_DATA');
    } catch (error) {
      logger.error('Error in create category', { error: error.message });
      throw error;
    }
  },

  /**
   * Process category creation
   */
  async processCategoryCreation(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 2) {
        await message.reply('❌ Format tidak lengkap. Minimal: Nama, Jenis');
        return;
      }

      const name = lines[0].trim();
      const type = lines[1].trim().toLowerCase();
      const icon = lines[2] ? lines[2].trim() : '📌';

      // Validate type
      if (!['income', 'expense', 'both'].includes(type)) {
        await message.reply('❌ Jenis tidak valid. Harus: income, expense, atau both');
        return;
      }

      // Create category
      const category = await categoryService.createCategory(
        {
          name,
          type,
          icon,
        },
        user.id
      );

      const successText =
        '✅ *KATEGORI BERHASIL DIBUAT*\n\n' +
        `${icon} Nama: ${name}\n` +
        `🏷️ Jenis: ${type}\n\n` +
        '💡 Gunakan kategori ini saat membuat transaksi';

      await message.reply(successText);

      logger.info('Category created', { categoryId: category.id, userId: user.id });
    } catch (error) {
      logger.error('Error processing category creation', { error: error.message });
      await message.reply(`❌ Gagal membuat kategori: ${error.message}`);
    }
  },

  /**
   * Set budget for category
   */
  async setBudget(message, user) {
    try {
      const instructionText =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  💰 SET BUDGET KATEGORI                          ║\n' +
        '║  Format input                                    ║\n' +
        '╚══════════════════════════════════════════════════╝\n\n' +
        'Format:\n' +
        '```\n' +
        'Nama Kategori\n' +
        'Jumlah Budget\n' +
        'Period (monthly/weekly/daily)\n' +
        '```\n\n' +
        'Contoh:\n' +
        '```\n' +
        'Transportasi\n' +
        '2jt\n' +
        'monthly\n' +
        '```';

      await message.reply(instructionText);

      // Set state
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_BUDGET_DATA');
    } catch (error) {
      logger.error('Error in set budget', { error: error.message });
      throw error;
    }
  },

  /**
   * Process budget setting
   */
  async processBudgetSetting(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 3) {
        await message.reply('❌ Format tidak lengkap. Harus: Nama Kategori, Jumlah, Period');
        return;
      }

      const categoryName = lines[0].trim();
      const amountStr = lines[1].trim();
      const period = lines[2].trim().toLowerCase();

      // Find category
      const category = await categoryService.getCategoryByName(categoryName);
      if (!category) {
        await message.reply(`❌ Kategori "${categoryName}" tidak ditemukan.`);
        return;
      }

      // Parse amount
      const parser = require('../../utils/parser');
      const parsed = parser.parseNaturalAmount(amountStr);

      if (!parsed || !parsed.amount) {
        await message.reply('❌ Jumlah tidak valid.');
        return;
      }

      // Validate period
      if (!['monthly', 'weekly', 'daily'].includes(period)) {
        await message.reply('❌ Period tidak valid. Harus: monthly, weekly, atau daily');
        return;
      }

      // Set budget
      await categoryService.setCategoryBudget(category.id, parsed.amount, period, user.id);

      const successText =
        '✅ *BUDGET BERHASIL DISET*\n\n' +
        `📂 Kategori: ${categoryName}\n` +
        `💰 Budget: ${formatCurrency(parsed.amount)}\n` +
        `📅 Period: ${period}\n\n` +
        '💡 Anda akan menerima notifikasi jika mendekati limit';

      await message.reply(successText);

      logger.info('Budget set', { categoryId: category.id, amount: parsed.amount, period });
    } catch (error) {
      logger.error('Error processing budget setting', { error: error.message });
      await message.reply(`❌ Gagal set budget: ${error.message}`);
    }
  },

  /**
   * Show category statistics
   */
  async showStats(message) {
    try {
      const categories = await categoryService.getAllCategories();

      let text =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📊 STATISTIK KATEGORI                           ║\n' +
        '║  Usage per kategori                              ║\n' +
        '╚══════════════════════════════════════════════════╝\n\n';

      let hasStats = false;

      for (const category of categories) {
        try {
          const stats = await categoryService.getCategoryById(category.id);

          if (stats.stats && stats.stats.transaction_count > 0) {
            hasStats = true;
            text += `${category.icon || '📌'} *${category.name}*\n`;
            text += `   Transaksi: ${stats.stats.transaction_count}x\n`;
            text += `   Total: ${formatCurrency(stats.stats.total_amount)}\n\n`;
          }
        } catch (e) {
          // Skip category if stats fail
        }
      }

      if (!hasStats) {
        text += '📭 Belum ada statistik kategori.';
      }

      await message.reply(text);
    } catch (error) {
      logger.error('Error showing category stats', { error: error.message });
      await message.reply('❌ Gagal menampilkan statistik.');
    }
  },
};
