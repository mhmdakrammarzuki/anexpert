# anexpert/handlers/downloader.py
import os
import yt_dlp
import asyncio
from telegram import Update
from telegram.ext import ContextTypes
from utils.storage_manager import schedule_deletion
from config import Config

async def downloader_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME
    
    if not context.args:
        if is_ayah:
            msg = (
                "Ayah harus kirimin dulu link videonya yaw -.-\n\n"
                "Caranya:\n"
                "Ketik `/dl [link_video]`\n\n"
                "Jan lupa Yah, berikan Anne jajan sesekali atas kerja kerasnya :v"
            )
        else:
            msg = (
                "Kirimkan link videonya ges\n\n"
                "Caranya:\n"
                "Ketik `/dl [link_video]`"
            )
        await update.message.reply_text(msg, parse_mode="Markdown")
        return
        
    url = context.args[0]
    
    if is_ayah:
        status_msg = await update.message.reply_text("Sabar Ayah, Anne lagi ngambil videonya... (｡•̀ᴗ•́)✧")
    else:
        status_msg = await update.message.reply_text("Tunggu bentar nih, lagi di-download...")
    
    ydl_opts = {
        'format': 'best[filesize<50M]',
        'outtmpl': 'downloads/%(id)s.%(ext)s',
        'quiet': True,
        'noplaylist': True,
    }
    
    try:
        if not os.path.exists('downloads'):
            os.makedirs('downloads')
            
        def extract_info():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                return ydl.prepare_filename(info)
                
        loop = asyncio.get_event_loop()
        file_path = await loop.run_in_executor(None, extract_info)
        
        with open(file_path, 'rb') as video_file:
            sent_msg = await update.message.reply_video(video=video_file)
            
        # Hapus video setelah 5 menit
        schedule_deletion(context, sent_msg.chat_id, sent_msg.message_id)
        
        await status_msg.delete()
        os.remove(file_path)
        
    except Exception as e:
        if is_ayah:
            error_msg = f"M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis pas download: `{str(e)[:100]}`"
        else:
            error_msg = "Maaf nih yek, linknya susah di-download atau file-nya kegedean (maks 50MB)... Coba link lain yah!"
        await status_msg.edit_text(error_msg, parse_mode="Markdown")
