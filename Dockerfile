FROM python:3.10-slim

# Set zona waktu dan working directory
ENV TZ=Asia/Makassar
WORKDIR /app

# Install pustaka sistem yang dibutuhkan oleh Pillow (Manipulasi Gambar) & Fitur Downloader (yt-dlp)
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    ffmpeg \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Salin daftar pustaka dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode proyek (kecuali yang ada di .dockerignore/.gitignore)
COPY . .

# Jalankan bot
CMD ["python", "bot.py"]
