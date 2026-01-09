// File: src/commands/common/startCommand.js

const { welcomeGeneral } = require('../../templates/messages/welcomeTemplate');

module.exports = {
  name: 'start',
  description: 'Mulai bot',
  async execute(message) {
    const response = welcomeGeneral(message.user);
    await message.reply(response);
  },
};
