// File: src/config/whatsapp.js

/**
 * WhatsApp Client Configuration
 *
 * Purpose: specific configuration for the whatsapp-web.js client.
 *
 * @module config/whatsapp
 */

const { LocalAuth } = require('whatsapp-web.js');

const appConfig = require('./app');

const AUTH_PATH = process.env.WWEBJS_AUTH_PATH || './storage/auth';

module.exports = {
  authStrategy: new LocalAuth({
    clientId: process.env.WWEBJS_CLIENT_ID || 'cashflow-bot',
    dataPath: AUTH_PATH,
  }),

  puppeteer: {
    headless: appConfig.bot.puppeteer.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  },

  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',

  qrMaxRetries: 5,
};
