#!/bin/bash
# anexpert/go-processor/build-all.sh
#
# Compile processor untuk semua platform sekaligus. Jalankan ini di
# komputer kamu sendiri (bukan HP) yang punya akses internet penuh.
# Hasil compile akan muncul di folder prebuilt/.
set -e
cd "$(dirname "$0")"

echo "1/6 Menyiapkan dependency (go mod tidy)..."
go mod tidy

mkdir -p prebuilt

echo "2/6 Build untuk Linux (x86_64)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o prebuilt/processor-linux-amd64 .

echo "3/6 Build untuk Linux ARM64 (server ARM / Raspberry Pi 64-bit)..."
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o prebuilt/processor-linux-arm64 .

echo "4/6 Build untuk Android/Termux ARM64 (HP modern 64-bit)..."
CGO_ENABLED=0 GOOS=android GOARCH=arm64 go build -o prebuilt/processor-android-arm64 .

echo "5/6 Build untuk Windows (x86_64)..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o prebuilt/processor-windows-amd64.exe .

echo "6/6 Build untuk macOS (Apple Silicon)..."
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o prebuilt/processor-darwin-arm64 .

echo ""
echo "Selesai! Semua binary ada di folder prebuilt/:"
ls -la prebuilt/
echo ""
echo "Catatan: HP Android 32-bit lawas (ARMv7) TIDAK didukung oleh script ini,"
echo "karena toolchain Go mewajibkan cgo untuk target itu. Hampir semua HP"
echo "keluaran 2017 ke atas sudah 64-bit (arm64), jadi harusnya aman."
