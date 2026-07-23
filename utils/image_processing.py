# anexpert/utils/image_processing.py
import io
import textwrap
from PIL import Image, ImageDraw, ImageFont

def generate_brat_sticker(text: str) -> io.BytesIO:
    width, height = 512, 512
    bg_color = (255, 255, 255)
    text_color = (0, 0, 0)
    
    # Margin paten agar teks selalu condong ke kiri sesuai gambar referensi
    padding_x = 45 
    padding_y = 35
    max_box_w = width - (padding_x * 2)
    max_box_h = height - (padding_y * 2)
    
    text = text.lower().strip()
    
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # --- ALGORITMA PENCARIAN FONT & BUNGKUS (AUTO-SCALE & AUTO-WRAP) ---
    font_size = 250 
    best_lines = [text]
    best_font = None
    best_max_w = 0
    best_total_h = 0
    best_line_height = 0

    while font_size > 10:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except IOError:
            try:
                font = ImageFont.truetype("DejaVuSans.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()
                break

        valid_wraps = []
        
        # Uji semua kemungkinan panjang baris
        for w in range(1, len(text) + 2):
            wrapped = textwrap.fill(text, width=w, break_long_words=False)
            lines = wrapped.split('\n')
            
            max_line_w = 0
            for line in lines:
                bbox = draw.textbbox((0, 0), line, font=font)
                max_line_w = max(max_line_w, bbox[2] - bbox[0])
                
            bbox_h = draw.textbbox((0, 0), "Ay", font=font)
            line_spacing = font_size // 10
            line_height = (bbox_h[3] - bbox_h[1]) + line_spacing
            total_h = len(lines) * line_height
            
            # Jika muat di dalam batas kanvas yang baru
            if max_line_w <= max_box_w and total_h <= max_box_h:
                valid_wraps.append({
                    'lines': lines,
                    'max_w': max_line_w,
                    'total_h': total_h,
                    'line_height': line_height,
                    'area': max_line_w * total_h 
                })
        
        if valid_wraps:
            valid_wraps.sort(key=lambda x: x['area'], reverse=True)
            best_choice = valid_wraps[0]
            best_lines = best_choice['lines']
            best_font = font
            best_max_w = best_choice['max_w']
            best_total_h = best_choice['total_h']
            best_line_height = best_choice['line_height']
            break 
            
        font_size -= 2

    # Fallback aman
    if best_font is None:
        best_font = font
        bbox_h = draw.textbbox((0, 0), "Ay", font=best_font)
        best_line_height = (bbox_h[3] - bbox_h[1]) + 2
        best_total_h = best_line_height
        best_max_w = max_box_w

    # --- KALKULASI POSISI KIRI TETAP & TENGAH VERTIKAL ---
    x_start = padding_x # Kunci posisi X di margin kiri
    y_start = (height - best_total_h) // 2
    current_y = y_start
    
    # --- LOGIKA JUSTIFY (RATA KIRI-KANAN) ---
    for i, line in enumerate(best_lines):
        words = line.split()
        if len(words) <= 1 or i == len(best_lines) - 1:
            draw.text((x_start, current_y), line, fill=text_color, font=best_font)
        else:
            words_width = 0
            for w in words:
                bbox_w = draw.textbbox((0, 0), w, font=best_font)
                words_width += (bbox_w[2] - bbox_w[0])
                
            total_space_to_fill = best_max_w - words_width
            space_width = total_space_to_fill / (len(words) - 1)
            
            current_x = x_start
            for word in words:
                draw.text((current_x, current_y), word, fill=text_color, font=best_font)
                bbox_word = draw.textbbox((0, 0), word, font=best_font)
                current_x += (bbox_word[2] - bbox_word[0]) + space_width
                
        current_y += best_line_height

    # --- EFEK BIT-BIT (MOLDY) ---
    img = img.resize((128, 128), resample=Image.BILINEAR)
    img = img.resize((512, 512), resample=Image.NEAREST)

    bio = io.BytesIO()
    bio.name = 'sticker.webp'
    img.save(bio, 'WEBP', quality=40) 
    bio.seek(0)

    return bio

def convert_image_to_sticker(image_bytes: bytes) -> io.BytesIO:
    bio_in = io.BytesIO(image_bytes)
    img = Image.open(bio_in)
    
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    img.thumbnail((512, 512))
    
    bio_out = io.BytesIO()
    bio_out.name = 'sticker.webp'
    img.save(bio_out, 'WEBP')
    bio_out.seek(0)
    
    return bio_out
