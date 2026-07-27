// anexpert/go-processor/internal/sticker/convert.go
//
// Port dari utils/image_processing.py (fungsi convert_image_to_sticker).
// Ambil gambar apa saja (jpg/png/dst), resize supaya muat di kotak 512x512
// (mempertahankan rasio, seperti Image.thumbnail di Pillow), lalu simpan
// sebagai WEBP.
package sticker

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"os"
)

// ConvertImageToSticker membaca gambar dari inputPath, mengecilkannya agar
// muat dalam kotak 512x512 tanpa mengubah rasio (mirip Image.thumbnail),
// lalu menyimpannya sebagai WEBP di outputPath.
func ConvertImageToSticker(inputPath string, outputPath string) error {
	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("gagal buka gambar input: %w", err)
	}
	defer f.Close()

	src, _, err := image.Decode(f)
	if err != nil {
		return fmt.Errorf("gagal decode gambar: %w", err)
	}

	bounds := src.Bounds()
	srcW, srcH := bounds.Dx(), bounds.Dy()

	// Hitung ukuran baru dengan rasio tetap, maksimal 512x512 (thumbnail).
	targetW, targetH := srcW, srcH
	if srcW > canvasSize || srcH > canvasSize {
		ratio := float64(srcW) / float64(srcH)
		if ratio > 1 {
			targetW = canvasSize
			targetH = int(float64(canvasSize) / ratio)
		} else {
			targetH = canvasSize
			targetW = int(float64(canvasSize) * ratio)
		}
	}

	resized := smoothResize(src, targetW, targetH)

	if err := saveAsWebP(resized, outputPath); err != nil {
		return err
	}
	return nil
}
