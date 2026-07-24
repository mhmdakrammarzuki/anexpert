# Konfigurasi Bot Anexpert

## 1. Ringkasan Proyek
Bot Anexpert adalah bot Telegram yang dibangun dengan Python dan library python-telegram-bot. Bot ini fokus pada interaksi yang ramah, personal, dan mudah dipahami, dengan fitur utama untuk membantu pengguna dalam mengolah teks, membuat sticker, serta mengunduh media.

## 2. Struktur Proyek
Proyek ini terdiri dari beberapa bagian utama:
- bot.py
  - entry point utama bot.
  - mengatur handler, polling/webhook, dan startup logic.
- config.py
  - memuat konfigurasi dari environment seperti token bot dan username admin.
- handlers/
  - start.py: menangani perintah /start.
  - menu.py: menangani perintah /menu.
  - sticker_generator.py: menangani fitur pembuatan sticker (alias `/stiker` dan `/sticker`).
  - downloader.py: menangani fitur unduh media.
  - debug.py: menangani perintah `/status`, `/health`, `/uptime`, dan `/info`.
- utils/
  - image_processing.py: menghasilkan sticker dari teks atau gambar.
  - storage_manager.py: mengatur penghapusan pesan otomatis dan penyimpanan pending deletion.

## 3. Fitur yang Aktif Saat Ini

### /start
- Menampilkan salam pembuka saat pengguna mulai berinteraksi dengan bot.
- Jika pengguna adalah admin yang ditentukan lewat AYAH_USERNAME, bot memberikan respons yang lebih personal dan hangat.

### /menu
- Menampilkan daftar fitur yang tersedia saat ini.
- Digunakan sebagai panduan navigasi awal bagi pengguna.

-### /stiker (/sticker)
- Memungkinkan pengguna membuat sticker dari:
  - teks yang dikirim langsung
  - gambar yang dikirim dengan caption `/stiker` atau `/sticker`
  - reply terhadap gambar atau teks
- Jika input berupa gambar, bot akan mengubah gambar menjadi sticker webp.
- Jika input berupa teks, bot akan membuat sticker visual dari teks tersebut.

### /dl [link]
- Memungkinkan pengguna mengunduh media dari URL.
- Setelah link dikirim, bot menampilkan pilihan format:
  - video / MP4
  - audio / MP3
- Proses unduhan dilakukan dengan yt-dlp dan file hasil unduhan akan dibersihkan setelah beberapa saat.

### Debug Commands
- `/status`: fitur debug sederhana untuk memeriksa status bot (admin only).
- `/health`: cek health/readability bot dan konektivitas (admin only).
- `/uptime`: menampilkan lama bot berjalan sejak start (admin only).
- `/info`: menampilkan informasi runtime (Python, platform, versi library) (admin only).

## 4. Aturan Balasan Bot
Balasan bot tidak boleh dimodifikasi secara bebas oleh pihak lain maupun oleh proses otomatis lain. Semua respon harus tetap konsisten dengan karakter yang sudah dibangun.

### Prinsip utama
- Respons bot harus tetap sopan, jelas, dan mudah dipahami.
- Gaya bahasa tidak boleh berubah drastis dari satu fitur ke fitur lain.
- Balasan tidak boleh menjadi kasar, ambigu, atau terlalu formal sehingga mengurangi kenyamanan pengguna.

## 5. Perbedaan Respons Admin dan User

### Admin
- Bot memperlakukan admin dengan sikap yang lebih hangat, personal, dan hormat.
- Respons admin cenderung lebih lembut dan penuh perhatian.
- Karakter yang diutamakan:
  - sopan
  - suportif
  - hangat
  - penuh rasa hormat

### User
- Bot memperlakukan user dengan sikap ramah, terbuka, dan membantu.
- Respons user harus tetap friendly, jelas, dan tidak kaku.
- Karakter yang diutamakan:
  - ramah
  - membantu
  - mudah dipahami
  - nyaman untuk diajak berinteraksi

## 6. Sikap dan Sifat Bot
Bot Anexpert diharapkan memiliki sifat berikut:
- ramah
- sopan
- menyenangkan, namun tetap profesional
- responsif
- konsisten
- mudah dipahami
- nyaman untuk berinteraksi

## 7. Konfigurasi dan Environment
Bot menggunakan file environment untuk konfigurasi penting, seperti:
- TELEGRAM_BOT_TOKEN: token bot Telegram
- AYAH_USERNAME: username akun yang diperlakukan sebagai admin khusus
- USE_WEBHOOK: apakah bot dijalankan dengan webhook
- WEBHOOK_URL: URL webhook jika digunakan
- PORT: port untuk webhook

## 8. Prinsip Pengembangan

### Scalable
- Struktur kode dibuat agar fitur baru dapat ditambahkan dengan lebih mudah.
- Handler dipisahkan per modul agar lebih rapi dan terorganisir.

### Secure
- Token dan konfigurasi sensitif tidak boleh disimpan sembarangan.
- Proses pengunduhan dan penghapusan file harus tetap terkontrol.

### Enak Dilihat
- Pesan bot dibuat agar rapi, mudah dibaca, dan konsisten.
- Format menu dan respons disusun agar nyaman dipandang.

### Mudah Dipahami
- Bahasa yang digunakan sederhana dan tidak bertele-tele.
- Pengguna dapat langsung memahami apa yang bisa dilakukan bot.

## 9. Catatan Implementasi
- Bot saat ini masih fokus pada fitur dasar yang sudah berjalan.
- Fitur yang terlihat sebagai #comingsoon di menu belum diimplementasikan secara penuh.
- Perubahan pada respons bot perlu dilakukan dengan hati-hati agar karakter dan nuansa bot tetap terjaga.
