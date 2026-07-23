# anexpert/handlers/start.py
from telegram import Update
from telegram.ext import ContextTypes
from config import Config

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    if is_ayah:
        welcome_message = "Ni hao, Ayah! (｡•̀ᴗ•́)✧\nAnne siap membantu Ayah membuat stiker. Kirimkan saja teksnya, yaw!"
    else:
        welcome_message = "Ni hao! Anne di sini. ( ˶ˆ ˆ˵ )\nKirimkan teks aja yaw kalau mau dibuatkan stiker..."
        
    await update.message.reply_text(welcome_message)
