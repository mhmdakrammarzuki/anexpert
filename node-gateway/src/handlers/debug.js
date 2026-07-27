// anexpert/node-gateway/src/handlers/debug.js
//
// Port dari handlers/debug.py. /status sekarang manggil go-processor
// (sysinfo native) menggantikan shell command 'fastfetch', sesuai
// keputusanmu supaya lebih portable.
const os = require('os');
const Config = require('../config');
const { isAyah } = require('./start');
const { getSystemInfo } = require('../utils/goBridge');

let botStartTime = null;

function setBotStartTime(time) {
  botStartTime = time;
}

async function statusHandler(bot, msg) {
  if (!isAyah(msg.from.username)) return;
  const chatId = msg.chat.id;

  let body;
  try {
    const info = await getSystemInfo();
    body =
      `CPU   : ${info.cpu_model} (${info.cpu_cores} core, ${info.cpu_percent.toFixed(1)}%)\n` +
      `RAM   : ${info.mem_used_mb} / ${info.mem_total_mb} MB (${info.mem_percent.toFixed(1)}%)\n` +
      `Disk  : ${info.disk_used_gb.toFixed(1)} / ${info.disk_total_gb.toFixed(1)} GB (${info.disk_percent.toFixed(1)}%)`;
  } catch (e) {
    body = `Gagal membaca sensor: ${e.message}`;
  }

  const msgText = `**Status Sistem (Native via go-processor)**\n\n\`\`\`text\n${body}\`\`\``;
  await bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
}

async function healthHandler(bot, msg) {
  if (!isAyah(msg.from.username)) return;
  const chatId = msg.chat.id;

  try {
    const me = await bot.getMe();
    await bot.sendMessage(chatId, `Bot is reachable as @${me.username} (id: ${me.id})`);
  } catch (e) {
    await bot.sendMessage(chatId, `Health check failed: ${e.message}`);
  }
}

async function uptimeHandler(bot, msg) {
  if (!isAyah(msg.from.username)) return;
  const chatId = msg.chat.id;

  if (!botStartTime) {
    await bot.sendMessage(chatId, 'Uptime information not available.');
    return;
  }

  const diffSec = Math.floor((Date.now() - botStartTime) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  await bot.sendMessage(chatId, `Uptime: ${hours}h ${minutes}m ${seconds}s`);
}

async function infoHandler(bot, msg) {
  if (!isAyah(msg.from.username)) return;
  const chatId = msg.chat.id;

  const nodeVer = process.version;
  const plat = `${os.type()} ${os.release()} (${os.arch()})`;
  const useWebhook = Config.USE_WEBHOOK;

  const msgText = `Node.js: ${nodeVer}\nPlatform: ${plat}\nUse webhook: ${useWebhook}\n`;
  await bot.sendMessage(chatId, msgText);
}

module.exports = {
  statusHandler,
  healthHandler,
  uptimeHandler,
  infoHandler,
  setBotStartTime,
};
