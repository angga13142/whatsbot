/**
 * Start Command
 *
 * Welcome message based on user role
 */

const welcomeTemplate = require('../../templates/messages/welcomeTemplate');
const logger = require('../../utils/logger');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Get appropriate welcome message based on role
      let welcomeMessage;

      switch (user.role) {
        case 'superadmin':
          welcomeMessage = welcomeTemplate.welcomeSuperadmin(user);
          break;
        case 'admin':
          welcomeMessage = welcomeTemplate.welcomeAdmin(user);
          break;
        case 'karyawan':
          welcomeMessage = welcomeTemplate.welcomeKaryawan(user);
          break;
        case 'investor':
          welcomeMessage = welcomeTemplate.welcomeInvestor(user);
          break;
        default:
          welcomeMessage = 'Selamat datang! ';
      }

      await message.reply(welcomeMessage);

      logger.info('Start command executed', {
        userId: user.id,
        role: user.role,
      });
    } catch (error) {
      logger.error('Error in start command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
  },
};
