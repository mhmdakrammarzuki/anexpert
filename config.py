# anexpert/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    AYAH_USERNAME = os.getenv("AYAH_USERNAME")
    
    # Konfigurasi Webhook
    USE_WEBHOOK = os.getenv("USE_WEBHOOK", "False").lower() == "true"
    WEBHOOK_URL = os.getenv("WEBHOOK_URL")
    PORT = int(os.getenv("PORT", 8443))
    
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN tidak ditemukan di file .env!")
