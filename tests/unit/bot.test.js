const WhatsAppBot = require('../../src/index');

describe('WhatsAppBot', () => {
  let bot;

  beforeEach(() => {
    bot = new WhatsAppBot();
  });

  afterEach(async () => {
    if (bot.isReady) {
      await bot.stop();
    }
  });

  test('should create a bot instance', () => {
    expect(bot).toBeInstanceOf(WhatsAppBot);
    expect(bot.isReady).toBe(false);
  });

  test('should initialize the bot', async () => {
    await bot.initialize();
    expect(bot.isReady).toBe(true);
  });

  test('should start the bot', async () => {
    await bot.start();
    expect(bot.isReady).toBe(true);
  });

  test('should stop the bot', async () => {
    await bot.start();
    await bot.stop();
    expect(bot.isReady).toBe(false);
  });
});
