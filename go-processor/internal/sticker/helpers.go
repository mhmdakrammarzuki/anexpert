// anexpert-hybrid/go-processor/internal/sticker/helpers.go
package sticker

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"os"

	"github.com/HugoSmits86/nativewebp"
	xdraw "golang.org/x/image/draw"
)

// smoothResize menggunakan algoritma BiLinear asli untuk meniru efek interpolasi
// Image.BILINEAR di Pillow secara presisi, bukan sekadar point-sampling.
func smoothResize(src image.Image, w, h int) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, w, h))
	xdraw.ApproxBiLinear.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Over, nil)
	return dst
}

// nearestResize meniru Image.NEAREST di Pillow (upscale tanpa smoothing).
func nearestResize(src image.Image, w, h int) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, w, h))
	xdraw.NearestNeighbor.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Over, nil)
	return dst
}

// applyMoldyArtifacts menyimulasikan kompresi lossy WEBP quality=40 dari Python.
// Karena nativewebp di Go bersifat lossless, kita "memanggang" efek
// artefak (bercak/moldy) dengan kompresi JPEG kualitas rendah di memori
// sebelum mengubahnya menjadi WEBP.
func applyMoldyArtifacts(src image.Image) image.Image {
	var buf bytes.Buffer
	jpeg.Encode(&buf, src, &jpeg.Options{Quality: 40})
	artifactImg, _ := jpeg.Decode(&buf)
	return artifactImg
}

func saveAsWebP(img image.Image, outputPath string) error {
	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("gagal buat file output: %w", err)
	}
	defer f.Close()

	if err := nativewebp.Encode(f, img, &nativewebp.Options{UseExtendedFormat: true}); err != nil {
		return fmt.Errorf("gagal encode webp: %w", err)
	}
	return nil
}

func savePNG(path string, img image.Image) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return png.Encode(f, img)
}
