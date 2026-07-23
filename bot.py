# anexpert/bot.py
import logging
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
from config import Config
from handlers.start import start
from handlers.menu import menu_command
from handlers.sticker_generator import stiker_command

# --- FORMATTER PENYENSOR TOKEN MUTLAK ---
class TokenMaskFormatter(logging.Formatter):
    def format(self, record):
        # Format pesan utuh terlebih dahulu
        original_msg = super().format(record)
        # Ganti token dengan teks sensor di hasil akhir
        if Config.TELEGRAM_BOT_TOKEN:
            return original_msg.replace(Config.TELEGRAM_BOT_TOKEN, ':anexpert_bot')
        return original_msg

# Konfigurasi Logging Khusus
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Hapus pengaturan log bawaan agar tidak terjadi cetak ganda
if logger.hasHandlers():
    logger.handlers.clear()

# Buat jalur cetak terminal yang menggunakan Formatter Penyensor
console_handler = logging.StreamHandler()
formatter = TokenMaskFormatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def main():
    application = (
        ApplicationBuilder()
        .token(Config.TELEGRAM_BOT_TOKEN)
        .connect_timeout(30.0)
        .read_timeout(30.0)
        .build()
    )

    # Registrasi Handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("menu", menu_command))
    application.add_handler(CommandHandler("stiker", stiker_command))
    application.add_handler(MessageHandler(
        (filters.PHOTO | filters.Document.IMAGE) & filters.CaptionRegex(r'(?i)/stiker'), 
        stiker_command
    ))

    # Mode Eksekusi Berdasarkan Konfigurasi
    if Config.USE_WEBHOOK and Config.WEBHOOK_URL:
        logger.info(f"Bot 'anexpert' sedang berjalan (webhook) pada port {Config.PORT}...")
        application.run_webhook(
            listen="0.0.0.0",
            port=Config.PORT,
            webhook_url=Config.WEBHOOK_URL
        )
    else:
        logger.info("Bot 'anexpert' sedang berjalan (polling)...")
        application.run_polling(poll_interval=15.0)

if __name__ == '__main__':
    main()
