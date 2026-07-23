# anexpert/handlers/menu.py
from telegram import Update
from telegram.ext import ContextTypes
from config import Config

async def menu_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    if is_ayah:
        teks_menu = """Ni hao, Ayah! Anne hadir.  (｡•̀ᴗ•́)✧
Maaf telat yaw, nih daftar fitur yang dapat Ayah gunakan untuk sekarang:

══════════════════════
Fitur Umum
├ /menu
├ /stiker
└ #comingsoon

Produktivitas
├ /jadwal
├ /lihatJadwal
└ #comingsoon
══════════════════════"""
    else:
        teks_menu = """Ni hao! Anne hadir. (˶ˆ ˆ˵)
Maaf telat yaw, ini daftar fitur yang dapat kamu gunakan untuk sekarang:

══════════════════════
Fitur Umum
├ /menu
├ /stiker
└ #comingsoon

Produktivitas
├ /jadwal
├ /lihatJadwal
└ #comingsoon
══════════════════════"""

    await update.message.reply_text(teks_menu)
