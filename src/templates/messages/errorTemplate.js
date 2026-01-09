/**
 * Error Message Templates
 *
 * User-friendly error messages in Bahasa Indonesia
 */

const { bold, addEmoji, createDivider } = require('../../utils/richText');

module.exports = {
  /**
   * User not registered error
   * @returns {string} Error message
   */
  errorNotRegistered() {
    return (
      addEmoji(bold('AKSES DITOLAK'), '🚫') +
      '\n\n' +
      'Anda belum terdaftar dalam sistem.\n\n' +
      createDivider('━', 50) +
      '\n\n' +
      '💡 ' +
      bold('Cara Mendaftar:') +
      '\n' +
      '• Hubungi admin untuk registrasi\n' +
      '• Admin akan menambahkan nomor Anda\n' +
      '• Setelah terdaftar, Anda bisa langsung menggunakan bot\n\n' +
      '📞 Silakan hubungi admin Anda'
    );
  },

  /**
   * User suspended error
   * @param {string} reason - Suspension reason (optional)
   * @returns {string} Error message
   */
  errorSuspended(reason = null) {
    let message = '';
    message += addEmoji(bold('AKUN DITANGGUHKAN'), '⚠️') + '\n\n';
    message += 'Akun Anda sedang dalam status suspended.\n';

    if (reason) {
      message += `\nAlasan: ${reason}\n`;
    }

    message += '\n' + createDivider('━', 50) + '\n\n';
    message += '💡 Hubungi admin untuk informasi lebih lanjut\n';
    message += '📞 Admin akan membantu mengatasi masalah ini';

    return message;
  },

  /**
   * Permission denied error
   * @param {string} action - Action that was denied (optional)
   * @returns {string} Error message
   */
  errorPermissionDenied(action = null) {
    let message = '';
    message += addEmoji(bold('AKSES DITOLAK'), '🚫') + '\n\n';

    if (action) {
      message += `Anda tidak memiliki izin untuk:  ${action}\n\n`;
    } else {
      message += 'Anda tidak memiliki izin untuk melakukan aksi ini.\n\n';
    }

    message += createDivider('━', 50) + '\n\n';
    message += '💡 Fitur ini hanya untuk role tertentu\n';
    message += '📋 Ketik /help untuk melihat perintah yang tersedia';

    return message;
  },

  /**
   * Invalid input error
   * @param {string} field - Field that is invalid (optional)
   * @returns {string} Error message
   */
  errorInvalidInput(field = 'Input') {
    return (
      addEmoji(bold('INPUT TIDAK VALID'), '❌') +
      '\n\n' +
      `${field} yang Anda masukkan tidak valid.\n\n` +
      createDivider('━', 50) +
      '\n\n' +
      '💡 Periksa kembali format input Anda\n' +
      '📋 Ketik /help jika memerlukan bantuan'
    );
  },

  /**
   * Transaction not found error
   * @param {string} transactionId - Transaction ID
   * @returns {string} Error message
   */
  errorTransactionNotFound(transactionId) {
    return (
      addEmoji(bold('TRANSAKSI TIDAK DITEMUKAN'), '❌') +
      '\n\n' +
      `Transaksi dengan ID ${bold(transactionId)} tidak ditemukan.\n\n` +
      createDivider('━', 50) +
      '\n\n' +
      '💡 Pastikan ID transaksi benar\n' +
      '💡 Format: TRX-YYYYMMDD-NNN\n' +
      '📋 Gunakan /history untuk melihat transaksi Anda'
    );
  },

  /**
   * Database error
   * @returns {string} Error message
   */
  errorDatabaseError() {
    return (
      addEmoji(bold('TERJADI KESALAHAN SISTEM'), '⚠️') +
      '\n\n' +
      'Maaf, terjadi kesalahan saat memproses permintaan Anda.\n\n' +
      createDivider('━', 50) +
      '\n\n' +
      '💡 Silakan coba lagi dalam beberapa saat\n' +
      '💡 Jika masalah berlanjut, hubungi admin\n\n' +
      '🔄 Bot akan mencoba memperbaiki koneksi.. .'
    );
  },

  /**
   * Rate limit error
   * @returns {string} Error message
   */
  errorRateLimit() {
    return (
      addEmoji(bold('TERLALU BANYAK PERMINTAAN'), '⏸️') +
      '\n\n' +
      'Anda mengirim terlalu banyak pesan dalam waktu singkat.\n\n' +
      createDivider('━', 50) +
      '\n\n' +
      '💡 Tunggu beberapa detik sebelum mengirim lagi\n' +
      '💡 Ini untuk mencegah spam dan menjaga performa bot\n\n' +
      '⏳ Silakan tunggu sebentar...'
    );
  },

  /**
   * 2FA required error
   * @returns {string} Error message
   */
  error2FARequired() {
    return (
      addEmoji(bold('VERIFIKASI DIPERLUKAN'), '🔐') +
      '\n\n' +
      'Aksi ini memerlukan verifikasi 2FA.\n\n' +
      createDivider('━', 50) +
      '\n\n' +
      '🔐 Masukkan PIN 6 digit Anda\n\n' +
      '💡 Jika belum setup PIN, hubungi admin\n' +
      '💡 PIN untuk keamanan transaksi sensitif'
    );
  },

  /**
   * Invalid command error
   * @returns {string} Error message
   */
  errorInvalidCommand() {
    return (
      addEmoji(bold('PERINTAH TIDAK DIKENALI'), '❓') +
      '\n\n' +
      'Perintah yang Anda masukkan tidak dikenali.\n\n' +
      createDivider('━', 50) +
      '\n\n' +
      '💡 Ketik /help untuk melihat daftar perintah\n' +
      '💡 Atau gunakan bahasa natural:  "catat transaksi", "laporan"'
    );
  },
};
