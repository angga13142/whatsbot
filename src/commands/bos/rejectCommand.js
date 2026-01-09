// File: src/commands/bos/rejectCommand.js

const transactionService = require('../../services/transactionService');

module.exports = {
  name: 'reject',
  description: 'Tolak transaksi',
  async execute(message, args) {
    const trxId = args[0];

    if (!trxId) {
      await message.reply('⚠️ Masukkan ID Transaksi. Contoh: /reject 15');
      return;
    }

    try {
      const trx = await transactionService.rejectTransaction(parseInt(trxId), message.user.id);
      await message.reply(`✅ Transaksi ${trx.transaction_id} ditolak.`);
    } catch (e) {
      await message.reply(`❌ Gagal reject: ${e.message}`);
    }
  },
};
