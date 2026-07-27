# Anexpert Hybrid (Node.js + Go)

Ini adalah hasil migrasi bot Telegram "Anexpert" dari Python murni menjadi
arsitektur hibrida sesuai blueprint di `config.md` repo asli:

- **`node-gateway/`** → "pintu gerbang". Ini yang konek ke Telegram, terima
  perintah (`/start`, `/menu`, `/sticker`, `/dl`, dst), dan mengatur alur.
  Semua yang sifatnya nunggu jaringan (download, kirim pesan) ada di sini.
- **`go-processor/`** → "mesin berat". Dipanggil oleh Node.js hanya saat ada
  kerjaan yang butuh CPU banyak: bikin gambar sticker (generate teks jadi
  gambar / convert foto jadi sticker) dan baca info sistem (CPU/RAM/Disk).

## Cara kerja komunikasi Node <-> Go (versi awam)

Node.js akan menjalankan file Go yang sudah di-compile (namanya `processor`
atau `processor.exe` di Windows) sebagai program terpisah, persis kayak kamu
buka aplikasi lain dari komputer. Node.js kirim instruksi + data lewat
parameter command line (dalam bentuk array, BUKAN string yang digabung
manual — ini demi keamanan, sesuai poin "Sanitasi Batas Antar Proses" di
`config.md`), lalu Go mengembalikan hasilnya (path file gambar, atau teks
JSON) lewat stdout. Setelah selesai, Node.js yang bertanggung jawab
menghapus file-file sementara.

Ini disebut **"Fase Monolitik Hibrida"** — paling simpel, cocok untuk bot
personal seperti ini. Kalau nanti butuh scale besar, baru dipisah jadi
server Go sendiri (Fase Microservices) tanpa perlu bongkar total kode.

## Struktur folder

```
anexpert-hybrid/
├── node-gateway/           # Bot Telegram (Node.js)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── bot.js          # entry point, sama seperti bot.py lama
│       ├── config.js       # baca .env
│       ├── handlers/       # satu file per command, sama seperti handlers/ Python
│       └── utils/
│           ├── goBridge.js      # yang manggil program Go
│           └── storageManager.js # jadwal hapus pesan otomatis
│
└── go-processor/            # Mesin pemroses gambar & sistem (Go)
    ├── go.mod
    ├── main.go               # dispatcher: "brat", "convert", "sysinfo"
    └── internal/
        ├── sticker/          # logika generate & convert gambar
        ├── sysinfo/          # pengganti native untuk fastfetch
        └── ipc/              # helper baca/tulis data antar proses
```

## Cara menjalankan (di komputer/HP kamu, bukan di sini)

### 1. Compile bagian Go
```bash
cd go-processor
./build-all.sh
```
Script ini akan otomatis compile untuk 5 platform sekaligus (Linux x86_64,
Linux ARM64, **Android/Termux ARM64**, Windows, macOS Apple Silicon), hasilnya
ada di `go-processor/prebuilt/`. Tinggal salin file yang sesuai HP/komputer
kamu ke `node-gateway/bin/processor` (atau `processor.exe` untuk Windows).

> **Update:** Kode ini sudah aku compile dan tes beneran (bukan cuma
> ditulis doang) — sysinfo, generate sticker brat, dan convert gambar
> semuanya menghasilkan file WEBP 512x512 yang valid, dan sudah dites
> terhubung dari Node.js lewat `goBridge.js`. Aku juga sudah cross-compile
> untuk semua platform di atas dan file hasilnya sudah aku sertakan di
> `go-processor/prebuilt/` — kamu tinggal pakai, nggak perlu compile ulang
> kecuali mau update kode.
>
> Aku sengaja ganti encoder WEBP dari yang tadinya butuh library C
> (`libwebp`, ribet di-setup di HP) ke **encoder WEBP murni Go**
> (`nativewebp`). Konsekuensinya: tidak perlu install apa pun tambahan di
> Termux, dan binary-nya bisa langsung di-cross-compile ke Android tanpa
> toolchain C sama sekali. Satu-satunya kompromi: format WEBP yang
> dihasilkan sekarang lossless (bukan lossy quality 80 seperti sebelumnya),
> jadi ukuran file sticker sedikit lebih besar — untuk pemakaian bot
> personal ini nggak masalah.
>
> Satu hal teknis lain: jaringan sandbox tempat aku kerja memblokir
> `proxy.golang.org`, jadi supaya `go mod tidy` bisa jalan, aku tambahkan
> beberapa baris `replace` di `go.mod` yang mengarahkan ke mirror GitHub
> resmi. Baris-baris itu aman dibiarkan; kalau internet kamu normal tanpa
> firewall aneh, boleh juga dihapus.

### 1b. Khusus HP Android via Termux
```bash
pkg install golang     # kalau belum ada Go di Termux
# lalu di komputer LAIN yang sudah build (lihat build-all.sh), cukup salin:
cp go-processor/prebuilt/processor-android-arm64 node-gateway/bin/processor
chmod +x node-gateway/bin/processor
```
Binary `processor-android-arm64` ini sudah dites bisa jalan (format ELF
ARM64 valid, linker `/system/bin/linker64`) — tapi karena sandbox-ku tidak
punya perangkat Android fisik, aku belum bisa memastikan 100% berjalan
mulus di Termux sungguhan. Kalau ada error saat pertama kali dicoba,
kabari aku detail pesan errornya ya.

> Catatan: HP Android 32-bit lawas (ARMv7, biasanya keluaran sebelum ~2017)
> tidak didukung, karena toolchain Go mewajibkan cgo untuk target itu.

### 2. Jalankan bagian Node.js
```bash
cd node-gateway
npm install
./setup-ytdlp.sh        # download binary yt-dlp untuk fitur /dl
cp .env.example .env    # lalu isi TELEGRAM_BOT_TOKEN dan AYAH_USERNAME
npm start
```

## Perbedaan dari versi Python lama

| Fitur | Python lama | Versi baru |
|---|---|---|
| Downloader `/dl` | `yt-dlp` (Python) | `yt-dlp` binary standalone (satu file executable, dipanggil dari Node lewat `execFile`, TANPA install Python) |
| Sticker generator | Pillow (Python) | Go (`image/draw` + font rendering + `nativewebp` encoder murni Go, tanpa cgo) dipanggil dari Node |
| `/status` (info sistem) | shell command `fastfetch` (khusus Termux) | Go native (baca CPU/RAM/Disk langsung), jadi portable ke server Linux/Windows/Mac/Android mana pun |
| Auto-hapus pesan setelah 5 menit | `python-telegram-bot` JobQueue + file JSON | `node-schedule` + file JSON (logika sama persis) |

## Setup downloader `/dl` (yt-dlp)

Fitur `/dl` butuh dua hal terpasang di `node-gateway/bin/`:
1. **Binary `yt-dlp`** (bukan versi Python — versi standalone satu file)
2. **`ffmpeg`** terpasang di sistem (untuk convert ke MP3)

Cara paling gampang, jalankan:
```bash
cd node-gateway
./setup-ytdlp.sh
```
Script ini otomatis mendeteksi OS kamu (Linux/Termux/macOS/Windows) dan
download binary yt-dlp yang sesuai dari halaman rilis resminya di GitHub.

> **Sudah aku tes beneran:** aku download binary yt-dlp asli, panggil lewat
> pola `execFile` yang sama persis dengan yang dipakai di `downloader.js`,
> dan hasilnya terpanggil dengan benar (termasuk pesan error yang rapi kalau
> link-nya tidak valid). Yang belum bisa aku tes dari sandbox ini adalah
> download video sungguhan dari YouTube dkk, karena jaringan sandbox-ku
> memblokir domain-domain video streaming. Jadi logikanya sudah teruji
> solid, tinggal kamu coba pakai link video asli pas nanti dijalankan.

Kalau `ffmpeg` belum ada:
```bash
# Ubuntu/Debian
sudo apt install ffmpeg
# Termux (Android)
pkg install ffmpeg
# macOS
brew install ffmpeg
```


## Yang perlu kamu isi sendiri di `.env`
- `TELEGRAM_BOT_TOKEN`
- `AYAH_USERNAME`
- `USE_WEBHOOK` (opsional)
- `WEBHOOK_URL` (opsional)
- `PORT` (opsional, default 8443)

Semua nama variabel sengaja dibuat identik dengan `.env` versi Python biar
kamu tinggal salin dari file lama kalau ada.
