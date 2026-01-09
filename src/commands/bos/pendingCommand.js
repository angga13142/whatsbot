// File: src/commands/bos/pendingCommand.js

const transactionRepository = require('../../database/repositories/transactionRepository');
const { formatCurrency } = require('../../utils/formatter');
const { monospace } = require('../../utils/richText');

module.exports = {
  name: 'pending',
  description: 'Lihat transaksi pending',
  async execute(message) {
    const list = await transactionRepository.findPending();

    if (list.length === 0) {
      await message.reply('✅ Tidak ada transaksi pending.');
      return;
    }

    let content = '⏳ DAFTAR TRANSAKSI PENDING\n\n';
    list.forEach((trx) => {
      content += `🆔 DB-ID: ${trx.id}\n`;
      content += `ref: ${monospace(trx.transaction_id)}\n`;
      content += `👤 ${trx.user_name}\n`;
      content += `💰 ${formatCurrency(trx.amount)}\n`;
      content += `-----------------\n`;
    });

    await message.reply(content);
  },
};
