/**
 * Bulk Transaction Command
 *
 * Bulk operations: import, export, approve, categorize
 */

const transactionService = require('../../services/transactionService');
const categoryService = require('../../services/categoryService');
const logger = require('../../utils/logger');
const { formatCurrency, formatDate } = require('../../utils/formatter');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'bulk',
  description: 'Operasi bulk transaksi',
  usage: '/bulk [import|export|approve]',

  /**
   * Main handler
   */
  async handler(client, message, user, args) {
    try {
      if (args.length === 0) {
        await this.showMenu(message);
        return;
      }

      const action = args[0].toLowerCase();

      switch (action) {
        case 'import':
          await this.handleImport(message, user);
          break;

        case 'export':
          await this.handleExport(client, message, user, args.slice(1));
          break;

        case 'approve':
          await this.handleBulkApprove(message, user);
          break;

        case 'categorize':
          await this.handleBulkCategorize(message, user);
          break;

        default:
          await this.showMenu(message);
      }
    } catch (error) {
      logger.error('Error in bulk command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
    }
  },

  /**
   * Show bulk operations menu
   */
  async showMenu(message) {
    const menuText =
      '╔══════════════════════════════════════════════════╗\n' +
      '║  📦 OPERASI BULK                                 ║\n' +
      '║  Pilih operasi yang diinginkan                   ║\n' +
      '╚══════════════════════════════════════════════════╝\n\n' +
      '*📥 Import*\n' +
      '`/bulk import`\n' +
      'Import transaksi dari file Excel/CSV\n\n' +
      '*📤 Export*\n' +
      '`/bulk export [hari]`\n' +
      'Export transaksi ke Excel\n\n' +
      '*✅ Bulk Approve*\n' +
      '`/bulk approve`\n' +
      'Approve semua transaksi pending\n\n' +
      '*🏷️ Bulk Categorize*\n' +
      '`/bulk categorize`\n' +
      'Kategorisasi otomatis transaksi\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 Hanya admin yang dapat menggunakan fitur ini';

    await message.reply(menuText);
  },

  /**
   * Handle import from file
   */
  async handleImport(message, user) {
    try {
      // Check permission
      if (!['admin', 'superadmin'].includes(user.role)) {
        await message.reply('❌ Hanya admin yang dapat import transaksi.');
        return;
      }

      const instructionText =
        '*📥 IMPORT TRANSAKSI*\n\n' +
        'Kirim file Excel atau CSV dengan format:\n\n' +
        '```\n' +
        'tanggal | jenis | jumlah | deskripsi | kategori\n' +
        '2026-01-10 | paket | 500000 | Penjualan | Penjualan Paket\n' +
        '2026-01-10 | jajan | 50000 | Bensin | Transportasi\n' +
        '```\n\n' +
        '──────────────────────────────────────────────────\n' +
        '💡 Jenis: paket, utang, jajan\n' +
        '💡 Download template: `/bulk template`\n' +
        '💡 Kirim file setelah pesan ini';

      await message.reply(instructionText);

      // Store state untuk next message
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_IMPORT_FILE');
      await sessionManager.setData(user.phone_number, 'import', { userId: user.id });
    } catch (error) {
      logger.error('Error in import handler', { error: error.message });
      throw error;
    }
  },

  /**
   * Process import file
   */
  async processImportFile(message, user, media) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Determine file type
      const mimeType = media.mimetype;
      const isExcel = mimeType.includes('spreadsheet') || mimeType.includes('excel');
      const isCSV = mimeType.includes('csv');

      if (!isExcel && !isCSV) {
        await message.reply('❌ Format file tidak didukung. Hanya Excel (.xlsx) atau CSV.');
        return;
      }

      // Save file temporarily
      const tempPath = path.join(
        './storage/temp',
        `import-${Date.now()}.${isExcel ? 'xlsx' : 'csv'}`
      );
      const buffer = Buffer.from(media.data, 'base64');

      await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
      await fs.promises.writeFile(tempPath, buffer);

      // Parse file
      let rows = [];

      if (isExcel) {
        rows = await this._parseExcel(tempPath);
      } else {
        rows = await this._parseCSV(tempPath);
      }

      // Process each row
      await message.reply(`📊 Memproses ${rows.length} transaksi...`);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          // Validate row
          if (!row.tanggal || !row.jenis || !row.jumlah || !row.deskripsi) {
            throw new Error(`Baris ${i + 1}: Data tidak lengkap`);
          }

          // Get or create category
          let categoryId = null;
          if (row.kategori) {
            const category = await categoryService.getCategoryByName(row.kategori);
            categoryId = category ? category.id : null;
          }

          // Create transaction
          await transactionService.createTransaction(
            user.id,
            row.jenis,
            parseFloat(row.jumlah),
            row.deskripsi,
            {
              category_id: categoryId,
              transaction_date: new Date(row.tanggal),
              customer_name: row.pelanggan || null,
            }
          );

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: error.message,
          });
        }
      }

      // Clean up temp file
      await fs.promises.unlink(tempPath);

      // Send results
      const resultText =
        '*✅ IMPORT SELESAI*\n\n' +
        `✅ Berhasil: ${results.success}\n` +
        `❌ Gagal: ${results.failed}\n\n` +
        (results.errors.length > 0
          ? 'Errors:\n' +
            results.errors
              .slice(0, 5)
              .map((e) => `- Baris ${e.row}: ${e.error}`)
              .join('\n')
          : '');

      await message.reply(resultText);

      logger.info('Bulk import completed', {
        userId: user.id,
        success: results.success,
        failed: results.failed,
      });
    } catch (error) {
      logger.error('Error processing import file', { error: error.message });
      await message.reply('❌ Gagal memproses file. Periksa format file.');
    }
  },

  /**
   * Handle export to Excel
   */
  async handleExport(client, message, user, args) {
    try {
      const days = parseInt(args[0]) || 30;

      if (days > 365) {
        await message.reply('❌ Maksimal export 365 hari.');
        return;
      }

      await message.reply(`📤 Mengexport transaksi ${days} hari terakhir...`);

      const dayjs = require('dayjs');
      const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();
      const endDate = dayjs().endOf('day').toDate();

      // Get transactions
      const transactions = await transactionService.getUserTransactions(user.id, {
        startDate,
        endDate,
      });

      if (transactions.length === 0) {
        await message.reply('📭 Tidak ada transaksi dalam periode ini.');
        return;
      }

      // Create Excel
      const filePath = await this._createExcelExport(transactions, user, days);

      // Send file
      const { MessageMedia } = require('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(filePath);

      await client.sendMessage(message.from, media, {
        caption: `📊 Export transaksi ${days} hari terakhir\nTotal: ${transactions.length} transaksi`,
      });

      // Clean up
      setTimeout(() => {
        fs.promises.unlink(filePath).catch(() => {});
      }, 60000);

      logger.info('Bulk export completed', {
        userId: user.id,
        count: transactions.length,
      });
    } catch (error) {
      logger.error('Error in export handler', { error: error.message });
      await message.reply('❌ Gagal export transaksi.');
    }
  },

  /**
   * Handle bulk approve
   */
  async handleBulkApprove(message, user) {
    try {
      // Check permission
      if (!['admin', 'superadmin'].includes(user.role)) {
        await message.reply('❌ Hanya admin yang dapat bulk approve.');
        return;
      }

      const pending = await transactionService.getPendingTransactions();

      if (pending.length === 0) {
        await message.reply('✅ Tidak ada transaksi pending.');
        return;
      }

      const confirmText =
        '*⚠️ KONFIRMASI BULK APPROVE*\n\n' +
        `Akan approve ${pending.length} transaksi pending.\n\n` +
        'Balas "YA" untuk konfirmasi.';

      await message.reply(confirmText);

      // Store state
      const sessionManager = require('../../utils/sessionManager');
      await sessionManager.setState(user.phone_number, 'AWAITING_BULK_APPROVE_CONFIRM');
      await sessionManager.setData(user.phone_number, 'bulk_approve', {
        count: pending.length,
      });
    } catch (error) {
      logger.error('Error in bulk approve handler', { error: error.message });
      throw error;
    }
  },

  /**
   * Execute bulk approve
   */
  async executeBulkApprove(user) {
    try {
      const pending = await transactionService.getPendingTransactions();

      let approved = 0;
      let failed = 0;

      for (const transaction of pending) {
        try {
          await transactionService.approveTransaction(transaction.transaction_id, user.id);
          approved++;
        } catch (error) {
          failed++;
          logger.error('Error approving transaction', {
            transactionId: transaction.transaction_id,
            error: error.message,
          });
        }
      }

      return { approved, failed, total: pending.length };
    } catch (error) {
      logger.error('Error executing bulk approve', { error: error.message });
      throw error;
    }
  },

  /**
   * Handle bulk categorize
   */
  async handleBulkCategorize(message, user) {
    try {
      // Check permission
      if (!['admin', 'superadmin'].includes(user.role)) {
        await message.reply('❌ Hanya admin yang dapat bulk categorize.');
        return;
      }

      await message.reply('🏷️ Mengkategorisasi transaksi...');

      // Get uncategorized transactions
      const knex = require('../../database/connection');
      const uncategorized = await knex('transactions')
        .whereNull('category_id')
        .where({ status: 'approved' })
        .orderBy('transaction_date', 'desc')
        .limit(100);

      if (uncategorized.length === 0) {
        await message.reply('✅ Semua transaksi sudah dikategorisasi.');
        return;
      }

      let categorized = 0;
      let skipped = 0;

      // Auto-categorize based on description
      for (const transaction of uncategorized) {
        try {
          const categoryId = await this._autoCategorize(transaction);

          if (categoryId) {
            await knex('transactions')
              .where({ id: transaction.id })
              .update({ category_id: categoryId });
            categorized++;
          } else {
            skipped++;
          }
        } catch (error) {
          skipped++;
        }
      }

      const resultText =
        '*✅ KATEGORISASI SELESAI*\n\n' +
        `✅ Berhasil: ${categorized}\n` +
        `⏭️ Dilewati: ${skipped}\n` +
        `📊 Total: ${uncategorized.length}`;

      await message.reply(resultText);
    } catch (error) {
      logger.error('Error in bulk categorize', { error: error.message });
      await message.reply('❌ Gagal kategorisasi transaksi.');
    }
  },

  /**
   * Auto-categorize transaction based on description
   * @private
   */
  async _autoCategorize(transaction) {
    const description = transaction.description.toLowerCase();

    const rules = [
      { keywords: ['pulsa', 'paket data'], slug: 'komunikasi' },
      { keywords: ['bensin', 'bbm', 'parkir'], slug: 'transportasi' },
      { keywords: ['makan', 'nasi', 'ayam', 'bakso'], slug: 'konsumsi' },
      { keywords: ['listrik', 'air', 'pdam'], slug: 'utilitas' },
      { keywords: ['paket', 'penjualan', 'jual'], slug: 'penjualan-paket' },
      { keywords: ['utang', 'bayar', 'cicil'], slug: 'piutang-terbayar' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some((keyword) => description.includes(keyword))) {
        const categoryRepo = require('../../database/repositories/categoryRepository');
        const category = await categoryRepo.findBySlug(rule.slug);
        return category ? category.id : null;
      }
    }

    return null;
  },

  /**
   * Parse Excel file
   * @private
   */
  async _parseExcel(filePath) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      rows.push({
        tanggal: row.getCell(1).value,
        jenis: row.getCell(2).value,
        jumlah: row.getCell(3).value,
        deskripsi: row.getCell(4).value,
        kategori: row.getCell(5).value,
        pelanggan: row.getCell(6).value,
      });
    });

    return rows;
  },

  /**
   * Parse CSV file
   * @private
   */
  async _parseCSV(filePath) {
    const csv = require('csv-parser');

    return new Promise((resolve, reject) => {
      const rows = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve(rows);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  },

  /**
   * Create Excel export
   * @private
   */
  async _createExcelExport(transactions, user, days) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Add headers
    worksheet.columns = [
      { header: 'Tanggal', key: 'date', width: 20 },
      { header: 'ID Transaksi', key: 'id', width: 20 },
      { header: 'Jenis', key: 'type', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Deskripsi', key: 'description', width: 30 },
      { header: 'Jumlah', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };

    // Add data
    transactions.forEach((trx) => {
      worksheet.addRow({
        date: formatDate(trx.transaction_date, 'DD/MM/YYYY HH:mm'),
        id: trx.transaction_id,
        type: trx.type,
        category: trx.category_name || '-',
        description: trx.description,
        amount: parseFloat(trx.amount),
        status: trx.status,
      });
    });

    // Add summary
    const summaryRow = worksheet.rowCount + 2;
    worksheet.getCell(`E${summaryRow}`).value = 'TOTAL:';
    worksheet.getCell(`E${summaryRow}`).font = { bold: true };
    worksheet.getCell(`F${summaryRow}`).value = {
      formula: `SUM(F2:F${worksheet.rowCount - 1})`,
    };
    worksheet.getCell(`F${summaryRow}`).font = { bold: true };

    // Save file
    const fileName = `export-${user.id}-${Date.now()}.xlsx`;
    const exportPath = path.join('./storage/temp', fileName);

    await fs.promises.mkdir(path.dirname(exportPath), { recursive: true });
    await workbook.xlsx.writeFile(exportPath);

    return exportPath;
  },
};
