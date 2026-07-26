import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { isAyah } from '../context.js';
import { replies } from '../messages/replies.js';

const execFileAsync = promisify(execFile);
const downloadsDir = 'downloads';
const lastDownloadUrlByUser = new Map();

function userKey(ctx) {
  return String(ctx.from?.id ?? ctx.chat?.id ?? 'unknown');
}

async function runYtDlp(url, audio) {
  await mkdir(downloadsDir, { recursive: true });
  const outputTemplate = join(downloadsDir, '%(id)s.%(ext)s');
  const args = audio
    ? ['--print', 'after_move:filepath', '-f', 'bestaudio/best', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '192K', '-o', outputTemplate, '--no-playlist', url]
    : ['--print', 'after_move:filepath', '-f', 'best[filesize<50M]', '-o', outputTemplate, '--no-playlist', url];

  const { stdout } = await execFileAsync('yt-dlp', args, { timeout: 180_000, maxBuffer: 1024 * 1024 });
  const filePath = stdout.trim().split('\n').at(-1);
  if (!filePath) throw new Error('yt-dlp tidak mengembalikan path file.');
  return filePath;
}

export function registerDownloaderHandler(bot, storageManager) {
  bot.command('dl', async (ctx) => {
    const ayah = isAyah(ctx);
    const url = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();

    if (!url) {
      await ctx.reply(replies.downloaderMissingUrl(ayah), { parse_mode: 'Markdown' });
      return;
    }

    lastDownloadUrlByUser.set(userKey(ctx), url);
    await ctx.reply(replies.downloaderFormatPrompt(ayah), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Unduh Video / MP4', callback_data: 'dl_video' },
            { text: 'Unduh Audio / MP3', callback_data: 'dl_audio' }
          ],
          [{ text: 'Batal', callback_data: 'dl_cancel' }]
        ]
      }
    });
  });

  bot.action(/^dl_/, async (ctx) => {
    await ctx.answerCbQuery();
    const ayah = isAyah(ctx);
    const data = ctx.callbackQuery?.data;

    if (data === 'dl_cancel') {
      lastDownloadUrlByUser.delete(userKey(ctx));
      await ctx.editMessageText(replies.downloaderCancelled(ayah));
      return;
    }

    const url = lastDownloadUrlByUser.get(userKey(ctx));
    if (!url) {
      await ctx.editMessageText(replies.downloaderForgotUrl());
      return;
    }

    await ctx.editMessageText(replies.downloaderLoading(ayah));
    const audio = data === 'dl_audio';
    let filePath;

    try {
      filePath = await runYtDlp(url, audio);
      const sentMessage = audio
        ? await ctx.replyWithAudio({ source: createReadStream(filePath) })
        : await ctx.replyWithVideo({ source: createReadStream(filePath) });
      await storageManager.scheduleDeletion(sentMessage.chat.id, sentMessage.message_id);
      await ctx.deleteMessage().catch(() => undefined);
    } catch (error) {
      await ctx.editMessageText(replies.downloaderError(ayah, error.message ?? error), { parse_mode: 'Markdown' });
    } finally {
      lastDownloadUrlByUser.delete(userKey(ctx));
      if (filePath) await rm(filePath, { force: true }).catch(() => undefined);
    }
  });
}
