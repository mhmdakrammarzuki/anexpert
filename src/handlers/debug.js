import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';
import { createRequire } from 'node:module';
import { config } from '../config.js';
import { isAyah } from '../context.js';
import { replies } from '../messages/replies.js';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const { version: telegrafVersion } = require('telegraf/package.json');

function adminOnly(ctx) {
  return isAyah(ctx);
}

export function registerDebugHandlers(bot, startedAt) {
  bot.command('status', async (ctx) => {
    if (!adminOnly(ctx)) return;

    let sensorData;
    try {
      const { stdout } = await execFileAsync('fastfetch', ['-s', 'CPU:Memory:Disk', '--logo', 'none'], {
        timeout: 10_000,
        maxBuffer: 64 * 1024
      });
      sensorData = stdout;
    } catch (error) {
      sensorData = replies.sensorReadError(error.message ?? error);
    }

    await ctx.reply(replies.statusReport(sensorData), { parse_mode: 'Markdown' });
  });

  bot.command('health', async (ctx) => {
    if (!adminOnly(ctx)) return;

    try {
      const me = await ctx.telegram.getMe();
      await ctx.reply(replies.healthSuccess(me.username, me.id));
    } catch (error) {
      await ctx.reply(replies.healthFailed(error.message ?? error));
    }
  });

  bot.command('uptime', async (ctx) => {
    if (!adminOnly(ctx)) return;

    if (!startedAt) {
      await ctx.reply(replies.uptimeUnavailable());
      return;
    }

    const diff = Math.floor((Date.now() - startedAt) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    await ctx.reply(replies.uptimeReport(hours, minutes, seconds));
  });

  bot.command('info', async (ctx) => {
    if (!adminOnly(ctx)) return;

    await ctx.reply(replies.infoReport({
      nodeVersion: process.version,
      platform: `${process.platform} ${process.arch}`,
      telegrafVersion,
      useWebhook: config.useWebhook
    }));
  });
}
