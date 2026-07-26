export const replies = {
  start(isAyah) {
    return isAyah
      ? 'Ni hao, Ayah! (｡•̀ᴗ•́)✧\nAnne siap jadi anak yang berbakti\n/menu seperti biasanya yah~ ^^'
      : 'Halo~ Anne di sini :D\nSilakan ketik /menu dan melihat apa saja yang bisa membuat amu terbantu!';
  },

  menu(isAyah) {
    return isAyah
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
  },

  stickerHelp(isAyah) {
    return isAyah
      ? 'Ayah harus kirimin dulu sesuatu untuk dijadikan sticker yaw -.-\n\nCaranya:\n1. Ketik `/sticker [teks]`\n2. Kirim gambar, lalu ketik `/sticker` di caption-nya\n3. Reply / balas gambar atau teks dengan pesan `/sticker`\n\nJan lupa Yah, berikan Anne jajan sesekali atas kerja kerasnya :v'
      : 'Kirimkan sesuatu untuk dijadikan sticker\n\nCaranya:\n1. Ketik `/sticker [teks]`\n2. Kirim gambar, lalu ketik `/sticker` di caption-nya\n3. Reply / balas gambar atau teks dengan pesan `/sticker`';
  },

  stickerProcessing(isAyah) {
    return isAyah ? 'Siap Yah, Anne lagi bikin stikernya... (｡•̀ᴗ•́)✧' : 'Bentar, stikernya lagi dibuat...';
  },

  stickerError(isAyah, error) {
    return isAyah
      ? `M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis: \`${String(error).slice(0, 120)}\``
      : 'Maaf nih yek, Anne lagi ngantuk nih ( ͡° ᴥ ͡°)﻿... Coba lagi nanti yaw!';
  },

  downloaderMissingUrl(isAyah) {
    return isAyah
      ? 'Ayah harus kirimin dulu link videonya yaw -.-\n\nCaranya:\nKetik `/dl [link_video]`\n\nJan lupa Yah, berikan Anne jajan sesekali atas kerja kerasnya :v'
      : 'Kirimkan link videonya ges\n\nCaranya:\nKetik `/dl [link_video]`';
  },

  downloaderFormatPrompt(isAyah) {
    return isAyah ? 'Ayah mau download sebagai apa nih? \\(°^°)/' : 'Pilih format unduhannya yah~';
  },

  downloaderCancelled(isAyah) {
    return isAyah ? 'Oke Yah, unduhan dibatalkan yaw! :3' : 'K... Udah batal nih';
  },

  downloaderForgotUrl() {
    return "Uhh... Anne udah lupa linknya (¬_¬') coba ketik ulang";
  },

  downloaderLoading(isAyah) {
    return isAyah ? 'Sabar Ayah, Anne lagi ngambil medianya... (｡•̀ᴗ•́)✧' : 'Tunggu bentar nih, lagi di-download...';
  },

  downloaderError(isAyah, error) {
    return isAyah
      ? `M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis pas download: \`${String(error).slice(0, 100)}\``
      : 'Maaf nih yek, linknya susah di-download atau file-nya kegedean (maks 50MB)... Coba link lain yah!';
  },

  statusReport(sensorData) {
    return `**Status Sistem (Termux Native/Fastfetch)**\n\n\`\`\`text\n${sensorData}\`\`\``;
  },

  sensorReadError(error) {
    return `Gagal membaca sensor: ${error}`;
  },

  healthSuccess(username, id) {
    return `Bot is reachable as @${username} (id: ${id})`;
  },

  healthFailed(error) {
    return `Health check failed: ${error}`;
  },

  uptimeUnavailable() {
    return 'Uptime information not available.';
  },

  uptimeReport(hours, minutes, seconds) {
    return `Uptime: ${hours}h ${minutes}m ${seconds}s`;
  },

  infoReport({ nodeVersion, platform, telegrafVersion, useWebhook }) {
    return `Node.js: ${nodeVersion}\nPlatform: ${platform}\nTelegraf: ${telegrafVersion}\nUse webhook: ${useWebhook}\n`;
  }
};
