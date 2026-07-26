# Anexpert

Anexpert adalah bot Telegram dengan arsitektur hibrida **Node.js + Go** sesuai `config.md`.

## Arsitektur
- **Node.js** menjadi gateway Telegram, pengelola command, session ringan, integrasi jaringan, dan orkestrasi I/O.
- **Go** menjadi worker CPU-bound yang dipanggil Node.js melalui `child_process` dengan argumen array terstruktur, bukan shell string bebas.
- Seluruh teks balasan bot disimpan di `src/messages/replies.js` agar copywriting tidak tercampur dengan logika handler.
- File sementara dan pesan media terjadwal dikelola gateway Node.js melalui `src/services/storageManager.js`.

## Fitur
- `/start`: salam pembuka.
- `/menu`: daftar fitur.
- `/sticker` atau `/stiker`: membuat sticker dari teks, gambar, caption gambar, atau reply ke teks/gambar.
- `/dl [link]`: unduh video/audio melalui CLI `yt-dlp` dan tombol pilihan format.
- `/status`, `/health`, `/uptime`, `/info`: debug admin only.
- Pesan sticker/media yang dikirim bot dijadwalkan terhapus setelah 5 menit dan antreannya dipersist ke `pending_deletions.json` agar tetap diproses setelah restart.

## Format Sticker
Worker Go mempertahankan konfigurasi sticker dari implementasi lama:
- kanvas 512x512;
- latar putih dan teks hitam;
- teks dinormalisasi ke lowercase;
- padding kiri/kanan 45px dan atas/bawah 35px;
- auto-wrap, pemilihan susunan baris yang memenuhi batas kanvas, dan justify untuk baris selain baris terakhir;
- efek pixelated/moldy dengan render low-res 128x128 lalu upscale nearest-neighbor ke 512x512;
- gambar input di-resize proporsional agar muat dalam batas 512x512.

## Yang Harus Diinstal
1. **Node.js 20+** dan `npm`.
2. **Go 1.22+** untuk build worker.
3. **yt-dlp** untuk `/dl`.
4. **ffmpeg** untuk ekstraksi audio MP3 oleh `yt-dlp`.
5. **fastfetch** opsional untuk `/status`.

Contoh instalasi di Termux:
```bash
pkg update
pkg install nodejs-lts golang ffmpeg fastfetch
python -m pip install -U yt-dlp
```

Contoh instalasi di Debian/Ubuntu:
```bash
sudo apt update
sudo apt install -y nodejs npm golang-go ffmpeg fastfetch python3-pip
python3 -m pip install -U yt-dlp
```

## Setup Project
```bash
npm install
mkdir -p bin
go build -o bin/anexpert-worker ./worker/cmd/anexpert-worker
```

Buat file `.env` atau export environment berikut:
```bash
TELEGRAM_BOT_TOKEN=isi_token_botmu
AYAH_USERNAME=username_admin_tanpa_at
USE_WEBHOOK=false
GO_WORKER_PATH=./bin/anexpert-worker
```

## Menjalankan Bot
Mode polling lokal:
```bash
npm start
```

Mode webhook:
```bash
USE_WEBHOOK=true \
WEBHOOK_URL=https://domain-botmu.example \
PORT=8443 \
npm start
```

## Environment
- `TELEGRAM_BOT_TOKEN`: token bot Telegram.
- `AYAH_USERNAME`: username admin.
- `USE_WEBHOOK`: `true` untuk webhook, default `false`.
- `WEBHOOK_URL`: URL webhook jika webhook aktif.
- `PORT`: port webhook, default `8443`.
- `GO_WORKER_PATH`: path binary worker Go, default `./bin/anexpert-worker`.
