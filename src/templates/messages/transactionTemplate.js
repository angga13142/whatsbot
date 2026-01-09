// File: src/templates/messages/transactionTemplate.js

const { bold, monospace } = require('../../utils/richText');
const { formatCurrency } = require('../../utils/formatter');

module.exports = {
  transactionCreated(transaction) {
    const header = `✅ 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 𝗗𝗜𝗖𝗔𝗧𝗔𝗧!`;

    return `
${header}

🆔 ID: ${monospace(transaction.transaction_id)}
💰 Nominal: ${bold(formatCurrency(transaction.amount))}
📝 Ket: ${transaction.description || '-'}
📂 Tipe: ${transaction.type.toUpperCase()}
✅ Status: ${transaction.status}
    `.trim();
  },

  transactionPending(transaction) {
    const header = `⏳ 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗠𝗘𝗡𝗨𝗡𝗚𝗚𝗨 𝗔𝗣𝗣𝗥𝗢𝗩𝗔L`;

    return `
${header}

🆔 ID: ${monospace(transaction.transaction_id)}
💰 Nominal: ${bold(formatCurrency(transaction.amount))}
👤 Oleh: ${transaction.user_name}
    `.trim();
  },
};
