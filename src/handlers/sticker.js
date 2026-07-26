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

export function registerStickerHandler(bot) {
  bot.command(['sticker', 'stiker'], async (ctx) => {
    const ayah = isAyah(ctx);
    const text = extractStickerText(ctx);

    if (!text) {
      await ctx.reply(replies.stickerHelp(ayah), { parse_mode: 'Markdown' });
      return;
    }

    await ctx.reply(replies.stickerProcessing(ayah));

    try {
      const data = await runGoWorker('sticker.text', { text });
      await ctx.replyWithSticker(Input.fromLocalFile(data.filePath));
    } catch (error) {
      await ctx.reply(replies.stickerError(ayah, error.message ?? error), { parse_mode: 'Markdown' });
    }
  });
}
