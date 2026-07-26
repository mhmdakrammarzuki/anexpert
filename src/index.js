import process from 'node:process';
import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { registerDebugHandlers } from './handlers/debug.js';
import { registerDownloaderHandler } from './handlers/downloader.js';
import { registerMenuHandler } from './handlers/menu.js';
import { registerStartHandler } from './handlers/start.js';
import { registerStickerHandler } from './handlers/sticker.js';
import { StorageManager } from './services/storageManager.js';

const startedAt = Date.now();
const bot = new Telegraf(config.telegramBotToken);
const storageManager = new StorageManager(bot.telegram);

registerStartHandler(bot);
registerMenuHandler(bot);
registerStickerHandler(bot, storageManager);
registerDownloaderHandler(bot, storageManager);
registerDebugHandlers(bot, startedAt);

bot.catch((error) => {
  console.error(JSON.stringify({ level: 'error', component: 'node-gateway', error: error.message }));
});

await storageManager.processPendingDeletions();

if (config.useWebhook && config.webhookUrl) {
  await bot.launch({
    webhook: {
      domain: config.webhookUrl,
      port: config.port
    }
  });
  console.log(JSON.stringify({ level: 'info', component: 'node-gateway', mode: 'webhook', port: config.port }));
} else {
  await bot.launch();
  console.log(JSON.stringify({ level: 'info', component: 'node-gateway', mode: 'polling' }));
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
