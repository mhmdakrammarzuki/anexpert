import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { Input } from 'telegraf';
import { isAyah } from '../context.js';
import { replies } from '../messages/replies.js';
import { runGoWorker } from '../services/goWorker.js';

function extractStickerText(ctx) {
  const message = ctx.message;
  const replied = message?.reply_to_message;

  if (replied?.text) return replied.text;
  if (replied?.caption) return replied.caption;

  const raw = message?.text ?? message?.caption ?? '';
  return raw.replace(/^\/stic?ker\b/i, '').trim();
}

function extractImageFileId(ctx) {
  const message = ctx.message;
  const replied = message?.reply_to_message;
  const source = replied ?? message;

  if (source?.photo?.length) {
    return source.photo.at(-1).file_id;
  }
  if (source?.document?.mime_type?.startsWith('image/')) {
    return source.document.file_id;
  }
  return undefined;
}

async function downloadTelegramFile(ctx, fileId) {
  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const response = await fetch(fileUrl);
  if (!response.ok || !response.body) {
    throw new Error(`gagal download file Telegram: ${response.status}`);
  }

  const dir = await mkdtemp(join(tmpdir(), 'anexpert-sticker-input-'));
  const inputPath = join(dir, 'source-image');
  const stream = createWriteStream(inputPath, { mode: 0o600 });
  await finished(Readable.fromWeb(response.body).pipe(stream));
  return { dir, inputPath };
}

export function registerStickerHandler(bot, storageManager) {
  bot.command(['sticker', 'stiker'], async (ctx) => {
    const ayah = isAyah(ctx);
    const text = extractStickerText(ctx);
    const imageFileId = extractImageFileId(ctx);
    let inputDir;
    let outputPath;

    if (!text && !imageFileId) {
      await ctx.reply(replies.stickerHelp(ayah), { parse_mode: 'Markdown' });
      return;
    }

    await ctx.reply(replies.stickerProcessing(ayah));

    try {
      let data;
      if (imageFileId) {
        const downloaded = await downloadTelegramFile(ctx, imageFileId);
        inputDir = downloaded.dir;
        data = await runGoWorker('sticker.image', { inputPath: downloaded.inputPath });
      } else {
        data = await runGoWorker('sticker.text', { text });
      }

      outputPath = data.filePath;
      const sentMessage = await ctx.replyWithSticker(Input.fromLocalFile(outputPath));
      await storageManager.scheduleDeletion(sentMessage.chat.id, sentMessage.message_id);
    } catch (error) {
      await ctx.reply(replies.stickerError(ayah, error.message ?? error), { parse_mode: 'Markdown' });
    } finally {
      if (inputDir) await rm(inputDir, { recursive: true, force: true }).catch(() => undefined);
      if (outputPath) await rm(outputPath, { force: true }).catch(() => undefined);
    }
  });
}
