# Konfigurasi Bot Anexpert

## 1. Ringkasan Proyek
Bot Anexpert adalah asisten Telegram yang dirancang untuk membantu pengguna dalam aktivitas harian dengan fokus pada pengalaman yang ramah, konsisten, dan mudah dipahami. Proyek ini dibuat dengan pendekatan yang scalable, aman, enak dilihat, dan mudah dikelola.

## 2. Seluruh Isi dan Fitur Bot

### Fitur Utama
- /start
  - Menampilkan salam pembuka untuk pengguna baru.
  - Memberikan pengalaman personal yang berbeda untuk admin dan user.

- /menu
  - Menampilkan daftar fitur yang tersedia.
  - Menyajikan informasi secara terstruktur dan rapi.

- /stiker
  - Mengubah teks atau gambar menjadi sticker.
  - Mendukung penggunaan melalui:
    - teks langsung
    - gambar yang dikirim bersama caption /stiker
    - reply terhadap teks atau gambar

- /dl [link]
  - Mengunduh media dari URL yang diberikan.
  - Menyediakan pilihan format:
    - video / MP4
    - audio / MP3
  - Mendukung pengunduhan dengan batasan ukuran yang wajar.

- /status
  - Fitur debug untuk memeriksa status sistem.
  - Digunakan untuk kebutuhan administrasi dan pemeliharaan.

### Karakteristik Fitur
- Semua fitur harus bekerja secara konsisten.
- Respons bot harus tetap sopan, jelas, dan mudah dipahami.
- Setiap fitur harus dirancang agar tidak mengubah makna komunikasi secara berlebihan.

## 3. Aturan Balasan Bot

### Prinsip Utama
- Balasan bot tidak boleh dimodifikasi secara bebas oleh pihak lain maupun AI.
- Seluruh respons bot harus tetap konsisten dengan karakter dan gaya yang telah ditetapkan.
- Balasan tidak boleh diubah menjadi kasar, ambigu, atau terlalu santai sehingga mengurangi kualitas pengalaman pengguna.

### Ketentuan Balasan
- Balasan bot harus tetap bersifat ramah, profesional, dan menyenangkan.
- Bot tidak boleh mengubah nada komunikasi secara tiba-tiba.
- Semua pesan harus tetap mudah dibaca dan tidak membingungkan.

## 4. Perbedaan Respons Admin dan User

### Admin
- Bot harus memperlakukan admin dengan sikap yang lebih hangat, hormat, dan personal.
- Respons admin boleh lebih lembut, eksklusif, dan penuh perhatian.
- Contoh karakteristik:
  - sopan
  - penuh rasa hormat
  - hangat
  - suportif

### User
- Bot harus memperlakukan user dengan sikap ramah, terbuka, dan membantu.
- Respons user harus tetap friendly namun tidak terlalu personal.
- Contoh karakteristik:
  - ramah
  - membantu
  - jelas
  - tidak kaku

## 5. Sikap dan Sifat Bot

Bot Anexpert harus memiliki sifat berikut:
- Ramah
- Sopan
- Lucu dan menyenangkan, namun tetap profesional
- Responsif
- Tidak membingungkan
- Menyenangkan untuk diajak berinteraksi
- Menjaga suasana komunikasinya tetap nyaman

## 6. Prinsip Arsitektur dan Pengembangan

### Scalable
- Struktur kode harus mudah dikembangkan untuk fitur baru di masa depan.
- Pemisahan handler, utilitas, dan logika bisnis harus jelas.
- Penambahan fitur baru tidak boleh membuat sistem menjadi sulit dipelihara.

### Secure
- Hindari penyimpanan token atau data sensitif secara sembarangan.
- Gunakan konfigurasi yang aman dan terpisah.
- Pastikan proses pengunduhan dan penyimpanan file tetap aman dan terkontrol.

### Enak Dilihat
- Output bot harus terstruktur dengan rapi.
- Pesan yang dikirim harus mudah dibaca dan memiliki format yang konsisten.
- Penggunaan menu, pembagian fitur, dan gaya bahasa harus nyaman dilihat.

### Mudah Dipahami
- Bahasa yang digunakan harus sederhana dan jelas.
- Tidak boleh ada pesan yang terlalu teknis tanpa penjelasan.
- Pengguna harus dengan cepat memahami apa yang bisa dilakukan bot.

## 7. Standar Implementasi
- Semua fitur harus terorganisir dengan baik dalam modul yang terpisah.
- Penamaan fungsi dan handler harus jelas.
- Komunikasi bot harus tetap konsisten antara satu fitur dengan fitur lainnya.
- Perubahan pada respons bot harus dilakukan dengan hati-hati agar tidak merusak karakter yang sudah dibangun.

## 8. Kesimpulan
Bot Anexpert dirancang sebagai asisten Telegram yang tidak hanya fungsional, tetapi juga nyaman, aman, dan menyenangkan untuk digunakan. Fokus utamanya adalah memberikan pengalaman interaksi yang konsisten, personal sesuai peran pengguna, dan tetap mudah dipahami oleh siapapun.
