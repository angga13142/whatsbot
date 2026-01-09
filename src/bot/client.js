/**
 * WhatsApp Client
 *
 * Manages WhatsApp Web. js client instance, authentication,
 * and connection lifecycle.
 *
 * Features:
 * - Support QR code and pairing code authentication
 * - Auto-reconnect on disconnect
 * - Graceful shutdown
 * - Event handler setup
 * - Client state management
 */

const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config/app');
const whatsappConfig = require('../config/whatsapp');
const logger = require('../utils/logger');
const eventHandler = require('./handlers/eventHandler');

class WhatsAppClient {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize WhatsApp client
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Prevent multiple initializations
      if (this.isInitializing) {
        logger.warn('Client is already initializing');
        return;
      }

      this.isInitializing = true;

      // Log startup
      logger.info('Initializing WhatsApp client... ', {
        authMethod: config.bot.authMethod,
        phoneNumber: config.bot.phoneNumber,
      });

      // Create client
      this.client = new Client(whatsappConfig.getWhatsAppConfig());

      // Setup event handlers
      this._setupEventHandlers();

      // Initialize
      await this.client.initialize();
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', { error: error.message });
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    this.client.on('qr', (qr) => eventHandler.onQR(qr));
    this.client.on('pairing_code', (code) => eventHandler.onPairingCode(code));
    this.client.on('authenticated', () => eventHandler.onAuthenticated());
    this.client.on('auth_failure', (msg) => eventHandler.onAuthFailure(msg));
    this.client.on('ready', () => {
      this.isReady = true;
      this.isInitializing = false;
      this.reconnectAttempts = 0;
      eventHandler.onReady(this.client.info);
    });
    this.client.on('message', async (message) => {
      const messageHandler = require('./handlers/messageHandler');
      await messageHandler.handleMessage(this.client, message);
    });
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      eventHandler.onDisconnected(reason);
      this._handleReconnect();
    });
    this.client.on('loading_screen', (percent, message) => {
      eventHandler.onLoadingScreen(percent, message);
    });
  }

  /**
   * Handle reconnection logic
   * @private
   */
  async _handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached.  Please restart the application.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.initialize().catch((error) => {
        logger.error('Reconnection failed', { error: error.message });
      });
    }, delay);
  }

  /**
   * Request pairing code
   * @param {string} phoneNumber - Phone number in format 628xxxxxxxxx
   * @returns {Promise<void>}
   */
  async requestPairingCode(phoneNumber) {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number is required for pairing code');
      }

      logger.info('Requesting pairing code', { phoneNumber });
      await this.client.requestPairingCode(phoneNumber);
    } catch (error) {
      logger.error('Failed to request pairing code', { error: error.message });
      throw error;
    }
  }

  /**
   * Send message to user
   * @param {string} to - Phone number (with @c.us suffix)
   * @param {string} message - Message text
   * @returns {Promise<Object>} Sent message object
   */
  async sendMessage(to, message) {
    try {
      if (!this.isReady) {
        throw new Error('Client is not ready');
      }

      // Ensure @c.us suffix
      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

      logger.debug('Sending message', { to: chatId, messageLength: message.length });
      const sentMessage = await this.client.sendMessage(chatId, message);

      logger.info('Message sent successfully', {
        to: chatId,
        messageId: sentMessage.id._serialized,
      });

      return sentMessage;
    } catch (error) {
      logger.error('Failed to send message', {
        to,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get client instance
   * @returns {Client} WhatsApp client
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if client is ready
   * @returns {boolean} Ready status
   */
  isClientReady() {
    return this.isReady;
  }

  /**
   * Get client info
   * @returns {Object|null} Client info
   */
  getClientInfo() {
    if (!this.isReady || !this.client) {
      return null;
    }
    return this.client.info;
  }

  /**
   * Graceful shutdown
   * @returns {Promise<void>}
   */
  async destroy() {
    try {
      if (!this.client) {
        return;
      }

      logger.info('Shutting down WhatsApp client...');

      this.isReady = false;
      await this.client.destroy();

      logger.info('WhatsApp client shut down successfully');
    } catch (error) {
      logger.error('Error during client shutdown', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
const whatsappClient = new WhatsAppClient();
module.exports = whatsappClient;
