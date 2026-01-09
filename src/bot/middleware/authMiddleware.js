// File: src/bot/middleware/authMiddleware.js

/**
 * Auth Middleware
 *
 * Purpose: Verify user identity and permissions before processing commands.
 *
 * @module bot/middleware/authMiddleware
 */

const userService = require('../../services/userService');
const { MESSAGES } = require('../../utils/constants');

module.exports = {
  async checkUserRegistered(message, next) {
    const contact = await message.getContact();
    const phoneNumber = contact.number;

    const user = await userService.getUserByPhone(phoneNumber);

    if (!user) {
      // Allow registration/contact logic or strictly block
      // For now, blocking unregistered specific commands
      // But maybe allow "start" if it triggers registration?
      // In this Phase 1, we assume specific set of users added by Admin.
      // So block if not exists.

      // Exception: Allow receiving pairing code or specific debug ? No.

      // Let's attach user to message object for downstream use
      await message.reply(MESSAGES.NOT_REGISTERED);
      return false; // Stop processing
    }

    message.user = user;
    return next();
  },

  checkRole(allowedRoles) {
    return async (message, next) => {
      if (!message.user) {
        // Should have been checked by checkUserRegistered
        return false;
      }

      if (!allowedRoles.includes(message.user.role)) {
        await message.reply(MESSAGES.UNAUTHORIZED);
        return false;
      }

      return next();
    };
  },
};
