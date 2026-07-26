import { isAyah } from '../context.js';
import { replies } from '../messages/replies.js';

export function registerStartHandler(bot) {
  bot.start((ctx) => ctx.reply(replies.start(isAyah(ctx))));
}
