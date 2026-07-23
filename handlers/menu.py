# anexpert/handlers/menu.py
from telegram import Update
from telegram.ext import ContextTypes
from config import Config

async def menu_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    if is_ayah:
        teks_menu = """Ni hao, Ayah! Anne hadir  (｡•̀ᴗ•́)✧
Maaf telat yaw :3, nih adek sediain skill yang dapat Ayah gunakan untuk sekarang:

══════════════════════
Debug
├ /status

Fitur Umum
├ /menu
├ /stiker
├ /dl
└ #comingsoon

Produktivitas
└ #comingsoon
══════════════════════"""
    else:
        teks_menu = """Halo ges, Anne disini :3 Sorry telat hehe... nih daftar fitur yang dapat digunakan untuk sekarang:

══════════════════════
Fitur Umum
├ /menu
├ /stiker
├ /dl
└ #comingsoon

Produktivitas
└ #comingsoon
══════════════════════"""

    await update.message.reply_text(teks_menu)
