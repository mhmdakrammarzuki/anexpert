// anexpert-hybrid/go-processor/internal/sticker/generate.go
package sticker

import (
	"fmt"
	"image"
	"image/color"
	"os"
	"sort"
	"strings"

	"github.com/fogleman/gg"
	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/goregular"
	"golang.org/x/image/font/opentype"
)

const (
	canvasSize = 512
	paddingX   = 45
	paddingY   = 35
)

type wrapResult struct {
	lines      []string
	maxWidth   float64
	totalH     float64
	lineHeight float64
	score      float64
}

func loadFont(size float64) (font.Face, error) {
	paths := []string{
		"arial.ttf",
		"/usr/share/fonts/truetype/msttcorefonts/Arial.ttf",
		"DejaVuSans.ttf",
		"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
	}
	for _, p := range paths {
		b, err := os.ReadFile(p)
		if err == nil {
			if f, err := opentype.Parse(b); err == nil {
				if face, err := opentype.NewFace(f, &opentype.FaceOptions{Size: size, DPI: 72}); err == nil {
					return face, nil
				}
			}
		}
	}
	
	f, err := opentype.Parse(goregular.TTF)
	if err != nil {
		return nil, fmt.Errorf("gagal parse font default: %w", err)
	}
	face, err := opentype.NewFace(f, &opentype.FaceOptions{Size: size, DPI: 72})
	if err != nil {
		return nil, fmt.Errorf("gagal buat font face default: %w", err)
	}
	return face, nil
}

func measureLine(dc *gg.Context, line string) float64 {
	w, _ := dc.MeasureString(line)
	return w
}

func findBestFit(dc *gg.Context, text string, maxBoxW, maxBoxH float64) ([]string, font.Face, float64, float64, float64, error) {
	fontSize := 250.0
	words := strings.Fields(text)
	if len(words) == 0 {
		words = []string{" "}
	}

	var bestLines []string
	var bestFace font.Face
	var bestMaxW, bestTotalH, bestLineHeight float64

	for fontSize > 10 {
		face, err := loadFont(fontSize)
		if err != nil {
			return nil, nil, 0, 0, 0, err
		}
		dc.SetFontFace(face)

		var validWraps []wrapResult
		var testWidths []float64

		for i := 0; i < len(words); i++ {
			var seg string
			for j := i; j < len(words); j++ {
				if seg == "" {
					seg = words[j]
				} else {
					seg += " " + words[j]
				}
				segW := measureLine(dc, seg)
				if segW <= maxBoxW {
					testWidths = append(testWidths, segW)
				}
			}
		}
		testWidths = append(testWidths, maxBoxW)

		for _, tw := range testWidths {
			var lines []string
			var currentLine string
			for _, word := range words {
				if currentLine == "" {
					currentLine = word
				} else {
					testLine := currentLine + " " + word
					lineW := measureLine(dc, testLine)
					if lineW <= tw {
						currentLine = testLine
					} else {
						lines = append(lines, currentLine)
						currentLine = word
					}
				}
			}
			if currentLine != "" {
				lines = append(lines, currentLine)
			}

			maxLineW := 0.0
			for _, line := range lines {
				lw := measureLine(dc, line)
				if lw > maxLineW {
					maxLineW = lw
				}
			}

			ascent, descent := face.Metrics().Ascent, face.Metrics().Descent
			lineHeight := float64((ascent + descent).Ceil()) + fontSize/10.0
			totalH := float64(len(lines)) * lineHeight

			if maxLineW <= maxBoxW && totalH <= maxBoxH {
				area := maxLineW * totalH
				validWraps = append(validWraps, wrapResult{
					lines:      lines,
					maxWidth:   maxLineW,
					totalH:     totalH,
					lineHeight: lineHeight,
					score:      area,
				})
			}
		}

		if len(validWraps) > 0 {
			sort.Slice(validWraps, func(i, j int) bool {
				return validWraps[i].score > validWraps[j].score
			})
			best := validWraps[0]
			bestLines = best.lines
			bestFace = face
			bestMaxW = best.maxWidth
			bestTotalH = best.totalH
			bestLineHeight = best.lineHeight
			break
		}

		fontSize -= 2
	}

	if bestFace == nil {
		face, _ := loadFont(10)
		bestFace = face
		bestLines = []string{text}
		bestLineHeight = 12
		bestTotalH = 12
		bestMaxW = maxBoxW
	}

	return bestLines, bestFace, bestMaxW, bestTotalH, bestLineHeight, nil
}

func GenerateBratSticker(text string, outputPath string) error {
	text = strings.ToLower(strings.TrimSpace(text))
	if text == "" {
		text = " "
	}

	maxBoxW := float64(canvasSize - paddingX*2)
	maxBoxH := float64(canvasSize - paddingY*2)

	dc := gg.NewContext(canvasSize, canvasSize)
	dc.SetColor(color.White)
	dc.Clear()
	dc.SetColor(color.Black)

	lines, face, maxLineW, totalH, lineHeight, err := findBestFit(dc, text, maxBoxW, maxBoxH)
	if err != nil {
		return err
	}
	dc.SetFontFace(face)

	xStart := float64(paddingX)
	yStart := (float64(canvasSize) - totalH) / 2
	currentY := yStart

	ascent := float64(face.Metrics().Ascent.Ceil())

	// --- LOGIKA RATA KIRI-KANAN (JUSTIFY) DIKEMBALIKAN MUTLAK ---
	for i, line := range lines {
		words := strings.Fields(line)
		isLastLine := i == len(lines)-1

		if len(words) <= 1 || isLastLine {
			dc.DrawString(line, xStart, currentY+ascent)
		} else {
			var wordsWidth float64
			for _, w := range words {
				wordsWidth += measureLine(dc, w)
			}
			totalSpaceToFill := maxLineW - wordsWidth
			spaceWidth := totalSpaceToFill / float64(len(words)-1)

			currentX := xStart
			for _, w := range words {
				dc.DrawString(w, currentX, currentY+ascent)
				currentX += measureLine(dc, w) + spaceWidth
			}
		}
		currentY += lineHeight
	}

	// --- EFEK BLUR HALUS (SOFT AESTHETICS) TETAP DIPERTAHANKAN ---
	// Menggunakan interpolasi BiLinear (smoothResize) ke bawah dan ke atas
	// untuk menciptakan efek blur yang estetik tanpa memecah piksel.
	small := smoothResize(dc.Image(), 200, 200)
	final := smoothResize(small, canvasSize, canvasSize)

	if err := saveAsWebP(final, outputPath); err != nil {
		return err
	}
	return nil
}

var _ = image.Rect

func writeTempPNG(img image.Image) (string, error) {
	f, err := os.CreateTemp("", "brat-*.png")
	if err != nil {
		return "", err
	}
	defer f.Close()
	if err := savePNG(f.Name(), img); err != nil {
		return "", err
	}
	return f.Name(), nil
}
