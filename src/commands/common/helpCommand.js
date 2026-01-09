// File: src/commands/common/helpCommand.js

const { bold } = require('../../utils/richText');

module.exports = {
  name: 'help',
  description: 'Daftar perintah',
  async execute(message) {
    // In a real app, generate dynamically from registry.
    // For MVP, static string based on role.

    const role = message.user.role;
    let content = `Daftar perintah untuk ${bold(role.toUpperCase())}:\n\n`;

    content += `${bold('/start')} - Menu utama\n`;
    content += `${bold('/status')} - Cek status profil\n`;

    if (role === 'karyawan' || role === 'superadmin') {
      content += `\n${bold('🛠️ TRANSAKSI')}\n`;
      content += `${bold('/catat')} - Input transaksi baru\n`;
      content += `${bold('/laporan')} - Laporan harian Anda\n`;
    }

    if (role === 'admin' || role === 'superadmin') {
      content += `\n${bold('👔 ADMIN')}\n`;
      content += `${bold('/approve [id]')} - Setujui transaksi\n`;
      content += `${bold('/reject [id]')} - Tolak transaksi\n`;
      content += `${bold('/pending')} - Lihat pending list\n`;
      content += `${bold('/addkaryawan')} - Tambah user baru\n`;
    }

    await message.reply(content);
  },
};
