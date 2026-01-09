/**
 * Conversation Flow Handler
 *
 * Manages multi-step conversation flows (transaction input, etc.)
 * Routes to appropriate handler based on current state
 */

const sessionManager = require('../../utils/sessionManager');
const transactionService = require('../../services/transactionService');
const parser = require('../../utils/parser');
const validator = require('../../utils/validator');
const { SESSION_STATES, TRANSACTION_TYPES } = require('../../utils/constants');
const { bold, createDivider } = require('../../utils/richText');
const { formatCurrency } = require('../../utils/formatter');
const transactionTemplate = require('../../templates/messages/transactionTemplate');
const logger = require('../../utils/logger');

module.exports = {
  /**
   * Handle conversation state
   * @param {Client} client - WhatsApp client
   * @param {Message} message - Message object
   * @param {Object} user - User object
   * @param {Object} session - Session object
   */
  async handleState(client, message, user, session) {
    const messageBody = message.body.trim();

    // Check for cancel
    if (['batal', 'cancel', 'stop'].includes(messageBody.toLowerCase())) {
      await this._cancelFlow(message, user);
      return;
    }

    // Route based on state
    switch (session.current_state) {
      case SESSION_STATES.AWAITING_TRANSACTION_TYPE:
        await this._handleTransactionType(message, user, session, messageBody);
        break;

      case SESSION_STATES.AWAITING_AMOUNT:
        await this._handleAmount(message, user, session, messageBody);
        break;

      case SESSION_STATES.AWAITING_DESCRIPTION:
        await this._handleDescription(message, user, session, messageBody);
        break;

      case SESSION_STATES.AWAITING_CUSTOMER_NAME:
        await this._handleCustomerName(message, user, session, messageBody);
        break;

      case SESSION_STATES.AWAITING_IMAGE:
        await this._handleImage(message, user, session);
        break;

      case SESSION_STATES.AWAITING_CONFIRMATION:
        await this._handleConfirmation(message, user, session, messageBody);
        break;

      default:
        logger.warn('Unknown session state', {
          userId: user.id,
          state: session.current_state,
        });
        await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Handle transaction type selection
   * @private
   */
  async _handleTransactionType(message, user, session, input) {
    let type = null;

    // Parse input
    if (['1', 'paket', 'penjualan'].includes(input.toLowerCase())) {
      type = TRANSACTION_TYPES.PAKET;
    } else if (['2', 'utang', 'piutang'].includes(input.toLowerCase())) {
      type = TRANSACTION_TYPES.UTANG;
    } else if (['3', 'jajan', 'pengeluaran'].includes(input.toLowerCase())) {
      type = TRANSACTION_TYPES.JAJAN;
    }

    if (!type) {
      await message.reply('❌ Pilihan tidak valid. Ketik 1, 2, atau 3.');
      return;
    }

    // Save type and move to next step
    await sessionManager.setData(user.phone_number, 'transaction', { type });
    await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_AMOUNT);

    const emoji = type === 'paket' ? '📦' : type === 'utang' ? '💳' : '🍔';

    const amountText =
      `${emoji} ${bold('Jenis:  ' + type.toUpperCase())}\n\n` +
      '💰 *Berapa nominalnya?*\n\n' +
      '📝 Cara input:\n' +
      '• Angka biasa:  `250000`\n' +
      '• Dengan rb: `250rb`\n' +
      '• Dengan jt: `1.5jt`\n' +
      '• Natural: `jual 5 paket @50rb`\n\n' +
      createDivider('━', 40) +
      '\n' +
      '💡 Masukkan jumlah transaksi';

    await message.reply(amountText);

    logger.debug('Transaction type selected', {
      userId: user.id,
      type,
    });
  },

  /**
   * Handle amount input
   * @private
   */
  async _handleAmount(message, user, session, input) {
    try {
      // Parse amount using NLP parser
      const parsed = parser.parseNaturalAmount(input);

      if (!parsed.amount || parsed.amount <= 0) {
        await message.reply('❌ Jumlah tidak valid. Silakan masukkan jumlah yang benar.');
        return;
      }

      // Validate amount
      const validation = validator.validateAmount(parsed.amount);
      if (!validation.valid) {
        await message.reply(`❌ ${validation.error}`);
        return;
      }

      // Save amount and move to next step
      const currentData = await sessionManager.getData(user.phone_number, 'transaction');
      currentData.amount = parsed.amount;

      if (parsed.details.quantity) {
        currentData.quantity = parsed.details.quantity;
        currentData.unitPrice = parsed.details.unitPrice;
      }

      await sessionManager.setData(user.phone_number, 'transaction', currentData);

      // If type is 'utang', ask for customer name
      if (currentData.type === TRANSACTION_TYPES.UTANG) {
        await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_CUSTOMER_NAME);

        await message.reply(
          `💰 ${bold('Jumlah: ' + formatCurrency(parsed.amount))}\n\n` +
            '👤 *Siapa yang berutang?*\n\n' +
            'Masukkan nama pelanggan:'
        );
      } else {
        // Go to description
        await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_DESCRIPTION);

        await message.reply(
          `💰 ${bold('Jumlah: ' + formatCurrency(parsed.amount))}\n\n` +
            '📝 *Deskripsi transaksi? *\n\n' +
            'Masukkan keterangan singkat:'
        );
      }

      logger.debug('Amount entered', {
        userId: user.id,
        amount: parsed.amount,
      });
    } catch (error) {
      logger.error('Error parsing amount', {
        userId: user.id,
        input,
        error: error.message,
      });
      await message.reply('❌ Format jumlah tidak dikenali. Coba lagi dengan format yang benar.');
    }
  },

  /**
   * Handle customer name (for utang)
   * @private
   */
  async _handleCustomerName(message, user, session, input) {
    const customerName = input.trim();

    if (customerName.length < 2) {
      await message.reply('❌ Nama terlalu pendek. Masukkan nama yang valid.');
      return;
    }

    // Save customer name and move to description
    const currentData = await sessionManager.getData(user.phone_number, 'transaction');
    currentData.customer_name = customerName;
    await sessionManager.setData(user.phone_number, 'transaction', currentData);
    await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_DESCRIPTION);

    await message.reply(
      `👤 ${bold('Pelanggan: ' + customerName)}\n\n` +
        '📝 *Deskripsi transaksi?*\n\n' +
        'Masukkan keterangan singkat:'
    );

    logger.debug('Customer name entered', {
      userId: user.id,
      customerName,
    });
  },

  /**
   * Handle description
   * @private
   */
  async _handleDescription(message, user, session, input) {
    const description = input.trim();

    if (description.length < 3) {
      await message.reply('❌ Deskripsi terlalu pendek.  Minimal 3 karakter.');
      return;
    }

    // Save description and move to image upload (optional)
    const currentData = await sessionManager.getData(user.phone_number, 'transaction');
    currentData.description = description;
    await sessionManager.setData(user.phone_number, 'transaction', currentData);
    await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_IMAGE);

    await message.reply(
      `📝 ${bold('Deskripsi: ' + description)}\n\n` +
        '📸 *Upload foto?  (Opsional)*\n\n' +
        '• Kirim foto bukti transaksi, atau\n' +
        '• Ketik "skip" untuk lewati'
    );

    logger.debug('Description entered', {
      userId: user.id,
    });
  },

  /**
   * Handle image upload
   * @private
   */
  async _handleImage(message, user, session) {
    const messageBody = message.body.trim().toLowerCase();

    // Check if skip
    if (['skip', 'lewat', 'tidak'].includes(messageBody)) {
      await this._showConfirmation(message, user, session);
      return;
    }

    // Check if has media
    if (message.hasMedia) {
      // TODO: Download and save image
      // For now, just save the info that image exists
      const currentData = await sessionManager.getData(user.phone_number, 'transaction');
      currentData.has_image = true;
      await sessionManager.setData(user.phone_number, 'transaction', currentData);

      await message.reply('✅ Foto diterima! ');
    }

    await this._showConfirmation(message, user, session);
  },

  /**
   * Show confirmation
   * @private
   */
  async _showConfirmation(message, user, session) {
    const transactionData = await sessionManager.getData(user.phone_number, 'transaction');

    await sessionManager.setState(user.phone_number, SESSION_STATES.AWAITING_CONFIRMATION);

    const emoji =
      transactionData.type === 'paket' ? '📦' : transactionData.type === 'utang' ? '💳' : '🍔';

    let confirmText = '';
    confirmText += bold('✅ KONFIRMASI TRANSAKSI') + '\n\n';
    confirmText += `${emoji} Jenis: ${bold(transactionData.type.toUpperCase())}\n`;
    confirmText += `💰 Jumlah: ${bold(formatCurrency(transactionData.amount))}\n`;

    if (transactionData.customer_name) {
      confirmText += `👤 Pelanggan: ${transactionData.customer_name}\n`;
    }

    confirmText += `📝 Deskripsi: ${transactionData.description}\n`;

    if (transactionData.has_image) {
      confirmText += `📸 Foto: Ada\n`;
    }

    confirmText += '\n' + createDivider('━', 40) + '\n';
    confirmText += '❓ Data sudah benar?\n\n';
    confirmText += '• Ketik "ya" untuk simpan\n';
    confirmText += '• Ketik "batal" untuk batalkan';

    await message.reply(confirmText);
  },

  /**
   * Handle confirmation
   * @private
   */
  async _handleConfirmation(message, user, session, input) {
    const lowerInput = input.toLowerCase();

    if (!['ya', 'yes', 'y', 'ok', 'oke'].includes(lowerInput)) {
      await message.reply('Ketik "ya" untuk konfirmasi, atau "batal" untuk membatalkan.');
      return;
    }

    try {
      // Get transaction data
      const transactionData = await sessionManager.getData(user.phone_number, 'transaction');

      // Create transaction
      const transaction = await transactionService.createTransaction(
        user.id,
        transactionData.type,
        transactionData.amount,
        transactionData.description,
        {
          customer_name: transactionData.customer_name,
          quantity: transactionData.quantity,
          unit_price: transactionData.unitPrice,
          has_image: transactionData.has_image,
        }
      );

      // Clear session
      await sessionManager.deleteSession(user.phone_number);

      // Send success message
      const successText = transactionTemplate.transactionCreated(transaction);
      await message.reply(successText);

      logger.info('Transaction created via flow', {
        userId: user.id,
        transactionId: transaction.transaction_id,
      });
    } catch (error) {
      logger.error('Error creating transaction', {
        userId: user.id,
        error: error.message,
      });
      await message.reply(`❌ Gagal menyimpan transaksi:\n${error.message}`);
      await sessionManager.deleteSession(user.phone_number);
    }
  },

  /**
   * Cancel flow
   * @private
   */
  async _cancelFlow(message, user) {
    await sessionManager.deleteSession(user.phone_number);
    await message.reply('❌ Transaksi dibatalkan.');

    logger.info('Transaction flow cancelled', { userId: user.id });
  },
};
