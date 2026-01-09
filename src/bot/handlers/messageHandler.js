// File: src/bot/handlers/messageHandler.js

/**
 * Message Handler
 *
 * Purpose: Route incoming messages to commands or NLP parser.
 *
 * @module bot/handlers/messageHandler
 */

const logger = require('../../utils/logger');
const { checkUserRegistered } = require('../middleware/authMiddleware');
const commandRegistry = require('../../commands/index'); // Will create later
// const sessionManager ...

module.exports = {
  async handleMessage(message) {
    try {
      // Log incoming message (debug)
      logger.debug('Message received', { body: message.body, from: message.from });

      // Ignore broadcast/status messages
      if (message.from.includes('status@broadcast')) return;

      // Pipeline execution
      // 1. Check Registration (and attach user)
      await checkUserRegistered(message, async () => {
        return true;
      });

      // Note: checkUserRegistered sends reply and returns false if failed.
      // But wrapping it in this pipeline style is tricky without full middleware engine.
      // Let's simplify:

      // Re-implement standard flow
      const contact = await message.getContact();
      const phoneNumber = contact.number;
      const userService = require('../../services/userService');
      const user = await userService.getUserByPhone(phoneNumber);

      if (!user) {
        // Optionally reply only if it looks like a command
        if (message.body.startsWith('/') || message.body.startsWith('!')) {
          await message.reply('⚠️ Nomor Anda belum terdaftar.');
        }
        return;
      }

      message.user = user; // Attach user to message context

      // 2. Command Route
      // logic to parse slash commands or natural text
      await commandRegistry.execute(message);
    } catch (error) {
      logger.error('Error handling message', { error: error.message });
      await message.reply('❌ Terjadi kesalahan sistem internal.');
    }
  },
};
