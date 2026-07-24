# anexpert/handlers/downloader.py
import os
import yt_dlp
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
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
    
    # Simpan URL ke dalam memori sementara pengguna
    context.user_data['last_dl_url'] = url
    
    # Buat tombol pilihan
    keyboard = [
        [
            InlineKeyboardButton("Unduh Video / MP4", callback_data="dl_video"),
            InlineKeyboardButton("Unduh Audio / MP3", callback_data="dl_audio")
        ],
        [InlineKeyboardButton("Batal", callback_data="dl_cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    if is_ayah:
        msg = r"Ayah mau download sebagai apa nih? \(°^°)/"
    else:
        msg = "Pilih format unduhannya yah~"
        
    await update.message.reply_text(msg, reply_markup=reply_markup)

async def downloader_button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer() # Menghentikan loading ikon jam pasir di tombol
    
    user = update.effective_user
    is_ayah = Config.AYAH_USERNAME and user.username == Config.AYAH_USERNAME
    
    data = query.data
    url = context.user_data.get('last_dl_url')
    
    # Jika tombol batal ditekan
    if data == "dl_cancel":
        if is_ayah:
            await query.edit_message_text("Oke Yah, unduhan dibatalkan yaw! :3")
        else:
            await query.edit_message_text("K... Udah batal nih")
        return
        
    if not url:
        await query.edit_message_text("Uhh... Anne udah lupa linknya (¬_¬') coba ketik ulang")
        return

    if is_ayah:
        await query.edit_message_text("Sabar Ayah, Anne lagi ngambil medianya... (｡•̀ᴗ•́)✧")
    else:
        await query.edit_message_text("Tunggu bentar nih, lagi di-download...")
    
    is_audio = (data == "dl_audio")
    
    if is_audio:
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': 'downloads/%(id)s.%(ext)s',
            'quiet': True,
            'noplaylist': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
    else:
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
        
        # Jika Audio, yt-dlp + ffmpeg akan mengubah ekstensinya menjadi .mp3
        if is_audio:
            base_name = os.path.splitext(file_path)[0]
            mp3_path = f"{base_name}.mp3"
            if os.path.exists(mp3_path):
                file_path = mp3_path
        
        with open(file_path, 'rb') as media_file:
            if is_audio:
                sent_msg = await query.message.reply_audio(audio=media_file)
            else:
                sent_msg = await query.message.reply_video(video=media_file)
            
        # Hapus file setelah 5 menit
        schedule_deletion(context, sent_msg.chat_id, sent_msg.message_id)
        
        await query.message.delete() # Hapus pesan loading
        if os.path.exists(file_path):
            os.remove(file_path) # Bersihkan file lokal

    except Exception as e:
        if is_ayah:
            error_msg = f"M-maaf Ayah, Anne agak bingung (╥﹏╥)... Error teknis pas download: `{str(e)[:100]}`"
        else:
            error_msg = "Maaf nih yek, linknya susah di-download atau file-nya kegedean (maks 50MB)... Coba link lain yah!"
        await query.edit_message_text(error_msg, parse_mode="Markdown")
