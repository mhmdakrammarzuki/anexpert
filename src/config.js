import 'dotenv/config';

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  ayahUsername: process.env.AYAH_USERNAME,
  useWebhook: String(process.env.USE_WEBHOOK ?? 'false').toLowerCase() === 'true',
  webhookUrl: process.env.WEBHOOK_URL,
  port: Number(process.env.PORT ?? 8443),
  workerPath: process.env.GO_WORKER_PATH ?? './bin/anexpert-worker'
};

if (!config.telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN tidak ditemukan di environment!');
}
