/**
 * Add Karyawan Command
 *
 * Add new karyawan user
 * Usage: /addkaryawan [phone] [full name]
 */

const userService = require('../../services/userService');
const { ROLES } = require('../../utils/constants');
const logger = require('../../utils/logger');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Validate arguments
      if (args.length < 2) {
        await message.reply(
          '❌ *Format salah!*\n\n' +
            'Penggunaan:\n' +
            '`/addkaryawan [nomor HP] [nama lengkap]`\n\n' +
            'Contoh:\n' +
            '`/addkaryawan 08123456789 Budi Santoso`'
        );
        return;
      }

      const phoneNumber = args[0];
      const fullName = args.slice(1).join(' ');

      // Create karyawan
      const newUser = await userService.createUser(phoneNumber, fullName, ROLES.KARYAWAN, user.id);

      // Send success message
      const successText =
        '✅ *Karyawan berhasil ditambahkan! *\n\n' +
        `📱 Nomor:  ${newUser.phone_number}\n` +
        `👤 Nama: ${newUser.full_name}\n` +
        `🏷️ Role: ${newUser.role}\n\n` +
        '💡 User sudah bisa menggunakan bot. ';

      await message.reply(successText);

      logger.info('Karyawan added', {
        addedUserId: newUser.id,
        addedBy: user.id,
      });

      // TODO: Send welcome message to new user
      // const welcomeMsg = welcomeTemplate.welcomeKaryawan(newUser);
      // await client.sendMessage(newUser.phone_number, welcomeMsg);
    } catch (error) {
      logger.error('Error in addkaryawan command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply(`❌ Gagal menambahkan karyawan:\n${error.message}`);
    }
  },
};
