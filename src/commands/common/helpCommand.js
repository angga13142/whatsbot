/**
 * Help Command
 *
 * Shows available commands for user's role
 */

const commandRegistry = require('../index');
const { createBox, createDivider, bold } = require('../../utils/richText');
const logger = require('../../utils/logger');

module.exports = {
  async handler(client, message, user, args) {
    try {
      // Get all available commands for user
      const commands = commandRegistry.getAllCommands(user.role);

      // Group commands by category
      const commonCmds = commands.filter((cmd) => ['start', 'help', 'status'].includes(cmd.name));
      const mainCmds = commands.filter((cmd) => !['start', 'help', 'status'].includes(cmd.name));

      // Build help message
      let helpText = '';

      helpText += createBox('📚 BANTUAN', `Daftar perintah untuk ${user.role}`, 50);
      helpText += '\n\n';

      // Common commands
      if (commonCmds.length > 0) {
        helpText += bold('🔹 Perintah Umum:') + '\n';
        for (const cmd of commonCmds) {
          helpText += `• ${cmd.usage}\n`;
          helpText += `  ${cmd.description}\n\n`;
        }
        helpText += createDivider('─', 50) + '\n\n';
      }

      // Main commands
      if (mainCmds.length > 0) {
        helpText += bold('🔹 Perintah Utama:') + '\n';
        for (const cmd of mainCmds) {
          helpText += `• ${cmd.usage}\n`;
          helpText += `  ${cmd.description}\n\n`;
        }
      }

      helpText += createDivider('━', 50) + '\n';
      helpText += '💡 Tip:  Anda juga bisa gunakan bahasa natural\n';
      helpText += '   Contoh: "catat transaksi", "laporan hari ini"';

      await message.reply(helpText);

      logger.info('Help command executed', {
        userId: user.id,
        commandCount: commands.length,
      });
    } catch (error) {
      logger.error('Error in help command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('Terjadi kesalahan. Silakan coba lagi.');
    }
  },
};
