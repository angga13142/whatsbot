// File: src/commands/common/statusCommand.js

const { createBox } = require('../../utils/richText');

module.exports = {
  name: 'status',
  description: 'Info akun',
  async execute(message) {
    const user = message.user;

    const info = `
👤 Nama: ${user.full_name}
📱 No HP: ${user.phone_number}
🏷️ Role: ${user.role.toUpperCase()}
✅ Status: ${user.status}
    `.trim();

    await message.reply(createBox('INFO AKUN', info));
  },
};
