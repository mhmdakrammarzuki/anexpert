// anexpert/node-gateway/src/handlers/start.js
const Config = require('../config');

function isAyah(username) {
  return Boolean(Config.AYAH_USERNAME) && username === Config.AYAH_USERNAME;
}

async function startHandler(bot, msg) {
  const username = msg.from.username;
  const welcome = isAyah(username)
    ? 'Ni hao, Ayah! (｡•̀ᴗ•́)✧\nAnne siap jadi anak yang berbakti\n/menu seperti biasanya yah~ ^^'
    : 'Halo~ Anne di sini :D\nSilakan ketik /menu dan melihat apa saja yang bisa membuat amu terbantu!';
  await bot.sendMessage(msg.chat.id, welcome);
}

module.exports = { startHandler, isAyah };
