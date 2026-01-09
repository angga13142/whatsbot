const WhatsAppBot = require('./src/index');

async function main() {
  const bot = new WhatsAppBot();
  await bot.start();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await bot.stop();
    process.exit(0);
  });
}

main().catch(console.error);
