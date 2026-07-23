# anexpert/handlers/start.py
from telegram import Update
from telegram.ext import ContextTypes
from config import Config

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    username = update.effective_user.username
    
    if username == Config.AYAH_USERNAME:
        welcome = "Ni hao, Ayah! (｡•̀ᴗ•́)✧\nAnne siap jadi anak yang berbakti\n/menu seperti biasanya yah~ ^^"
    else:
        welcome = "Halo~ Anne di sini :D\nSilakan ketik /menu dan melihat apa saja yang bisa membuat amu terbantu!"
    await update.message.reply_text(welcome)
