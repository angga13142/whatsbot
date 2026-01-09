// File: src/templates/messages/errorTemplate.js

const { bold } = require('../../utils/richText');

module.exports = {
  errorGeneric(message) {
    return `❌ ${message || 'Terjadi kesalahan sistem.'}`;
  },

  errorUnauthorized() {
    return `⛔ ${bold('AKSES DITOLAK')}\nAnda tidak memiliki izin untuk perintah ini.`;
  },

  errorInvalidInput(details) {
    return `⚠️ ${bold('INPUT TIDAK VALID')}\n${details}`;
  },
};
