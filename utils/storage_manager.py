# anexpert/utils/storage_manager.py
import json
import os
import time
from telegram.ext import ContextTypes

DATA_FILE = "pending_deletions.json"

def schedule_deletion(context: ContextTypes.DEFAULT_TYPE, chat_id: int, message_id: int):
    # Eksekusi langsung ke JobQueue (Berjalan selama bot aktif)
    context.job_queue.run_once(
        delete_single_message, 
        when=300, 
        data={'chat_id': chat_id, 'message_id': message_id}
    )
    
    # Simpan jejak ke JSON untuk mengantisipasi bot restart/mati
    data = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                data = json.load(f)
        except Exception:
            pass
    
    data.append({
        'chat_id': chat_id,
        'message_id': message_id,
        'delete_at': time.time() + 300
    })
    
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

async def delete_single_message(context: ContextTypes.DEFAULT_TYPE):
    job = context.job
    chat_id = job.data['chat_id']
    message_id = job.data['message_id']
    
    try:
        await context.bot.delete_message(chat_id=chat_id, message_id=message_id)
    except Exception:
        pass 
        
    # Hapus jejak dari JSON jika sudah berhasil terhapus
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                data = json.load(f)
            data = [d for d in data if not (d['chat_id'] == chat_id and d['message_id'] == message_id)]
            with open(DATA_FILE, 'w') as f:
                json.dump(data, f)
        except Exception:
            pass

async def process_pending_deletions(application):
    """Fungsi ini akan dipanggil seketika saat bot dinyalakan (post_init)"""
    if not os.path.exists(DATA_FILE):
        return
        
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
    except Exception:
        return
        
    now = time.time()
    kept_data = []
    
    for item in data:
        if item['delete_at'] <= now:
            # Jika batas waktunya sudah lewat saat bot dalam kondisi mati, langsung basmi
            try:
                await application.bot.delete_message(chat_id=item['chat_id'], message_id=item['message_id'])
            except Exception:
                pass
        else:
            # Jika belum saatnya, pasang kembali ke dalam JobQueue
            kept_data.append(item)
            delay = item['delete_at'] - now
            application.job_queue.run_once(
                delete_single_message, 
                when=delay, 
                data={'chat_id': item['chat_id'], 'message_id': item['message_id']}
            )
            
    with open(DATA_FILE, 'w') as f:
        json.dump(kept_data, f)
