// File: src/commands/karyawan/catatCommand.js

const transactionService = require('../../services/transactionService');
const parser = require('../../utils/parser');
const { TRANSACTION_TYPES } = require('../../utils/constants');
const { transactionCreated } = require('../../templates/messages/transactionTemplate');

// Note: Full interactive session form state is complex.
// Implementing "Smart Input" (One-shot NLP) for Phase 1 MVP.
// Interactive multi-step requires sessionManager hook which we created but didn't fully wire in middleware.

module.exports = {
  name: 'catat',
  description: 'Input transaksi',
  async execute(message, args) {
    const rawText = args.join(' ');

    // 1. If empty, give instructions
    if (!rawText) {
      await message.reply(`
💡 *Cara Penggunaan:*
Ketik: /catat [jenis] [nominal] [keterangan]

Contoh:
• /catat paket 50rb Jual pulsa
• /catat jajan 15rb Beli bensin
      `);
      return;
    }

    // 2. Parse Input
    // Simple regex or mapping: TYPE AMOUNT DESC...
    let type = parser.parseTransactionIntent(rawText);
    const parsedAmount = parser.parseNaturalAmount(rawText);

    // Default type fallback if first word is valid type
    const firstWord = args[0].toLowerCase();
    if (Object.values(TRANSACTION_TYPES).includes(firstWord)) {
      type = firstWord;
    }

    if (!type) {
      await message.reply('⚠️ Jenis transaksi tidak dikenali (paket/utang/jajan).');
      return;
    }

    if (!parsedAmount || parsedAmount.amount <= 0) {
      await message.reply('⚠️ Nominal tidak valid.');
      return;
    }

    // Description is everything else
    // Remove type and amount substrings roughly (naive approach for MVP)
    // Ideally use properly structured args if provided
    let description = rawText; // simplifed

    const data = {
      type,
      amount: parsedAmount.amount,
      description: description, // In real app, clean this string
      category: 'General',
    };

    try {
      const trx = await transactionService.createTransaction(message.user.id, data);
      await message.reply(transactionCreated(trx));
    } catch (e) {
      await message.reply(`❌ Gagal mencatat: ${e.message}`);
    }
  },
};
