// anexpert/node-gateway/src/utils/goBridge.js
//
// Ini "jembatan" antara Node.js dan program Go yang sudah di-compile.
// PENTING (soal keamanan): kita SELALU memanggil execFile dengan argumen
// berupa ARRAY, bukan menggabungkan string lalu dieksekusi lewat shell.
// Ini mencegah celah command injection, sesuai aturan di config.md.
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

const BINARY_NAME = process.platform === 'win32' ? 'processor.exe' : 'processor';
const PROCESSOR_PATH = path.join(__dirname, '..', '..', 'bin', BINARY_NAME);

function runProcessor(args) {
  return new Promise((resolve, reject) => {
    execFile(PROCESSOR_PATH, args, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
      if (error) {
        // Coba parse pesan error terstruktur dari stderr (dikirim sebagai JSON oleh Go)
        try {
          const parsed = JSON.parse(stderr.trim());
          return reject(new Error(parsed.error || stderr));
        } catch {
          return reject(new Error(stderr || error.message));
        }
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`Gagal parsing output dari processor: ${e.message}`));
      }
    });
  });
}

function tempFilePath(ext) {
  return path.join(os.tmpdir(), `anexpert-${crypto.randomUUID()}.${ext}`);
}

/**
 * Minta Go men-generate sticker "brat style" dari teks.
 * @param {string} text
 * @returns {Promise<string>} path file .webp hasil generate
 */
async function generateBratSticker(text) {
  const outputPath = tempFilePath('webp');
  const result = await runProcessor(['brat', text, outputPath]);
  return result.output_path;
}

/**
 * Minta Go men-convert gambar (buffer) jadi sticker webp 512x512.
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>} path file .webp hasil convert
 */
async function convertImageToSticker(imageBuffer) {
  const inputPath = tempFilePath('input');
  const outputPath = tempFilePath('webp');
  fs.writeFileSync(inputPath, imageBuffer);
  try {
    const result = await runProcessor(['convert', inputPath, outputPath]);
    return result.output_path;
  } finally {
    // Node (komponen gateway) yang bertanggung jawab bersihin file sementara,
    // sesuai poin "Siklus Hidup Data Sementara" di config.md.
    fs.promises.unlink(inputPath).catch(() => {});
  }
}

/**
 * Ambil info CPU/RAM/Disk dari Go (pengganti fastfetch).
 */
async function getSystemInfo() {
  const result = await runProcessor(['sysinfo']);
  return result.data;
}

module.exports = {
  generateBratSticker,
  convertImageToSticker,
  getSystemInfo,
  tempFilePath,
};
