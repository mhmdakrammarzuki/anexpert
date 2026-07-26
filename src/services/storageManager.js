import { readFile, writeFile } from 'node:fs/promises';

const defaultDataFile = 'pending_deletions.json';
const defaultTtlMs = 5 * 60 * 1000;

export class StorageManager {
  constructor(telegram, { dataFile = defaultDataFile, ttlMs = defaultTtlMs } = {}) {
    this.telegram = telegram;
    this.dataFile = dataFile;
    this.ttlMs = ttlMs;
    this.timers = new Map();
  }

  async scheduleDeletion(chatId, messageId, ttlMs = this.ttlMs) {
    const deleteAt = Date.now() + ttlMs;
    const item = { chat_id: chatId, message_id: messageId, delete_at: deleteAt };
    const data = await this.readData();
    data.push(item);
    await this.writeData(data);
    this.scheduleTimer(item);
  }

  async processPendingDeletions() {
    const data = await this.readData();
    const now = Date.now();
    const kept = [];

    for (const item of data) {
      if (item.delete_at <= now) {
        await this.deleteSingleMessage(item.chat_id, item.message_id);
      } else {
        kept.push(item);
        this.scheduleTimer(item);
      }
    }

    await this.writeData(kept);
  }

  scheduleTimer(item) {
    const key = this.key(item.chat_id, item.message_id);
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);

    const delay = Math.max(0, item.delete_at - Date.now());
    const timer = setTimeout(async () => {
      await this.deleteSingleMessage(item.chat_id, item.message_id);
      await this.removePending(item.chat_id, item.message_id);
      this.timers.delete(key);
    }, delay);

    timer.unref?.();
    this.timers.set(key, timer);
  }

  async deleteSingleMessage(chatId, messageId) {
    try {
      await this.telegram.deleteMessage(chatId, messageId);
    } catch {
      // Message may already be deleted or no longer deletable; cleanup state anyway.
    }
  }

  async removePending(chatId, messageId) {
    const data = await this.readData();
    const filtered = data.filter((item) => !(item.chat_id === chatId && item.message_id === messageId));
    await this.writeData(filtered);
  }

  async readData() {
    try {
      const raw = await readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async writeData(data) {
    await writeFile(this.dataFile, JSON.stringify(data, null, 2));
  }

  key(chatId, messageId) {
    return `${chatId}:${messageId}`;
  }
}
