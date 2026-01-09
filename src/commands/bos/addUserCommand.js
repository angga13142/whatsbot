// File: src/commands/bos/addUserCommand.js

const userService = require('../../services/userService');
const { ROLES } = require('../../utils/constants');

module.exports = {
  name: 'addkaryawan',
  description: 'Tambah karyawan baru',
  async execute(message, args) {
    // Expected: /addkaryawan [phone] [name...]
    const phone = args[0];
    const name = args.slice(1).join(' ');

    if (!phone || !name) {
      await message.reply('⚠️ Format salah. Contoh: /addkaryawan 08123456789 Budi Santoso');
      return;
    }

    try {
      await userService.createUser(
        {
          phone_number: phone,
          full_name: name,
          role: ROLES.KARYAWAN,
        },
        message.user.id
      );

      await message.reply(`✅ Berhasil menambahkan karyawan: ${name} (${phone})`);
    } catch (e) {
      await message.reply(`❌ Gagal menambah user: ${e.message}`);
    }
  },
};
