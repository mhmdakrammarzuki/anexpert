# anexpert/handlers/sticker_generator.py
import io
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import ContextTypes
from utils.image_processing import generate_brat_sticker, convert_image_to_sticker
from config import Config

async def stiker_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME

    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, 
        action=ChatAction.CHOOSE_STICKER
    )

    try:
        async def process_and_send_image(message):
            if message.photo:
                file_id = message.photo[-1].file_id
            elif message.document and message.document.mime_type and message.document.mime_type.startswith('image/'):
                file_id = message.document.file_id
            else:
                return False
            
            photo_file = await context.bot.get_file(file_id)
            bio_in = io.BytesIO()
            await photo_file.download_to_memory(out=bio_in)
            
            sticker_bio = convert_image_to_sticker(bio_in.getvalue())
            await update.message.reply_sticker(sticker=sticker_bio)
            return True

        if update.message.reply_to_message:
            if await process_and_send_image(update.message.reply_to_message):
                return
            if update.message.reply_to_message.text:
                text = update.message.reply_to_message.text
                sticker_bio = generate_brat_sticker(text)
                await update.message.reply_sticker(sticker=sticker_bio)
                return
            if update.message.reply_to_message.caption:
                text = update.message.reply_to_message.caption
                sticker_bio = generate_brat_sticker(text)
                await update.message.reply_sticker(sticker=sticker_bio)
                return

        if await process_and_send_image(update.message):
            return

        text = ""
        if context.args:
            text = " ".join(context.args)
        elif update.message.text:
            text = update.message.text.lower().replace('/stiker', '').strip()
        elif update.message.caption:
            text = update.message.caption.lower().replace('/stiker', '').strip()

        if text:
            sticker_bio = generate_brat_sticker(text)
            await update.message.reply_sticker(sticker=sticker_bio)
            return

        if is_ayah:
            pesan_bantuan = (
                "Ayah harus kirimin dulu sesuatu untuk dijadikan stiker yaw -.-\n\n"
                "Caranya:\n"
                "1. Ketik `/stiker [teks]`\n"
                "2. Kirim gambar, lalu ketik `/stiker` di caption-nya\n"
                "3. Reply / balas gambar atau teks dengan pesan `/stiker`\n\n"
                "Jan lupa Yah, berikan Anne jajan sesekali atas kerja kerasnya :v"
            )
        else:
            pesan_bantuan = (
                "Kirimkan sesuatu untuk dijadikan stiker\n\n"
                "Caranya:\n"
                "1. Ketik `/stiker [teks]`\n"
                "2. Kirim gambar, lalu ketik `/stiker` di caption-nya\n"
                "3. Reply / balas gambar atau teks dengan pesan `/stiker`"
            )
        await update.message.reply_text(pesan_bantuan, parse_mode="Markdown")

    except Exception as e:
        if is_ayah:
            error_msg = f"M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis: `{str(e)}`"
        else:
            error_msg = "Maaf nih yek, Anne lagi ngantuk nih ( ͡° ᴥ ͡°)﻿... Coba lagi nanti yaw!"
        await update.message.reply_text(error_msg, parse_mode="Markdown")
