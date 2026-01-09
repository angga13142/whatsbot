// File: src/commands/bos/approveCommand.js

const transactionService = require('../../services/transactionService');

module.exports = {
  name: 'approve',
  description: 'Setujui transaksi',
  async execute(message, args) {
    const trxId = args[0]; // expect ID like 5 (database ID) for simplicity in MVP, or full TRX string

    if (!trxId) {
      await message.reply('⚠️ Masukkan ID Transaksi (Database ID). Contoh: /approve 15');
      return;
    }

    try {
      const trx = await transactionService.approveTransaction(parseInt(trxId), message.user.id);
      await message.reply(`✅ Transaksi ${trx.transaction_id} berhasil disetujui.`);

      // Notify creator?
      // const creator = await userService.getUserById(trx.user_id);
      // notificationService.notifyTransactionApproved(trx, creator.phone_number);
    } catch (e) {
      await message.reply(`❌ Gagal approve: ${e.message}`);
    }
  },
};
