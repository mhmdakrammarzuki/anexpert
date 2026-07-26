import { config } from './config.js';

export function isAyah(ctx) {
  const username = ctx.from?.username;
  return Boolean(config.ayahUsername && username === config.ayahUsername);
}
