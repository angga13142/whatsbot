/**
 * Template Command
 *
 * Manage transaction templates
 */

const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/formatter');

module.exports = {
  name: 'template',
  description: 'Kelola template transaksi',
  usage: '/template [list|create|use|delete]',

  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.listTemplates(message, user);
        return;
      }

      const action = args[0].toLowerCase();

      switch (action) {
        case 'list':
          await this.listTemplates(message, user);
          break;

        case 'create':
          await this.createTemplate(message, user);
          break;

        case 'use':
          await this.useTemplate(message, user, args.slice(1));
          break;

        case 'delete':
          await this.deleteTemplate(message, user, args.slice(1));
          break;

        default:
          await this.listTemplates(message, user);
      }
    } catch (error) {
      logger.error('Error in template command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Terjadi kesalahan.');
    }
  },

  /**
   * List user's templates
   */
  async listTemplates(message, user) {
    try {
      const knex = require('../../database/connection');

      const templates = await knex('transaction_templates')
        .where(function () {
          this.where({ created_by: user.id })
            .orWhere('visibility', 'shared')
            .orWhere('visibility', 'public');
        })
        .orderBy('usage_count', 'desc');

      if (templates.length === 0) {
        await message.reply(
          '📝 Belum ada template.\n\n' + 'Buat template baru: `/template create`'
        );
        return;
      }

      let text =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📝 TEMPLATE TRANSAKSI                           ║\n' +
        `║  ${templates.length} template tersedia                         ║\n` +
        '╚══════════════════════════════════════════════════╝\n\n';

      templates.forEach((tpl, index) => {
        const isFavorite = tpl.is_favorite ? '⭐' : '';
        const amount = tpl.default_amount ? formatCurrency(tpl.default_amount) : 'Variable';

        text += `${index + 1}. ${isFavorite} *${tpl.name}*\n`;
        text += `   ${tpl.type} | ${amount}\n`;
        text += `   ${tpl.default_description || 'No description'}\n`;
        text += `   Digunakan: ${tpl.usage_count}x\n\n`;
      });

      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += '💡 Gunakan: `/template use [nomor]`\n';
      text += '💡 Buat baru: `/template create`';

      await message.reply(text);
    } catch (error) {
      logger.error('Error listing templates', { error: error.message });
      throw error;
    }
  },

  /**
   * Create new template
   */
  async createTemplate(message, user) {
    try {
      const instructionText =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📝 BUAT TEMPLATE BARU                           ║\n' +
        '║  Ikuti langkah berikut                           ║\n' +
        '╚══════════════════════════════════════════════════╝\n\n' +
        'Format:\n' +
        '```\n' +
        'Nama Template\n' +
        'Jenis (paket/utang/jajan)\n' +
        'Jumlah (atau kosongkan untuk variable)\n' +
        'Deskripsi\n' +
        '```\n\n' +
        'Contoh:\n' +
        '```\n' +
        'Bayar Pulsa\n' +
        'jajan\n' +
        '50000\n' +
        'Beli pulsa kantor\n' +
        '```\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '💡 Kirim semua info dalam 1 pesan';

      await message.reply(instructionText);

      // Set state
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_TEMPLATE_DATA');
    } catch (error) {
      logger.error('Error in create template', { error: error.message });
      throw error;
    }
  },

  /**
   * Process template creation
   */
  async processTemplateCreation(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 3) {
        await message.reply('❌ Format tidak lengkap. Minimal: Nama, Jenis, Deskripsi');
        return;
      }

      const name = lines[0].trim();
      const type = lines[1].trim().toLowerCase();
      const amountStr = lines[2].trim();
      const description = lines.slice(3).join(' ').trim() || lines[2];

      // Validate type
      if (!['paket', 'utang', 'jajan'].includes(type)) {
        await message.reply('❌ Jenis tidak valid. Harus: paket, utang, atau jajan');
        return;
      }

      // Parse amount (optional)
      const parser = require('../../utils/parser');
      let amount = null;

      try {
        if (amountStr && !isNaN(parseFloat(amountStr))) {
          const parsed = parser.parseNaturalAmount(amountStr);
          amount = parsed.amount;
        }
      } catch (e) {
        // Amount is optional, so ignore parse errors
      }

      // Create template
      const knex = require('../../database/connection');

      const [result] = await knex('transaction_templates')
        .insert({
          name,
          description: `Template ${name}`,
          created_by: user.id,
          type,
          default_amount: amount,
          default_description: description,
          visibility: 'private',
          usage_count: 0,
        })
        .returning('id');

      const id = typeof result === 'object' ? result.id : result;

      const successText =
        '✅ *TEMPLATE BERHASIL DIBUAT*\n\n' +
        `📝 Nama: ${name}\n` +
        `🏷️ Jenis: ${type}\n` +
        `💰 Jumlah: ${amount ? formatCurrency(amount) : 'Variable'}\n` +
        `📋 Deskripsi: ${description}\n\n` +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '💡 Gunakan: `/template use 1`';

      await message.reply(successText);

      logger.info('Template created', { templateId: id, userId: user.id });
    } catch (error) {
      logger.error('Error processing template creation', { error: error.message });
      await message.reply('❌ Gagal membuat template.');
    }
  },

  /**
   * Use template
   */
  async useTemplate(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/template use [nomor]`');
        return;
      }

      const templateIndex = parseInt(args[0]) - 1;

      // Get templates
      const knex = require('../../database/connection');

      const templates = await knex('transaction_templates')
        .where(function () {
          this.where({ created_by: user.id })
            .orWhere('visibility', 'shared')
            .orWhere('visibility', 'public');
        })
        .orderBy('usage_count', 'desc');

      if (templateIndex < 0 || templateIndex >= templates.length) {
        await message.reply('❌ Template tidak ditemukan.');
        return;
      }

      const template = templates[templateIndex];

      // Start transaction creation with template
      const transactionService = require('../../services/transactionService');

      // If amount is set, create directly
      if (template.default_amount) {
        const transaction = await transactionService.createTransaction(
          user.id,
          template.type,
          template.default_amount,
          template.default_description,
          {
            category_id: template.category_id,
          }
        );

        // Update usage count
        await knex('transaction_templates')
          .where({ id: template.id })
          .increment('usage_count', 1)
          .update({ last_used_at: knex.fn.now() });

        const transactionTemplate = require('../../templates/messages/transactionTemplate');
        const successText = transactionTemplate.transactionCreated(transaction);

        await message.reply(successText);
      } else {
        // Ask for amount
        await message.reply(`📝 Template: *${template.name}*\n\n` + '💰 Berapa jumlahnya?');

        // Set state
        const sessionManager = require('../../utils/sessionManager');
        await sessionManager.setState(user.phone_number, 'AWAITING_TEMPLATE_AMOUNT');
        await sessionManager.setData(user.phone_number, 'template', {
          templateId: template.id,
          type: template.type,
          description: template.default_description,
          categoryId: template.category_id,
        });
      }
    } catch (error) {
      logger.error('Error using template', { error: error.message });
      await message.reply('❌ Gagal menggunakan template.');
    }
  },

  /**
   * Delete template
   */
  async deleteTemplate(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/template delete [nomor]`');
        return;
      }

      const templateIndex = parseInt(args[0]) - 1;

      const knex = require('../../database/connection');

      const templates = await knex('transaction_templates')
        .where({ created_by: user.id })
        .orderBy('usage_count', 'desc');

      if (templateIndex < 0 || templateIndex >= templates.length) {
        await message.reply('❌ Template tidak ditemukan.');
        return;
      }

      const template = templates[templateIndex];

      // Delete
      await knex('transaction_templates').where({ id: template.id }).del();

      await message.reply(`✅ Template "${template.name}" berhasil dihapus.`);

      logger.info('Template deleted', { templateId: template.id, userId: user.id });
    } catch (error) {
      logger.error('Error deleting template', { error: error.message });
      await message.reply('❌ Gagal menghapus template.');
    }
  },
};
