// anexpert/node-gateway/src/handlers/downloader.js
//
// Port dari handlers/downloader.py. Sama seperti versi Python, ini
// memanggil yt-dlp — tapi bukan lewat Python, melainkan lewat BINARY
// standalone yt-dlp (satu file executable, sudah termasuk semua
// dependency-nya, tanpa perlu install Python sama sekali).
//
// Keamanan: kita SELALU pakai execFile dengan argumen berbentuk ARRAY,
// tidak pernah menggabungkan string URL ke command shell, sesuai aturan
// "Sanitasi Batas Antar Proses" di config.md.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { isAyah } = require('./start');
const { scheduleDeletion } = require('../utils/storageManager');

function ytdlpBinaryName() {
  return process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
}

const YTDLP_BIN = process.env.YTDLP_PATH || path.join(__dirname, '..', '..', 'bin', ytdlpBinaryName());

// Simpan URL terakhir per user secara in-memory (pengganti context.user_data
// versi Python). Untuk bot personal skala kecil ini cukup.
const lastUrlByUser = new Map();

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_BIN,
      args,
      { maxBuffer: 1024 * 1024 * 50, timeout: 5 * 60 * 1000 },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr ? stderr.slice(-500) : error.message));
        }
        resolve(stdout);
      }
    );
  });
}

async function downloaderHandler(bot, msg, matchArgs) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const ayah = isAyah(msg.from.username);

  const url = (matchArgs || '').trim().split(/\s+/)[0];

  if (!url) {
    const helpMsg = ayah
      ? 'Ayah harus kirimin dulu link videonya yaw -.-\n\n' +
        'Caranya:\nKetik `/dl [link_video]`\n\n' +
        'Jan lupa Yah, berikan Anne jajan sesekali atas kerja kerasnya :v'
      : 'Kirimkan link videonya ges\n\nCaranya:\nKetik `/dl [link_video]`';
    await bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
    return;
  }

  lastUrlByUser.set(userId, url);

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: 'Unduh Video / MP4', callback_data: 'dl_video' },
        { text: 'Unduh Audio / MP3', callback_data: 'dl_audio' },
      ],
      [{ text: 'Batal', callback_data: 'dl_cancel' }],
    ],
  };

  const pickMsg = ayah ? 'Ayah mau download sebagai apa nih? \\(°^°)/' : 'Pilih format unduhannya yah~';
  await bot.sendMessage(chatId, pickMsg, { reply_markup: replyMarkup });
}

async function downloaderButtonCallback(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;
  const ayah = isAyah(query.from.username);
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  if (data === 'dl_cancel') {
    const cancelMsg = ayah ? 'Oke Yah, unduhan dibatalkan yaw! :3' : 'K... Udah batal nih';
    await bot.editMessageText(cancelMsg, { chat_id: chatId, message_id: messageId });
    return;
  }

  const url = lastUrlByUser.get(userId);
  if (!url) {
    await bot.editMessageText("Uhh... Anne udah lupa linknya (¬_¬') coba ketik ulang", {
      chat_id: chatId,
      message_id: messageId,
    });
    return;
  }

  const waitMsg = ayah ? 'Sabar Ayah, Anne lagi ngambil medianya... (｡•̀ᴗ•́)✧' : 'Tunggu bentar nih, lagi di-download...';
  await bot.editMessageText(waitMsg, { chat_id: chatId, message_id: messageId });

  const isAudio = data === 'dl_audio';
  const downloadsDir = path.join(os.tmpdir(), 'anexpert-downloads');
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  const jobId = crypto.randomUUID();
  const outputTemplate = path.join(downloadsDir, `${jobId}.%(ext)s`);
  
  // Rute absolut mutlak menuju file cookies.txt di dalam folder node-gateway
  const cookiesPath = path.join(__dirname, '..', '..', 'cookies.txt');

  // Argumen selalu berbentuk array — tidak ada penggabungan string shell.
  const args = isAudio
    ? [
        '--cookies', cookiesPath,
        '-f', 'bestaudio/best',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '--no-playlist',
        '-o', outputTemplate,
        url,
      ]
    : [
        '--cookies', cookiesPath,
        '-f', 'best[filesize<50M]/best',
        '--no-playlist',
        '-o', outputTemplate,
        url,
      ];

  try {
    await runYtDlp(args);

    // Cari file hasil download di folder (ekstensi ditentukan yt-dlp sendiri)
    const files = fs.readdirSync(downloadsDir).filter((f) => f.startsWith(jobId));
    const filePath = isAudio
      ? path.join(downloadsDir, files.find((f) => f.endsWith('.mp3')) || files[0])
      : path.join(downloadsDir, files[0]);

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File hasil download tidak ditemukan.');
    }

    let sentMsg;
    const fileStream = fs.createReadStream(filePath);
    if (isAudio) {
      sentMsg = await bot.sendAudio(chatId, fileStream);
    } else {
      sentMsg = await bot.sendVideo(chatId, fileStream);
    }

    scheduleDeletion(bot, sentMsg.chat.id, sentMsg.message_id);

    await bot.deleteMessage(chatId, messageId).catch(() => {});
    fs.promises.unlink(filePath).catch(() => {});
  } catch (e) {
    const errorMsg = ayah
      ? `M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis pas download: \`${String(e.message).slice(0, 200)}\``
      : 'Maaf nih yek, linknya susah di-download atau file-nya kegedean... Coba link lain yah!';
    await bot.editMessageText(errorMsg, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }).catch(() => {});

    try {
      const leftovers = fs.readdirSync(downloadsDir).filter((f) => f.startsWith(jobId));
      leftovers.forEach((f) => fs.promises.unlink(path.join(downloadsDir, f)).catch(() => {}));
    } catch {}
  }
}

module.exports = { downloaderHandler, downloaderButtonCallback };
