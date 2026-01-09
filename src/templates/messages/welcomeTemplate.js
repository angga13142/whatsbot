// File: src/templates/messages/welcomeTemplate.js

const { createBox, bold } = require('../../utils/richText');
const { ROLES } = require('../../utils/constants');

module.exports = {
  welcomeGeneral(user, appName = 'Cashflow Bot') {
    const header = createBox(`${appName}`, `Halo, ${bold(user.full_name)}! 👋`);

    let roleText = '';
    switch (user.role) {
      case ROLES.SUPERADMIN:
        roleText = '👑 Superadmin Checkpoint';
        break;
      case ROLES.ADMIN:
        roleText = '👔 Admin Dashboard';
        break;
      case ROLES.KARYAWAN:
        roleText = '💼 Menu Karyawan';
        break;
      case ROLES.INVESTOR:
        roleText = '👀 Investor View';
        break;
    }

    const content = `
${roleText}

Silakan ketik ${bold('/help')} untuk melihat fitur yang tersedia.

Atau gunakan perintah cepat:
• ${bold('/catat')} : Input transaksi
• ${bold('/laporan')} : Cek laporan hari ini
• ${bold('/status')} : Cek status akun
`;

    return header + content;
  },
};
