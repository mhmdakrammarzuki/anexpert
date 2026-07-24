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


async def health_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    # Hanya admin boleh menjalankan command debug
    if not is_ayah:
        return

    try:
        me = await context.bot.get_me()
        msg = f"Bot is reachable as @{me.username} (id: {me.id})"
    except Exception as e:
        msg = f"Health check failed: {e}"

    await update.message.reply_text(msg)


async def uptime_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    import time
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    if not is_ayah:
        return

    start_time = None
    try:
        start_time = context.application.bot_data.get('start_time')
    except Exception:
        start_time = None

    if not start_time:
        await update.message.reply_text("Uptime information not available.")
        return

    diff = int(time.time() - start_time)
    hours, remainder = divmod(diff, 3600)
    minutes, seconds = divmod(remainder, 60)
    await update.message.reply_text(f"Uptime: {hours}h {minutes}m {seconds}s")


async def info_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    import sys
    import platform
    import telegram

    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    if not is_ayah:
        return

    py_ver = sys.version.splitlines()[0]
    plat = platform.platform()
    tg_ver = getattr(telegram, '__version__', 'unknown')
    use_webhook = Config.USE_WEBHOOK

    msg = (
        f"Python: {py_ver}\n"
        f"Platform: {plat}\n"
        f"python-telegram-bot: {tg_ver}\n"
        f"Use webhook: {use_webhook}\n"
    )

    await update.message.reply_text(msg)
