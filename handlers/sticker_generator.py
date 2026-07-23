# anexpert/handlers/sticker_generator.py
import io
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import ContextTypes
from utils.image_processing import generate_brat_sticker, convert_image_to_sticker

async def stiker_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, 
        action=ChatAction.CHOOSE_STICKER
    )

    try:
        # FUNGSI INTERNAL: Memproses dan mengunduh gambar dengan aman
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

        # KASUS 1: Reply pesan (Gambar atau Teks)
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

        # KASUS 2: Pesan berupa Gambar/Dokumen yang memiliki caption "/stiker"
        # Karena bot.py sudah menyaringnya, fungsi ini pasti akan memproses gambarnya!
        if await process_and_send_image(update.message):
            return

        # KASUS 3: Perintah berupa teks langsung (contoh: /stiker halo)
        text = ""
        if context.args:
            text = " ".join(context.args)
        elif update.message.text:
            # Hapus perintah /stiker dari teks
            text = update.message.text.lower().replace('/stiker', '').strip()
        elif update.message.caption:
            # Hapus perintah /stiker dari caption (berjaga-jaga jika lolos dari Kasus 2)
            text = update.message.caption.lower().replace('/stiker', '').strip()

        if text:
            sticker_bio = generate_brat_sticker(text)
            await update.message.reply_sticker(sticker=sticker_bio)
            return

        # JIKA SEMUANYA KOSONG
        pesan_bantuan = (
            "Ayah, kirimkan sesuatu untuk dijadikan stiker yaw!\n"
            "Caranya:\n"
            "1. Ketik `/stiker [teks]`\n"
            "2. Kirim gambar, lalu tulis `/stiker` di caption-nya.\n"
            "3. Reply/Balas gambar atau teks dengan pesan `/stiker`."
        )
        await update.message.reply_text(pesan_bantuan, parse_mode="Markdown")

    except Exception as e:
        await update.message.reply_text(f"M-maaf Ayah, Anne bingung... Ada error teknis: `{str(e)}`", parse_mode="Markdown")
