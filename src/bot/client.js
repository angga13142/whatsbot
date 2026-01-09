// File: src/bot/client.js

/**
 * WhatsApp Client Wrapper
 *
 * Purpose: Singleton wrapper for whatsapp-web.js Client.
 * Handles initialization, events, and lifecycle.
 *
 * @module bot/client
 */

const { Client } = require('whatsapp-web.js');
const config = require('../config/whatsapp');
const appConfig = require('../config/app');
const logger = require('../utils/logger');
const { registerEventHandlers } = require('./handlers/eventHandler');

let client = null;

module.exports = {
  initialize() {
    if (client) return client;

    logger.info('Initializing WhatsApp Client...', { authMethod: appConfig.bot.authMethod });

    client = new Client(config);

    // Register all event handlers
    registerEventHandlers(client);

    client.initialize().catch((err) => {
      logger.error('Failed to initialize client', { error: err.message });
    });

    return client;
  },

  getClient() {
    if (!client) throw new Error('Client not initialized. Call initialize() first.');
    return client;
  },

  async requestPairingCode() {
    if (!client) throw new Error('Client not initialized');
    const phoneNumber = appConfig.bot.phoneNumber;
    if (!phoneNumber) throw new Error('BOT_PHONE_NUMBER not set in env');

    try {
      const code = await client.requestPairingCode(phoneNumber);
      logger.info(`Pairing Code Requested`, { code });
      return code;
    } catch (err) {
      logger.error('Failed to request pairing code', { error: err.message });
      throw err;
    }
  },
};
