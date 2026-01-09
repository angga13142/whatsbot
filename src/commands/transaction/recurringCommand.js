/**
 * Recurring Command
 *
 * Manage recurring transactions
 */

const recurringTransactionService = require('../../services/recurringTransactionService');
const logger = require('../../utils/logger');
const { formatCurrency, formatDate } = require('../../utils/formatter');

module.exports = {
  name: 'recurring',
  aliases: ['berulang', 'jadwal'],
  description: 'Kelola transaksi berulang',
  usage: '/recurring [list|create|pause|resume|cancel]',

  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.listRecurring(message, user);
        return;
      }

      const action = args[0].toLowerCase();

      switch (action) {
        case 'list':
          await this.listRecurring(message, user);
          break;

        case 'create':
          await this.createRecurring(message, user);
          break;

        case 'pause':
          await this.pauseRecurring(message, user, args.slice(1));
          break;

        case 'resume':
          await this.resumeRecurring(message, user, args.slice(1));
          break;

        case 'cancel':
          await this.cancelRecurring(message, user, args.slice(1));
          break;

        case 'detail':
          await this.showDetail(message, user, args.slice(1));
          break;

        default:
          await this.listRecurring(message, user);
      }
    } catch (error) {
      logger.error('Error in recurring command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Terjadi kesalahan.');
    }
  },

  /**
   * List user's recurring transactions
   */
  async listRecurring(message, user) {
    try {
      const recurring = await recurringTransactionService.getUserRecurringTransactions(user.id);

      if (recurring.length === 0) {
        await message.reply(
          '📅 Belum ada transaksi berulang.\n\n' + 'Buat baru: `/recurring create`'
        );
        return;
      }

      let text =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📅 TRANSAKSI BERULANG                           ║\n' +
        `║  ${recurring.length} jadwal                                      ║\n` +
        '╚══════════════════════════════════════════════════╝\n\n';

      // Group by status
      const active = recurring.filter((r) => r.status === 'active');
      const paused = recurring.filter((r) => r.status === 'paused');
      const completed = recurring.filter((r) => r.status === 'completed');

      if (active.length > 0) {
        text += '*✅ AKTIF*\n';
        active.forEach((rec, index) => {
          const emoji = rec.type === 'paket' ? '📦' : rec.type === 'utang' ? '💳' : '🍔';
          text += `${index + 1}. ${emoji} *${rec.name}*\n`;
          text += `   ${formatCurrency(rec.amount)} | ${rec.frequency}\n`;
          text += `   Berikutnya: ${formatDate(rec.next_run_date, 'DD MMM YYYY')}\n\n`;
        });
      }

      if (paused.length > 0) {
        text += '*⏸️ DIJEDA*\n';
        paused.forEach((rec, index) => {
          text += `${index + 1}. ${rec.name} - ${rec.frequency}\n`;
        });
        text += '\n';
      }

      if (completed.length > 0) {
        text += '*✔️ SELESAI*\n';
        text += `${completed.length} transaksi berulang telah selesai\n\n`;
      }

      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += '💡 Buat baru: `/recurring create`\n';
      text += '💡 Jeda: `/recurring pause [nomor]`\n';
      text += '💡 Detail: `/recurring detail [nomor]`';

      await message.reply(text);
    } catch (error) {
      logger.error('Error listing recurring', { error: error.message });
      throw error;
    }
  },

  /**
   * Create new recurring transaction
   */
  async createRecurring(message, user) {
    try {
      const instructionText =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📅 BUAT TRANSAKSI BERULANG                      ║\n' +
        '║  Format input                                    ║\n' +
        '╚══════════════════════════════════════════════════╝\n\n' +
        'Format:\n' +
        '```\n' +
        'Nama Jadwal\n' +
        'Jenis (paket/utang/jajan)\n' +
        'Jumlah\n' +
        'Deskripsi\n' +
        'Frekuensi (daily/weekly/monthly/yearly)\n' +
        'Tanggal Mulai (YYYY-MM-DD)\n' +
        '```\n\n' +
        'Contoh:\n' +
        '```\n' +
        'Bayar Listrik Bulanan\n' +
        'jajan\n' +
        '500rb\n' +
        'Bayar listrik kantor\n' +
        'monthly\n' +
        '2026-01-01\n' +
        '```\n\n' +
        '──────────────────────────────────────────────────\n' +
        '💡 Untuk weekly, bisa tambah hari (monday, tuesday, dst)\n' +
        '💡 Untuk monthly, bisa tambah tanggal (1-31)\n' +
        '💡 Kirim semua info dalam 1 pesan';

      await message.reply(instructionText);

      // Set state
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_RECURRING_DATA');
    } catch (error) {
      logger.error('Error in create recurring', { error: error.message });
      throw error;
    }
  },

  /**
   * Process recurring creation
   */
  async processRecurringCreation(message, user, input) {
    try {
      const lines = input
        .trim()
        .split('\n')
        .filter((l) => l.trim());

      if (lines.length < 6) {
        await message.reply('❌ Format tidak lengkap. Periksa kembali format input.');
        return;
      }

      const name = lines[0].trim();
      const type = lines[1].trim().toLowerCase();
      const amountStr = lines[2].trim();
      const description = lines[3].trim();
      const frequency = lines[4].trim().toLowerCase();
      const startDate = lines[5].trim();

      // Validate
      if (!['paket', 'utang', 'jajan'].includes(type)) {
        await message.reply('❌ Jenis tidak valid. Harus: paket, utang, atau jajan');
        return;
      }

      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
        await message.reply('❌ Frekuensi tidak valid. Harus: daily, weekly, monthly, atau yearly');
        return;
      }

      // Parse amount
      const parser = require('../../utils/parser');
      const parsed = parser.parseNaturalAmount(amountStr);
      const amount = parsed.amount;

      if (!amount || amount <= 0) {
        await message.reply('❌ Jumlah tidak valid.');
        return;
      }

      // Optional: day of week or day of month
      let dayOfWeek = null;
      let dayOfMonth = null;

      if (lines.length > 6) {
        const extra = lines[6].trim().toLowerCase();

        if (frequency === 'weekly') {
          dayOfWeek = extra;
        } else if (frequency === 'monthly') {
          dayOfMonth = parseInt(extra);
        }
      }

      // Create recurring transaction
      const recurring = await recurringTransactionService.createRecurringTransaction(
        {
          name,
          type,
          amount,
          description,
          frequency,
          start_date: startDate,
          day_of_week: dayOfWeek,
          day_of_month: dayOfMonth,
        },
        user.id
      );

      const successText =
        '✅ *TRANSAKSI BERULANG DIBUAT*\n\n' +
        `📅 Nama: ${recurring.name}\n` +
        `🏷️ Jenis: ${recurring.type}\n` +
        `💰 Jumlah: ${formatCurrency(recurring.amount)}\n` +
        `🔄 Frekuensi: ${recurring.frequency}\n` +
        `📆 Mulai: ${formatDate(recurring.start_date, 'DD MMMM YYYY')}\n` +
        `⏭️ Berikutnya: ${formatDate(recurring.next_run_date, 'DD MMMM YYYY')}\n\n` +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '✅ Transaksi akan dibuat otomatis sesuai jadwal';

      await message.reply(successText);

      logger.info('Recurring transaction created', {
        recurringId: recurring.id,
        userId: user.id,
      });
    } catch (error) {
      logger.error('Error processing recurring creation', { error: error.message });
      await message.reply(`❌ Gagal membuat transaksi berulang: ${error.message}`);
    }
  },

  /**
   * Pause recurring transaction
   */
  async pauseRecurring(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/recurring pause [nomor]`');
        return;
      }

      const index = parseInt(args[0]) - 1;

      const recurring = await recurringTransactionService.getUserRecurringTransactions(
        user.id,
        'active'
      );

      if (index < 0 || index >= recurring.length) {
        await message.reply('❌ Transaksi berulang tidak ditemukan.');
        return;
      }

      const selected = recurring[index];

      await recurringTransactionService.pauseRecurringTransaction(selected.id, user.id);

      await message.reply(`⏸️ Transaksi berulang "${selected.name}" dijeda.`);

      logger.info('Recurring transaction paused', {
        recurringId: selected.id,
        userId: user.id,
      });
    } catch (error) {
      logger.error('Error pausing recurring', { error: error.message });
      await message.reply('❌ Gagal menjeda transaksi berulang.');
    }
  },

  /**
   * Resume recurring transaction
   */
  async resumeRecurring(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/recurring resume [nomor]`');
        return;
      }

      const index = parseInt(args[0]) - 1;

      const recurring = await recurringTransactionService.getUserRecurringTransactions(
        user.id,
        'paused'
      );

      if (index < 0 || index >= recurring.length) {
        await message.reply('❌ Transaksi berulang tidak ditemukan.');
        return;
      }

      const selected = recurring[index];

      await recurringTransactionService.resumeRecurringTransaction(selected.id, user.id);

      await message.reply(`▶️ Transaksi berulang "${selected.name}" dilanjutkan.`);

      logger.info('Recurring transaction resumed', {
        recurringId: selected.id,
        userId: user.id,
      });
    } catch (error) {
      logger.error('Error resuming recurring', { error: error.message });
      await message.reply('❌ Gagal melanjutkan transaksi berulang.');
    }
  },

  /**
   * Cancel recurring transaction
   */
  async cancelRecurring(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/recurring cancel [nomor]`');
        return;
      }

      const index = parseInt(args[0]) - 1;

      const recurring = await recurringTransactionService.getUserRecurringTransactions(user.id);

      if (index < 0 || index >= recurring.length) {
        await message.reply('❌ Transaksi berulang tidak ditemukan.');
        return;
      }

      const selected = recurring[index];

      // Confirm
      await message.reply(
        `⚠️ Yakin ingin membatalkan "${selected.name}"?\n\n` + 'Balas "YA" untuk konfirmasi.'
      );

      // Set state
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_RECURRING_CANCEL_CONFIRM');
      await sessionManager.setData(user.phone_number, 'recurring_cancel', {
        recurringId: selected.id,
      });
    } catch (error) {
      logger.error('Error in cancel recurring', { error: error.message });
      await message.reply('❌ Gagal membatalkan transaksi berulang.');
    }
  },

  /**
   * Show recurring detail
   */
  async showDetail(message, user, args) {
    try {
      if (args.length === 0) {
        await message.reply('❌ Format: `/recurring detail [nomor]`');
        return;
      }

      const index = parseInt(args[0]) - 1;

      const recurring = await recurringTransactionService.getUserRecurringTransactions(user.id);

      if (index < 0 || index >= recurring.length) {
        await message.reply('❌ Transaksi berulang tidak ditemukan.');
        return;
      }

      const selected = recurring[index];
      const detail = await recurringTransactionService.getRecurringTransaction(selected.id);

      let text =
        '╔══════════════════════════════════════════════════╗\n' +
        '║  📅 DETAIL TRANSAKSI BERULANG                    ║\n' +
        `║  ${detail.name.substring(0, 40).padEnd(40)}      ║\n` +
        '╚══════════════════════════════════════════════════╝\n\n';

      text += '*ℹ️ INFORMASI*\n';
      text += `📝 Nama: ${detail.name}\n`;
      text += `🏷️ Jenis: ${detail.type}\n`;
      text += `💰 Jumlah: ${formatCurrency(detail.amount)}\n`;
      text += `📋 Deskripsi: ${detail.description}\n\n`;

      text += '*🔄 JADWAL*\n';
      text += `Frekuensi: ${detail.frequency}\n`;
      text += `Interval: ${detail.interval || 1}\n`;
      text += `Mulai: ${formatDate(detail.start_date, 'DD MMM YYYY')}\n`;
      text += `Berikutnya: ${formatDate(detail.next_run_date, 'DD MMM YYYY')}\n`;

      if (detail.end_date) {
        text += `Berakhir: ${formatDate(detail.end_date, 'DD MMM YYYY')}\n`;
      }

      text += '\n';

      text += '*📊 STATISTIK*\n';
      text += `Status: ${detail.status}\n`;
      text += `Total berjalan: ${detail.total_runs || 0}x\n`;

      if (detail.last_run_date) {
        text += `Terakhir: ${formatDate(detail.last_run_date, 'DD MMM YYYY')}\n`;
      }

      // Show recent history
      if (detail.history && detail.history.length > 0) {
        text += '\n*📜 RIWAYAT (5 Terakhir)*\n';
        detail.history.slice(0, 5).forEach((h) => {
          const statusEmoji = h.status === 'success' ? '✅' : h.status === 'failed' ? '❌' : '⏭️';
          text += `${statusEmoji} ${formatDate(h.scheduled_date, 'DD/MM/YY')}\n`;
        });
      }

      await message.reply(text);
    } catch (error) {
      logger.error('Error showing recurring detail', { error: error.message });
      await message.reply('❌ Gagal menampilkan detail.');
    }
  },
};
