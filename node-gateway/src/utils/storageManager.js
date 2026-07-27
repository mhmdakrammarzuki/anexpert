// anexpert/node-gateway/src/utils/storageManager.js
//
// Port dari utils/storage_manager.py: menjadwalkan penghapusan pesan
// setelah 5 menit, dan tetap "ingat" jadwal itu walau bot restart,
// dengan menyimpan jejaknya ke file JSON.
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const DATA_FILE = path.join(__dirname, '..', '..', 'pending_deletions.json');
const DELAY_MS = 5 * 60 * 1000; // 5 menit, sama seperti versi Python

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

async function deleteSingleMessage(bot, chatId, messageId) {
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch {
    // pesan mungkin sudah dihapus manual, itu tidak apa-apa
  }
  const data = readData().filter(
    (d) => !(d.chat_id === chatId && d.message_id === messageId)
  );
  writeData(data);
}

/**
 * Jadwalkan penghapusan pesan 5 menit dari sekarang.
 */
function scheduleDeletion(bot, chatId, messageId) {
  const runAt = new Date(Date.now() + DELAY_MS);
  schedule.scheduleJob(runAt, () => deleteSingleMessage(bot, chatId, messageId));

  const data = readData();
  data.push({
    chat_id: chatId,
    message_id: messageId,
    delete_at: Date.now() + DELAY_MS,
  });
  writeData(data);
}

/**
 * Dipanggil sekali saat bot baru nyala: proses ulang jadwal yang tertunda
 * dari sesi sebelumnya (mis. bot sempat mati/restart).
 */
async function processPendingDeletions(bot) {
  const data = readData();
  const now = Date.now();
  const kept = [];

  for (const item of data) {
    if (item.delete_at <= now) {
      await deleteSingleMessage(bot, item.chat_id, item.message_id);
    } else {
      kept.push(item);
      const runAt = new Date(item.delete_at);
      schedule.scheduleJob(runAt, () =>
        deleteSingleMessage(bot, item.chat_id, item.message_id)
      );
    }
  }
  writeData(kept);
}

module.exports = { scheduleDeletion, processPendingDeletions };
