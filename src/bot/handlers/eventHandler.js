// File: src/bot/handlers/eventHandler.js

/**
 * Event Handler
 *
 * Purpose: Register callbacks for WhatsApp Client events.
 *
 * @module bot/handlers/eventHandler
 */

const qrcode = require('qrcode-terminal');
const logger = require('../../utils/logger');
const { handleMessage } = require('./messageHandler');
const appConfig = require('../../config/app');

module.exports = {
  registerEventHandlers(client) {
    client.on('qr', (qr) => {
      if (appConfig.bot.authMethod === 'qr') {
        logger.info('QR Code received, please scan:');
        qrcode.generate(qr, { small: true });
      } else {
        logger.debug('QR Code received but ignored (using pairing code)');
      }
    });

    client.on('ready', () => {
      logger.info('✅ Client is ready!');
      logger.info(`Logged in as: ${client.info.wid.user}`);

      // Set status
      client.setStatus(`Cashflow Bot v${appConfig.app.version}`);
    });

    client.on('authenticated', () => {
      logger.info('AUTHENTICATED');
    });

    client.on('auth_failure', (msg) => {
      logger.error('AUTHENTICATION FAILURE', { message: msg });
    });

    client.on('loading_screen', (percent, message) => {
      logger.info(`LOADING: ${percent}% - ${message}`);
    });

    client.on('message', async (msg) => {
      await handleMessage(msg);
    });

    client.on('disconnected', (reason) => {
      logger.warn('Client was disconnected', { reason });
    });
  },
};
