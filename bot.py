# anexpert/bot.py
import logging
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters, Application
from config import Config
from handlers.start import start
from handlers.menu import menu_command
from handlers.sticker_generator import stiker_command
from handlers.downloader import downloader_command, downloader_button_callback
from handlers.debug import status_command
from utils.storage_manager import process_pending_deletions

# --- FORMATTER PENYENSOR TOKEN MUTLAK ---
class TokenMaskFormatter(logging.Formatter):
    def format(self, record):
        original_msg = super().format(record)
        if Config.TELEGRAM_BOT_TOKEN:
            return original_msg.replace(Config.TELEGRAM_BOT_TOKEN, ':anexpert_bot')
        return original_msg

# Konfigurasi Logging Khusus
logger = logging.getLogger()
logger.setLevel(logging.INFO)

if logger.hasHandlers():
    logger.handlers.clear()

console_handler = logging.StreamHandler()
formatter = TokenMaskFormatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

async def on_startup(application: Application):
    await process_pending_deletions(application)

def main():
    application = (
        ApplicationBuilder()
        .token(Config.TELEGRAM_BOT_TOKEN)
        .connect_timeout(30.0)
        .read_timeout(30.0)
        .post_init(on_startup)
        .build()
    )

    # Registrasi Handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("menu", menu_command))
    application.add_handler(CommandHandler("stiker", stiker_command))
    application.add_handler(CommandHandler("dl", downloader_command))
    
    # Registrasi Handler Baru (Debug)
    application.add_handler(CommandHandler("status", status_command))
    
    # Registrasi Handler Tombol (Callback)
    application.add_handler(CallbackQueryHandler(downloader_button_callback, pattern="^dl_"))
    
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
        application.run_polling(poll_interval=30.0)

if __name__ == '__main__':
    main()
