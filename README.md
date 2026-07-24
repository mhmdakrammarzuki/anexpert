# Anexpert

Anexpert adalah bot Telegram yang dibangun dengan Python menggunakan library python-telegram-bot. Bot ini dirancang untuk memberikan pengalaman interaksi yang ramah, konsisten, dan mudah dipahami, dengan fokus pada fitur umum, produktivitas, serta dukungan administratif.

## Gambaran Umum
Anexpert cocok digunakan sebagai bot personal yang membantu pengguna dalam hal:
- interaksi ringan melalui Telegram
- pembuatan sticker
- pengunduhan media
- pemanfaatan fitur produktivitas sederhana
- pemantauan status sistem melalui mode debug

## Fitur yang Tersedia

### Fitur Umum
- `/start`: salam pembuka dan penyesuaian respons untuk admin dan user.
- `/menu`: menampilkan daftar fitur yang tersedia.
- `/stiker` (`/sticker`): membuat sticker dari teks atau gambar.
- `/dl [link]`: mengunduh video atau audio dari URL.

### Fitur Debug
- `/status`: pemeriksaan status sistem (admin only).
- `/health`: cek konektivitas dan reachability bot (admin only).
- `/uptime`: lama bot berjalan sejak start (admin only).
- `/info`: informasi runtime (Python, platform, versi library) (admin only).

## Persyaratan Sistem
- Python 3.10+
- pip
- ffmpeg terinstal di sistem untuk fitur unduh audio/video

## Instalasi
1. Salin file [.env](.env) menjadi file environment yang sesuai dan isi nilai konfigurasi.
2. Install dependensi:
   pip install -r requirements.txt
3. Jalankan bot:
   python bot.py

## Konfigurasi
- TELEGRAM_BOT_TOKEN: token bot Telegram Anda.
- AYAH_USERNAME: username akun yang diperlakukan sebagai admin khusus.
- USE_WEBHOOK: aktifkan jika bot dijalankan di server publik.
- WEBHOOK_URL: URL webhook jika digunakan.
- PORT: port yang dipakai untuk webhook.

## Catatan Pengembangan
- Bot saat ini berjalan dengan polling secara default.
- Jika ingin menggunakan webhook, aktifkan USE_WEBHOOK=True dan isi WEBHOOK_URL.
- Dukungan Docker telah dihapus; proyek dijalankan langsung dari Python.
- Struktur handler dan utilitas memudahkan penambahan fitur baru di masa depan.
