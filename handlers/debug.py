# anexpert/handlers/debug.py
import subprocess
from telegram import Update
from telegram.ext import ContextTypes
from config import Config

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME
    
    # KUNCI KEAMANAN: Hentikan eksekusi secara mutlak jika bukan Ayah
    if not is_ayah:
        return

    # Membaca sensor perangkat keras (Bypass Android menggunakan Fastfetch)
    try:
        # Memanggil modul spesifik agar identik dengan format psutil sebelumnya
        result = subprocess.run(
            ['fastfetch', '-s', 'CPU:Memory:Disk', '--logo', 'none'], 
            capture_output=True, 
            text=True
        )
        sensor_data = result.stdout
    except Exception as e:
        sensor_data = f"Gagal membaca sensor: {e}"

    msg = (
        "**Status Sistem (Termux Native/Fastfetch)**\n\n"
        f"```text\n{sensor_data}```"
    )
    
    await update.message.reply_text(msg, parse_mode="Markdown")
