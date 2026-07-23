# anexpert/handlers/debug.py
import psutil
from telegram import Update
from telegram.ext import ContextTypes
from config import Config

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME
    
    # KUNCI KEAMANAN: Hentikan eksekusi secara mutlak jika bukan Ayah
    if not is_ayah:
        return

    # Membaca sensor perangkat keras
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    msg = (
        "Status Sistem (Server/Docker)**\n\n"
        f"CPU:{cpu}%\n"
        f"RAM: {ram.percent}% ({ram.used // (1024**2)}MB / {ram.total // (1024**2)}MB)\n"
        f"Disk: {disk.percent}% ({disk.used // (1024**3)}GB / {disk.total // (1024**3)}GB)"
    )
    
    await update.message.reply_text(msg, parse_mode="Markdown")
