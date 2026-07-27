// anexpert/node-gateway/src/handlers/sticker.js
//
// Port dari handlers/sticker_generator.py. Bagian berat (generate/convert
// gambar) didelegasikan ke go-processor lewat goBridge, sesuai aturan
// "Fitur Komputasi Berat wajib ke Go" di config.md.
const fs = require('fs');
const { isAyah } = require('./start');
const { generateBratSticker, convertImageToSticker } = require('../utils/goBridge');
const { scheduleDeletion } = require('../utils/storageManager');

async function downloadTelegramFile(bot, fileId) {
  const fileLink = await bot.getFileLink(fileId);
  const res = await fetch(fileLink);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function replySticker(bot, chatId, webpPath) {
  const sentMsg = await bot.sendSticker(chatId, fs.createReadStream(webpPath));
  scheduleDeletion(bot, sentMsg.chat.id, sentMsg.message_id);
  // bersihkan file sementara setelah terkirim
  fs.promises.unlink(webpPath).catch(() => {});
  return sentMsg;
}

async function processAndSendImage(bot, chatId, message) {
  let fileId = null;

  if (message.photo && message.photo.length > 0) {
    fileId = message.photo[message.photo.length - 1].file_id;
  } else if (message.document && message.document.mime_type && message.document.mime_type.startsWith('image/')) {
    fileId = message.document.file_id;
  } else {
    return false;
  }

  const buffer = await downloadTelegramFile(bot, fileId);
  const webpPath = await convertImageToSticker(buffer);
  await replySticker(bot, chatId, webpPath);
  return true;
}

async function stickerHandler(bot, msg, matchArgs) {
  const username = msg.from.username;
  const ayah = isAyah(username);
  const chatId = msg.chat.id;

  await bot.sendChatAction(chatId, 'choose_sticker');

  try {
    if (msg.reply_to_message) {
      const replied = msg.reply_to_message;

      if (await processAndSendImage(bot, chatId, replied)) return;

      const textFromReply = replied.text || replied.caption;
      if (textFromReply) {
        const webpPath = await generateBratSticker(textFromReply);
        await replySticker(bot, chatId, webpPath);
        return;
      }
    }

    if (await processAndSendImage(bot, chatId, msg)) return;

    let text = '';
    if (matchArgs && matchArgs.trim()) {
      text = matchArgs.trim();
    } else if (msg.text) {
      text = msg.text.toLowerCase().replace(/\/sticker|\/stiker/g, '').trim();
    } else if (msg.caption) {
      text = msg.caption.toLowerCase().replace(/\/sticker|\/stiker/g, '').trim();
    }

    if (text) {
      const webpPath = await generateBratSticker(text);
      await replySticker(bot, chatId, webpPath);
      return;
    }

    const pesanBantuan = ayah
      ? 'Ayah harus kirimin dulu sesuatu untuk dijadikan sticker yaw -.-\n\n' +
        'Caranya:\n' +
        '1. Ketik `/sticker [teks]`\n' +
        '2. Kirim gambar, lalu ketik `/sticker` di caption-nya\n' +
        '3. Reply / balas gambar atau teks dengan pesan `/sticker`\n\n' +
        'Jan lupa Yah, berikan Anne jajan sesekali atas kerja kerasnya :v'
      : 'Kirimkan sesuatu untuk dijadikan sticker\n\n' +
        'Caranya:\n' +
        '1. Ketik `/sticker [teks]`\n' +
        '2. Kirim gambar, lalu ketik `/sticker` di caption-nya\n' +
        '3. Reply / balas gambar atau teks dengan pesan `/sticker`';

    await bot.sendMessage(chatId, pesanBantuan, { parse_mode: 'Markdown' });
  } catch (e) {
    const errorMsg = ayah
      ? `M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis: \`${e.message}\``
      : 'Maaf nih yek, Anne lagi ngantuk nih ( ͡° ᴥ ͡°)﻿... Coba lagi nanti yaw!';
    await bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
  }
}

module.exports = { stickerHandler };
