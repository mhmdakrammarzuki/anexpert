# Blueprints Arsitektur Sistem Hibrida Universal (Node.js + Go)

Dokumen ini mendefinisikan standar arsitektur, batas tanggung jawab komponen, strategi skalabilitas, dan protokol keamanan untuk sistem bot berbasis hibrida. Cetak biru ini dirancang secara universal agar mesin atau AI dapat melakukan penalaran (reasoning) dalam menentukan penempatan fitur berdasarkan karakteristik beban kerja.

---

## 1. Pemisahan Peran Berdasarkan Karakteristik Beban Kerja

Sistem memisahkan tugas menjadi dua kategori utama untuk mengoptimalkan pemanfaatan sumber daya server (CPU dan RAM).

### 🌐 Node.js: Komponen Gateway & Manajemen I/O (Input/Output Bound)
Node.js bertindak sebagai lapisan terdepan yang menangani seluruh komunikasi jaringan yang bersifat asinkronus dan berbasis peristiwa (*event-driven*).
* **Kriteria Tugas**: Operasi yang membutuhkan latensi jaringan rendah, manajemen koneksi simultan skala besar, manipulasi teks ringan, integrasi API pihak ketiga, dan manajemen status (*state/session*).
* **Sifat Beban Kerja**: Tinggi di aktivitas I/O, rendah di penggunaan CPU. Menangani logika bisnis makro dan alur kendali utama aplikasi.

### ⚡ Go (Golang): Komponen Eksekusi & Pemrosesan Intuitif (CPU Bound)
Go bertindak sebagai mesin komputasi berkinerja tinggi yang mengeksekusi instruksi tingkat rendah secara paralel dan terkompilasi murni.
* **Kriteria Tugas**: Operasi yang membutuhkan kalkulasi matematis berat, manipulasi biner/berkas mentah, rendering data, kompresi, dan tugas-tugas yang menguras siklus *clock* prosesor.
* **Sifat Beban Kerja**: Tinggi di aktivitas CPU, membutuhkan manajemen memori (RAM) yang ketat, isolasi proses, dan skalabilitas paralelisme (*multithreading*).

---

## 2. Strategi Skalabilitas & Pertimbangan Fitur Baru (Scalability Decision Matrix)

Ketika ada penambahan fitur baru di masa depan, sistem atau AI harus menganalisis fitur tersebut menggunakan aturan berikut untuk menentukan penempatannya:

### Aturan Penentuan Komponen
1. **Jika Fitur Bersifat Komputasi Berat**: Wajib didelegasikan ke komponen **Go** sebagai sub-proses terisolasi atau layanan mikro (*microservice*) agar tidak mengunci (*blocking*) thread utama.
2. **Jika Fitur Bersifat Integrasi / Logika Chat**: Wajib ditulis di komponen **Node.js** untuk mempercepat waktu pengembangan (*time-to-market*) dan kemudahan pemeliharaan.

### Desain Arsitektur Multi-Tahap
* **Fase Monolitik Hibrida**: Node.js memanggil komponen Go secara lokal melalui mekanisme inter-proses (`child_process / IPC`) dengan melemparkan parameter terstruktur.
* **Fase Mikrolayanan (Microservices)**: Ketika antrean komputasi berat mulai mengganggu subsistem I/O, komunikasi antar komponen diubah menjadi arsitektur berbasis antrean pesan (*Message Broker*) atau RPC (Remote Procedure Call) yang terdistribusi di server berbeda.

---

## 3. Protokol Keamanan Universal (Security Blueprints)

Keamanan sistem hibrida bertumpu pada isolasi ketat dan validasi berlapis di setiap batas komponen.

* **Validasi di Pintu Gerbang (Gateway Isolation)**: Komponen Node.js wajib melakukan penyaringan, pembatasan ukuran data (*rate limiting*), dan validasi tipe data sebelum data mentah diteruskan ke komponen Go.
* **Sanitasi Batas Antar Proses (IPC/CLI Sanitization)**: Pertukaran data antar bahasa tidak boleh menggunakan string bebas yang dievaluasi langsung oleh shell sistem operasi. Semua parameter wajib dilewatkan dalam bentuk larik (*array argument*) yang kaku untuk mencegah eksploitasi injeksi perintah (*Command Injection*).
* **Isolasi Lingkungan Eksekusi**: Komponen pemroses berat harus dijalankan dengan hak akses pengguna (*user permission*) paling rendah di sistem operasi, serta dibatasi ruang lingkup akses direktorinya hanya pada folder sementara (*sandboxed temporary directory*).
* **Abstraksi Kredensial**: Tidak ada rahasia (*secret/token*) yang ditanam di dalam kode. Seluruh konfigurasi lingkungan dimuat secara dinamis saat sistem dinyalakan melalui variabel lingkungan (*Environment Variables*).

---

## 4. Manajemen Kebersihan & Metrik (Cleanup & Telemetry)

* **Siklus Hidup Data Sementara**: Komponen yang bertindak sebagai pemroses wajib memberikan sinyal balik (*callback/exit code*) yang jelas setelah tugas selesai. Komponen gateway bertanggung jawab penuh atas pembersihan sisa memori atau berkas fisik di media penyimpanan sekunder setelah proses selesai.
* **Telemetri Terdistribusi**: Setiap komponen harus menghasilkan log yang terstandarisasi (misalnya format JSON terstruktur). Komponen komputasi wajib mencatat metrik durasi eksekusi dan efisiensi memori, sedangkan komponen gateway mencatat metrik latensi respon dan tingkat keberhasilan transaksi.
