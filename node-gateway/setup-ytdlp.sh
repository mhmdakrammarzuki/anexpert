#!/bin/bash
# anexpert/node-gateway/setup-ytdlp.sh
#
# Download binary yt-dlp standalone yang sesuai dengan platform kamu.
# Jalankan sekali saja setelah clone/extract project ini.
set -e
cd "$(dirname "$0")/bin"

OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" = "Linux" ]; then
  if [ -d /data/data/com.termux ] || [ -n "$TERMUX_VERSION" ]; then
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
  else
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
  fi
  OUT="yt-dlp"
elif [ "$OS" = "Darwin" ]; then
  URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
  OUT="yt-dlp"
else
  URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
  OUT="yt-dlp.exe"
fi

echo "Mengunduh yt-dlp dari: $URL"
curl -sL -o "$OUT" "$URL"
chmod +x "$OUT" 2>/dev/null || true

echo "Selesai. Versi terpasang:"
./"$OUT" --version

echo ""
echo "Jangan lupa pastikan ffmpeg juga terpasang di sistem kamu (dibutuhkan"
echo "untuk convert audio ke MP3):"
echo "  Ubuntu/Debian : sudo apt install ffmpeg"
echo "  Termux        : pkg install ffmpeg"
echo "  macOS         : brew install ffmpeg"
echo "  Windows       : download dari https://ffmpeg.org/download.html"
