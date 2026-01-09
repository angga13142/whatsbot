/**
 * Welcome Message Templates
 *
 * Role-specific welcome messages with quick actions
 */

const { createBox, bold, createDivider, addEmoji } = require('../../utils/richText');
const { EMOJIS } = require('../../utils/constants');
const { formatPhoneNumber } = require('../../utils/formatter');

module.exports = {
  /**
   * Welcome message for superadmin
   * @param {Object} user - User object
   * @returns {string} Formatted welcome message
   */
  welcomeSuperadmin(user) {
    let message = '';

    message += createBox('👑 SELAMAT DATANG SUPERADMIN', user.full_name, 55);
    message += '\n\n';
    message += '🎯 *Anda memiliki akses penuh ke sistem*\n\n';

    message += bold('⚡ Quick Actions:') + '\n';
    message += '• `/catat` - Catat transaksi\n';
    message += '• `/laporan` - Lihat laporan lengkap\n';
    message += '• `/pending` - Transaksi menunggu approval\n';
    message += '• `/users` - Kelola semua user\n';
    message += '• `/sql` - Jalankan query SQL\n';
    message += '• `/logs` - Lihat audit logs\n';
    message += '\n';

    message += createDivider('━', 55) + '\n';
    message += '💡 Ketik `/help` untuk melihat semua perintah\n';
    message += '📊 Status:  ' + addEmoji('ONLINE', '✅');

    return message;
  },

  /**
   * Welcome message for admin
   * @param {Object} user - User object
   * @returns {string} Formatted welcome message
   */
  welcomeAdmin(user) {
    let message = '';

    message += createBox('👔 SELAMAT DATANG ADMIN', user.full_name, 55);
    message += '\n\n';
    message += '🎯 *Anda dapat mengelola operasional bisnis*\n\n';

    message += bold('⚡ Quick Actions:') + '\n';
    message += '• `/catat` - Catat transaksi\n';
    message += '• `/laporan` - Lihat laporan harian\n';
    message += '• `/pending` - Approve transaksi\n';
    message += '• `/addkaryawan` - Tambah karyawan\n';
    message += '• `/karyawan [nama]` - Laporan per karyawan\n';
    message += '\n';

    message += createDivider('━', 55) + '\n';
    message += '💡 Ketik `/help` untuk melihat semua perintah\n';
    message += '📊 Status: ' + addEmoji('ONLINE', '✅');

    return message;
  },

  /**
   * Welcome message for karyawan
   * @param {Object} user - User object
   * @returns {string} Formatted welcome message
   */
  welcomeKaryawan(user) {
    let message = '';

    message += createBox('💼 SELAMAT DATANG KARYAWAN', user.full_name, 55);
    message += '\n\n';
    message += '🎯 *Siap mencatat transaksi hari ini! *\n\n';

    message += bold('⚡ Quick Actions:') + '\n';
    message += '• `/catat` - Catat transaksi baru\n';
    message += '• `/laporan` - Lihat laporan hari ini\n';
    message += '• `/history` - Riwayat transaksi\n';
    message += '\n';

    message += bold('💡 Tips:') + '\n';
    message += 'Anda juga bisa langsung ketik:\n';
    message += '• "catat transaksi" - Mulai input\n';
    message += '• "laporan" - Lihat laporan\n';
    message += '\n';

    message += createDivider('━', 55) + '\n';
    message += '📲 Ketik `/help` untuk bantuan lengkap\n';
    message += '📊 Status: ' + addEmoji('SIAP', '✅');

    return message;
  },

  /**
   * Welcome message for investor
   * @param {Object} user - User object
   * @returns {string} Formatted welcome message
   */
  welcomeInvestor(user) {
    let message = '';

    message += createBox('👀 SELAMAT DATANG INVESTOR', user.full_name, 55);
    message += '\n\n';
    message += '🎯 *Akses laporan keuangan tersedia*\n\n';

    message += bold('⚡ Yang Bisa Anda Lakukan: ') + '\n';
    message += '• `/laporan` - Lihat ringkasan keuangan\n';
    message += '• `/status` - Status akun Anda\n';
    message += '\n';

    message += bold('ℹ️ Catatan:') + '\n';
    message += '• Laporan yang ditampilkan berupa ringkasan\n';
    message += '• Data detail tidak ditampilkan (privacy)\n';
    message += '• Laporan lengkap dikirim bulanan\n';
    message += '\n';

    message += createDivider('━', 55) + '\n';
    message += '📲 Ketik `/help` untuk bantuan';

    return message;
  },
};
