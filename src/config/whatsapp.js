/**
 * WhatsApp Configuration
 *
 * Provides WhatsApp client configuration
 */

const { LocalAuth } = require('whatsapp-web.js');

module.exports = {
  /**
   * Get WhatsApp client configuration
   * @returns {Object} Client options
   */
  getWhatsAppConfig() {
    return {
      authStrategy: new LocalAuth({
        clientId: process.env.WWEBJS_CLIENT_ID || 'cashflow-bot',
        dataPath: process.env.WWEBJS_AUTH_PATH || './storage/auth',
      }),
      puppeteer: {
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
      // Optional: Web version cache
      webVersionCache: {
        type: 'remote',
        remotePath:
          'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
    };
  },

  /**
   * Get bot configuration
   * @returns {Object} Bot config
   */
  getBotConfig() {
    return {
      phoneNumber: process.env.BOT_PHONE_NUMBER,
      authMethod: process.env.AUTH_METHOD || 'pairing', // 'qr' or 'pairing'
      name: process.env.BOT_NAME || 'Cashflow Bot',
    };
  },
};
