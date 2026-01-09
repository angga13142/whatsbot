/**
 * WhatsApp Event Handler
 *
 * Handles all WhatsApp client events and provides
 * appropriate responses/logging
 */

const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const logger = require('../../utils/logger');
const { createBox, createDivider, bold } = require('../../utils/richText');

module.exports = {
  /**
   * Handle QR code event
   * @param {string} qr - QR code string
   */
  onQR(qr) {
    console.log('\n');
    console.log(
      chalk.yellow(createBox('QR CODE AUTHENTICATION', 'Scan kode QR di bawah dengan WhatsApp', 60))
    );
    console.log('\n');

    // Generate QR code
    qrcode.generate(qr, { small: true });

    console.log('\n');
    console.log(chalk.cyan('📱 Cara scan: '));
    console.log(chalk.gray('   1. Buka WhatsApp di smartphone'));
    console.log(chalk.gray('   2. Tap Menu (⋮) → Linked Devices'));
    console.log(chalk.gray('   3. Tap "Link a Device"'));
    console.log(chalk.gray('   4. Scan QR code di atas'));
    console.log('\n');

    logger.info('QR code generated for authentication');
  },

  /**
   * Handle pairing code event
   * @param {string} code - Pairing code
   */
  onPairingCode(code) {
    console.log('\n');
    console.log(chalk.cyan('╔════════════════════════════════════════════════════════╗'));
    console.log(
      chalk.cyan('║') +
        chalk.bold.white('   🔐 PAIRING CODE AUTHENTICATION                    ') +
        chalk.cyan('║')
    );
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝'));
    console.log('\n');
    console.log(chalk.yellow('  📱 Kode Pairing Anda:'));
    console.log('\n');
    console.log(chalk.bold.green(`     ${code}`));
    console.log('\n');
    console.log(chalk.gray(createDivider('━', 56)));
    console.log(chalk.white('  📋 Cara Menggunakan:'));
    console.log(chalk.gray('     1. Buka WhatsApp di smartphone Anda'));
    console.log(chalk.gray('     2. Tap Menu (⋮) → Linked Devices'));
    console.log(chalk.gray('     3. Tap "Link a Device"'));
    console.log(chalk.gray('     4. Tap "Link with phone number instead"'));
    console.log(chalk.gray(`     5. Masukkan kode:  ${code}`));
    console.log(chalk.gray(createDivider('━', 56)));
    console.log('\n');
    console.log(chalk.yellow('  ⏰ Kode akan expire dalam 60 detik'));
    console.log(chalk.gray('     Jika expired, restart bot untuk kode baru\n'));

    logger.info('Pairing code generated', { code });
  },

  /**
   * Handle authenticated event
   */
  onAuthenticated() {
    console.log('\n');
    console.log(chalk.green('✅ Authentication successful!'));
    console.log('\n');

    logger.info('WhatsApp client authenticated successfully');
  },

  /**
   * Handle authentication failure
   * @param {string} message - Error message
   */
  onAuthFailure(message) {
    console.log('\n');
    console.log(chalk.red('❌ Authentication failed! '));
    console.log(chalk.red(`   Error: ${message}`));
    console.log('\n');
    console.log(chalk.yellow('💡 Troubleshooting: '));
    console.log(chalk.gray('   1. Delete .wwebjs_auth folder'));
    console.log(chalk.gray('   2. Restart the bot'));
    console.log(chalk.gray('   3. Try authentication again'));
    console.log('\n');

    logger.error('WhatsApp authentication failed', { message });
  },

  /**
   * Handle ready event
   * @param {Object} clientInfo - Client information
   */
  onReady(clientInfo) {
    console.log('\n');
    console.log(chalk.green('╔════════════════════════════════════════════════════════╗'));
    console.log(
      chalk.green('║') +
        chalk.bold.white('   ✅ BOT SIAP DIGUNAKAN!                             ') +
        chalk.green('║')
    );
    console.log(chalk.green('╚════════════════════════════════════════════════════════╝'));
    console.log('\n');
    console.log(chalk.white('  📱 Informasi Bot:'));
    console.log(chalk.gray(`     • Phone: ${clientInfo.wid.user}`));
    console.log(chalk.gray(`     • Name: ${clientInfo.pushname}`));
    console.log(chalk.gray(`     • Platform: ${clientInfo.platform}`));
    console.log(chalk.gray(`     • Battery: ${clientInfo.battery}%`));
    console.log('\n');
    console.log(chalk.cyan('  🎯 Bot Status:  ONLINE'));
    console.log(chalk.gray(`     • Started: ${new Date().toLocaleString('id-ID')}`));
    console.log(chalk.gray('     • Type:  Cashflow Tracker'));
    console.log('\n');
    console.log(chalk.green(createDivider('━', 56)));
    console.log(chalk.yellow('  💡 Bot siap menerima perintah!\n'));

    logger.info('WhatsApp bot is ready', {
      phone: clientInfo.wid.user,
      name: clientInfo.pushname,
      platform: clientInfo.platform,
    });
  },

  /**
   * Handle disconnected event
   * @param {string} reason - Disconnection reason
   */
  onDisconnected(reason) {
    console.log('\n');
    console.log(chalk.red('⚠️ Bot disconnected!'));
    console.log(chalk.yellow(`   Reason: ${reason}`));
    console.log(chalk.cyan('   Attempting to reconnect...'));
    console.log('\n');

    logger.warn('WhatsApp client disconnected', { reason });
  },

  /**
   * Handle loading screen event
   * @param {number} percent - Loading percentage
   * @param {string} message - Loading message
   */
  onLoadingScreen(percent, message) {
    process.stdout.write(`\r⏳ Loading:  ${percent}% - ${message}      `);

    if (percent === 100) {
      console.log('\n');
    }

    logger.debug('Loading screen', { percent, message });
  },
};
