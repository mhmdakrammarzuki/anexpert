// anexpert/node-gateway/src/bot.js
//
// Entry point. Sama perannya dengan bot.py versi lama: registrasi semua
// command, lalu jalankan bot (polling atau webhook).
const TelegramBotRaw = require('node-telegram-bot-api');
const TelegramBot = TelegramBotRaw.default || TelegramBotRaw
const express = require('express');
const Config = require('./config');

const { startHandler } = require('./handlers/start');
const { menuHandler } = require('./handlers/menu');
const { stickerHandler } = require('./handlers/sticker');
const { downloaderHandler, downloaderButtonCallback } = require('./handlers/downloader');
const {
  statusHandler,
  healthHandler,
  uptimeHandler,
  infoHandler,
  setBotStartTime,
} = require('./handlers/debug');
const { processPendingDeletions } = require('./utils/storageManager');

function maskToken(text) {
  if (!Config.TELEGRAM_BOT_TOKEN) return text;
  return text.split(Config.TELEGRAM_BOT_TOKEN).join(':anexpert_bot');
}

function log(...args) {
  console.log(new Date().toISOString(), '-', maskToken(args.join(' ')));
}

async function main() {
  const useWebhook = Config.USE_WEBHOOK && Config.WEBHOOK_URL;

  const bot = new TelegramBot(Config.TELEGRAM_BOT_TOKEN, {
    polling: !useWebhook,
  });

  // --- Registrasi command, setara CommandHandler versi Python ---
  bot.onText(/^\/start/, (msg) => startHandler(bot, msg));
  bot.onText(/^\/menu/, (msg) => menuHandler(bot, msg));
  bot.onText(/^\/(sticker|stiker)(?:@\S+)?\s*(.*)$/s, (msg, match) => stickerHandler(bot, msg, match[2]));
  bot.onText(/^\/dl(?:@\S+)?\s*(.*)$/s, (msg, match) => downloaderHandler(bot, msg, match[1]));

  // --- Debug commands (admin only, dicek di dalam masing-masing handler) ---
  bot.onText(/^\/status/, (msg) => statusHandler(bot, msg));
  bot.onText(/^\/health/, (msg) => healthHandler(bot, msg));
  bot.onText(/^\/uptime/, (msg) => uptimeHandler(bot, msg));
  bot.onText(/^\/info/, (msg) => infoHandler(bot, msg));

  // --- Callback tombol inline (setara CallbackQueryHandler pattern="^dl_") ---
  bot.on('callback_query', (query) => {
    if (query.data && query.data.startsWith('dl_')) {
      downloaderButtonCallback(bot, query);
    }
  });

  // --- Gambar dengan caption mengandung "/sticker" (setara MessageHandler PHOTO/DOCUMENT.IMAGE) ---
  bot.on('photo', (msg) => {
    if (msg.caption && /\/sticker/i.test(msg.caption)) {
      stickerHandler(bot, msg, '');
    }
  });
  bot.on('document', (msg) => {
    const isImage = msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/');
    if (isImage && msg.caption && /\/sticker/i.test(msg.caption)) {
      stickerHandler(bot, msg, '');
    }
  });

  bot.on('polling_error', (err) => log('polling_error:', err.message));

  // --- Startup: catat waktu mulai + proses ulang jadwal hapus pesan tertunda ---
  setBotStartTime(Date.now());
  await processPendingDeletions(bot);

  if (useWebhook) {
    const app = express();
    app.use(express.json());
    app.post(`/bot${Config.TELEGRAM_BOT_TOKEN}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    await bot.setWebHook(`${Config.WEBHOOK_URL}/bot${Config.TELEGRAM_BOT_TOKEN}`);
    app.listen(Config.PORT, () => {
      log(`Bot 'anexpert' sedang berjalan (webhook) pada port ${Config.PORT}...`);
    });
  } else {
    log("Bot 'anexpert' sedang berjalan (polling)...");
  }
}

main().catch((err) => {
  console.error('Fatal error saat start bot:', err);
  process.exit(1);
});
