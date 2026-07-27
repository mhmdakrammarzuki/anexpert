// anexpert/node-gateway/src/handlers/menu.js
const { isAyah } = require('./start');

async function menuHandler(bot, msg) {
  const username = msg.from.username;
  const teksMenu = isAyah(username)
    ? `Ni hao, Ayah! Anne hadir  (｡•̀ᴗ•́)✧
Maaf telat yaw :3, nih adek sediain skill yang dapat Ayah gunakan untuk sekarang:

══════════════════════
Debug
├ /status
├ /health
├ /uptime
├ /info

Fitur Umum
├ /menu
├ /sticker
├ /dl
└ #comingsoon

Produktivitas
└ #comingsoon
══════════════════════`
    : `Halo ges, Anne disini :3 Sorry telat hehe... nih daftar fitur yang dapat digunakan untuk sekarang:

══════════════════════
Fitur Umum
├ /menu
├ /sticker
├ /dl
└ #comingsoon

Produktivitas
└ #comingsoon
══════════════════════`;

  await bot.sendMessage(msg.chat.id, teksMenu);
}

module.exports = { menuHandler };
