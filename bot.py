# anexpert/bot.py
import logging
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
from config import Config
from handlers.start import start
from handlers.menu import menu_command
from handlers.sticker_generator import stiker_command

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

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
        logger.info(f"Bot anexpert berjalan dalam mode WEBHOOK pada port {Config.PORT}...")
        application.run_webhook(
            listen="0.0.0.0",
            port=Config.PORT,
            webhook_url=Config.WEBHOOK_URL
        )
    else:
        logger.info("Bot anexpert berjalan dalam mode POLLING...")
        application.run_polling()

if __name__ == '__main__':
    main()
