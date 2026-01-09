// File: src/commands/superadmin/sqlCommand.js

const db = require('../../database/connection');
const { monospace } = require('../../utils/richText');

module.exports = {
  name: 'sql',
  description: 'Run SQL Query',
  async execute(message, args) {
    // Safety check is assumed (AuthMiddleware prevents non-superadmin)
    const query = args.join(' ');
    if (!query) {
      await message.reply('⚠️ Requires query string.');
      return;
    }

    // Block destructive commands for safety in this rough version
    if (query.toLowerCase().includes('drop') || query.toLowerCase().includes('delete')) {
      await message.reply('⛔ Destructive queries blocked in bot interface.');
      return;
    }

    try {
      const result = await db.raw(query);
      const json = JSON.stringify(result, null, 2).substring(0, 1000); // Truncate
      await message.reply(monospace(json));
    } catch (e) {
      await message.reply(`❌ SQL Error: ${e.message}`);
    }
  },
};
