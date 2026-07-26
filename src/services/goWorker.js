import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

export async function runGoWorker(command, payload) {
  const input = JSON.stringify({ command, payload });
  const { stdout } = await execFileAsync(config.workerPath, ['--json', input], {
    timeout: 30_000,
    maxBuffer: 1024 * 1024
  });

  const result = JSON.parse(stdout);
  if (!result.ok) {
    throw new Error(result.error ?? 'Go worker gagal menjalankan tugas.');
  }
  return result.data;
}
