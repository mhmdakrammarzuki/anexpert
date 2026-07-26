import { isAyah } from '../context.js';
import { replies } from '../messages/replies.js';

export function registerMenuHandler(bot) {
  bot.command('menu', (ctx) => ctx.reply(replies.menu(isAyah(ctx))));
}
