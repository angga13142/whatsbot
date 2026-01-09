/**
 * Message Handler
 *
 * Main message routing and processing logic
 * Validates users, checks permissions, routes commands,
 * and manages conversation state
 */

const logger = require('../../utils/logger');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');
const sessionManager = require('../../utils/sessionManager');
const commandRegistry = require('../../commands/index');
const { ERROR_MESSAGES, SESSION_STATES } = require('../../utils/constants');
const errorTemplate = require('../../templates/messages/errorTemplate');

module.exports = {
  /**
   * Handle incoming message
   * @param {Client} client - WhatsApp client
   * @param {Message} message - WhatsApp message object
   */
  async handleMessage(client, message) {
    try {
      // Skip if message is from status broadcast
      if (message.from === 'status@broadcast') {
        return;
      }

      // Skip if message is from bot itself
      const botInfo = client.info;
      if (message.from.includes(botInfo.wid.user)) {
        return;
      }

      // Extract sender info
      const phoneNumber = message.from.replace('@c.us', '');
      const messageBody = message.body.trim();

      logger.info('Received message', {
        from: phoneNumber,
        body: messageBody,
        hasMedia: message.hasMedia,
      });

      // Check rate limit
      const rateLimitCheck = await rateLimitMiddleware.checkRateLimit(phoneNumber);
      if (!rateLimitCheck.allowed) {
        await message.reply(errorTemplate.errorRateLimit());
        return;
      }

      // Check if user is registered
      const user = await authMiddleware.checkUserRegistered(phoneNumber);
      if (!user) {
        await message.reply(errorTemplate.errorNotRegistered());
        logger.warn('Unregistered user attempted to use bot', { phoneNumber });
        return;
      }

      // Check if user is active
      const isActive = await authMiddleware.checkUserActive(phoneNumber);
      if (!isActive) {
        await message.reply(errorTemplate.errorSuspended());
        logger.warn('Suspended user attempted to use bot', {
          phoneNumber,
          userId: user.id,
        });
        return;
      }

      // Get or create session
      let session = await sessionManager.getSession(phoneNumber);
      if (!session) {
        session = await sessionManager.createSession(phoneNumber, SESSION_STATES.IDLE);
      }

      // Check if user is in a conversation flow
      if (session.current_state !== SESSION_STATES.IDLE) {
        // Handle conversation flow (multi-step forms)
        await this._handleConversationFlow(client, message, user, session);
        return;
      }

      // Detect if message is a command (starts with /)
      if (messageBody.startsWith('/')) {
        await this._handleCommand(client, message, user);
        return;
      }

      // Handle natural language input
      await this._handleNaturalLanguage(client, message, user);
    } catch (error) {
      logger.error('Error handling message', {
        error: error.message,
        stack: error.stack,
      });

      // Send generic error message to user
      try {
        await message.reply(errorTemplate.errorDatabaseError());
      } catch (replyError) {
        logger.error('Failed to send error message', {
          error: replyError.message,
        });
      }
    }
  },

  /**
   * Handle command message
   * @param {Client} client - WhatsApp client
   * @param {Message} message - Message object
   * @param {Object} user - User object
   * @private
   */
  async _handleCommand(client, message, user) {
    try {
      const messageBody = message.body.trim();
      const parts = messageBody.slice(1).split(' '); // Remove / and split
      const commandName = parts[0].toLowerCase();
      const args = parts.slice(1);

      logger.info('Processing command', {
        userId: user.id,
        command: commandName,
        args,
      });

      // Get command from registry
      const command = commandRegistry.getCommand(commandName, user.role);

      if (!command) {
        await message.reply(errorTemplate.errorInvalidCommand());
        logger.warn('Invalid command', {
          userId: user.id,
          command: commandName,
        });
        return;
      }

      // Check permissions
      const hasPermission = await authMiddleware.checkPermission(user, command.permission);

      if (!hasPermission) {
        await message.reply(errorTemplate.errorPermissionDenied(commandName));
        logger.warn('Permission denied', {
          userId: user.id,
          command: commandName,
          role: user.role,
        });
        return;
      }

      // Execute command
      await command.handler(client, message, user, args);

      // Log successful execution
      await authMiddleware.logActivity(user.id, 'execute_command', 'command', null, {
        command: commandName,
        args,
      });
    } catch (error) {
      logger.error('Error executing command', {
        error: error.message,
        userId: user.id,
      });
      throw error;
    }
  },

  /**
   * Handle conversation flow (multi-step forms)
   * @param {Client} client - WhatsApp client
   * @param {Message} message - Message object
   * @param {Object} user - User object
   * @param {Object} session - Session object
   * @private
   */
  async _handleConversationFlow(client, message, user, session) {
    logger.info('Processing conversation flow', {
      userId: user.id,
      state: session.current_state,
    });

    // Import conversation flow handler
    const conversationFlow = require('../../commands/flows/conversationFlow');
    await conversationFlow.handleState(client, message, user, session);
  },

  /**
   * Handle natural language input
   * @param {Client} client - WhatsApp client
   * @param {Message} message - Message object
   * @param {Object} user - User object
   * @private
   */
  async _handleNaturalLanguage(client, message, user) {
    const messageBody = message.body.trim().toLowerCase();

    // Check for common intents
    if (
      messageBody.includes('catat') ||
      messageBody.includes('transaksi') ||
      messageBody.includes('input')
    ) {
      // Start transaction input flow
      const catatCommand = require('../../commands/karyawan/catatCommand');
      await catatCommand.handler(client, message, user, []);
      return;
    }

    if (messageBody.includes('laporan') || messageBody.includes('report')) {
      // Show report
      const laporanCommand = require('../../commands/karyawan/laporanCommand');
      await laporanCommand.handler(client, message, user, []);
      return;
    }

    if (
      messageBody.includes('help') ||
      messageBody.includes('bantuan') ||
      messageBody.includes('?')
    ) {
      // Show help
      const helpCommand = require('../../commands/common/helpCommand');
      await helpCommand.handler(client, message, user, []);
      return;
    }

    // No intent detected, show hint
    await message.reply(
      '💡 *Tidak mengerti perintah Anda.*\\n\\n' +
        'Ketik salah satu:\\n' +
        '• `/help` - Lihat daftar perintah\\n' +
        '• `catat transaksi` - Catat transaksi baru\\n' +
        '• `laporan` - Lihat laporan hari ini'
    );

    logger.info('No intent detected in natural language', {
      userId: user.id,
      message: messageBody,
    });
  },
};
