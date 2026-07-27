// anexpert/node-gateway/src/config.js
require('dotenv').config();

const Config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  AYAH_USERNAME: process.env.AYAH_USERNAME,
  USE_WEBHOOK: (process.env.USE_WEBHOOK || 'False').toLowerCase() === 'true',
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  PORT: parseInt(process.env.PORT || '8443', 10),
};

if (!Config.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN tidak ditemukan di file .env!');
}

module.exports = Config;
