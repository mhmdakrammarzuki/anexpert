# Anexpert

Anexpert adalah bot Telegram dengan arsitektur hibrida **Node.js + Go** sesuai `config.md`.

## Arsitektur
- **Node.js** menjadi gateway Telegram, pengelola command, session ringan, integrasi jaringan, dan orkestrasi I/O.
- **Go** menjadi worker CPU-bound yang dipanggil Node.js melalui `child_process` dengan argumen array terstruktur, bukan shell string bebas.
- Seluruh teks balasan bot disimpan di `src/messages/replies.js` agar copywriting tidak tercampur dengan logika handler.

## Fitur
- `/start`: salam pembuka.
- `/menu`: daftar fitur.
- `/sticker` atau `/stiker`: delegasi pembuatan sticker teks ke worker Go.
- `/dl [link]`: unduh media melalui CLI `yt-dlp`.
- `/status`, `/health`, `/uptime`, `/info`: debug admin only.

## Persyaratan
- Node.js 20+
- Go 1.22+
- `yt-dlp` dan `ffmpeg` untuk downloader
- `fastfetch` opsional untuk `/status`

## Instalasi
```bash
npm install
go build -o bin/anexpert-worker ./worker/cmd/anexpert-worker
TELEGRAM_BOT_TOKEN=... npm start
```

## Environment
- `TELEGRAM_BOT_TOKEN`: token bot Telegram.
- `AYAH_USERNAME`: username admin.
- `USE_WEBHOOK`: `true` untuk webhook.
- `WEBHOOK_URL`: URL webhook.
- `PORT`: port webhook.
- `GO_WORKER_PATH`: path binary worker Go, default `./bin/anexpert-worker`.
