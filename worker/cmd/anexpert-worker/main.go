package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/gif"
	"image/jpeg"
	"image/png"
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	stickerSize = 512
	lowSize     = 128
	paddingX    = 45
	paddingY    = 35
)

type request struct {
	Command string          `json:"command"`
	Payload json.RawMessage `json:"payload"`
}

type response struct {
	OK    bool         `json:"ok"`
	Data  any          `json:"data,omitempty"`
	Error string       `json:"error,omitempty"`
	Meta  responseMeta `json:"meta"`
}

type responseMeta struct {
	DurationMS int64  `json:"duration_ms"`
	OutputType string `json:"output_type,omitempty"`
}

type stickerTextPayload struct {
	Text string `json:"text"`
}

type stickerImagePayload struct {
	InputPath string `json:"inputPath"`
}

func init() {
	image.RegisterFormat("jpeg", "\xff\xd8", jpeg.Decode, jpeg.DecodeConfig)
	image.RegisterFormat("gif", "GIF8?a", gif.Decode, gif.DecodeConfig)
}

func main() {
	jsonInput := flag.String("json", "", "structured JSON request from Node.js gateway")
	flag.Parse()

	started := time.Now()
	resp, err := handle(*jsonInput)
	if err != nil {
		resp = response{OK: false, Error: err.Error()}
	}
	resp.Meta.DurationMS = time.Since(started).Milliseconds()
	if resp.Meta.OutputType == "" && resp.OK {
		resp.Meta.OutputType = "image/png"
	}

	encoder := json.NewEncoder(os.Stdout)
	if err := encoder.Encode(resp); err != nil {
		fmt.Fprintf(os.Stderr, "encode response: %v\n", err)
		os.Exit(1)
	}
}

func handle(input string) (response, error) {
	if strings.TrimSpace(input) == "" {
		return response{}, errors.New("request kosong")
	}

	var req request
	if err := json.Unmarshal([]byte(input), &req); err != nil {
		return response{}, fmt.Errorf("request JSON tidak valid: %w", err)
	}

	switch req.Command {
	case "sticker.text":
		return handleStickerText(req.Payload)
	case "sticker.image":
		return handleStickerImage(req.Payload)
	default:
		return response{}, fmt.Errorf("command tidak dikenal: %s", req.Command)
	}
}

func handleStickerText(raw json.RawMessage) (response, error) {
	var payload stickerTextPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return response{}, fmt.Errorf("payload sticker.text tidak valid: %w", err)
	}

	text := strings.TrimSpace(strings.ToLower(payload.Text))
	if text == "" {
		return response{}, errors.New("teks sticker kosong")
	}
	if len([]rune(text)) > 240 {
		return response{}, errors.New("teks sticker terlalu panjang")
	}

	img := renderBratSticker(text)
	filePath, err := writePNG(img)
	if err != nil {
		return response{}, err
	}

	return response{OK: true, Data: map[string]string{"filePath": filePath}}, nil
}

func handleStickerImage(raw json.RawMessage) (response, error) {
	var payload stickerImagePayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return response{}, fmt.Errorf("payload sticker.image tidak valid: %w", err)
	}
	if strings.TrimSpace(payload.InputPath) == "" {
		return response{}, errors.New("inputPath gambar kosong")
	}

	file, err := os.Open(payload.InputPath)
	if err != nil {
		return response{}, fmt.Errorf("gagal membuka gambar input: %w", err)
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return response{}, fmt.Errorf("format gambar tidak didukung: %w", err)
	}

	sticker := fitImageToSticker(img)
	filePath, err := writePNG(sticker)
	if err != nil {
		return response{}, err
	}

	return response{OK: true, Data: map[string]string{"filePath": filePath}}, nil
}

func renderBratSticker(text string) image.Image {
	low := image.NewRGBA(image.Rect(0, 0, lowSize, lowSize))
	draw.Draw(low, low.Bounds(), &image.Uniform{C: color.White}, image.Point{}, draw.Src)

	padX := paddingX * lowSize / stickerSize
	padY := paddingY * lowSize / stickerSize
	maxW := lowSize - (padX * 2)
	maxH := lowSize - (padY * 2)

	lines, maxLineW := chooseTextWrap(text, maxW, maxH)
	lineHeight := 8
	totalH := len(lines) * lineHeight
	y := (lowSize - totalH) / 2

	for i, line := range lines {
		if shouldJustify(line, i, len(lines)) {
			drawJustified(low, line, padX, y, maxLineW)
		} else {
			drawString(low, line, padX, y)
		}
		y += lineHeight
	}

	return scaleNearest(low, stickerSize, stickerSize)
}

func chooseTextWrap(text string, maxW int, maxH int) ([]string, int) {
	words := strings.Fields(text)
	if len(words) == 0 {
		return []string{text}, measureText(text)
	}

	lineHeight := 8
	bestLines := []string{text}
	bestWidth := measureText(text)
	bestArea := -1

	for targetChars := 1; targetChars <= len([]rune(text))+1; targetChars++ {
		lines := wrapByApproxChars(words, targetChars)
		if len(lines)*lineHeight > maxH {
			continue
		}

		maxLineW := 0
		for _, line := range lines {
			maxLineW = max(maxLineW, measureText(line))
		}
		if maxLineW > maxW {
			continue
		}

		area := maxLineW * len(lines) * lineHeight
		if area > bestArea {
			bestArea = area
			bestLines = lines
			bestWidth = maxLineW
		}
	}

	return bestLines, min(bestWidth, maxW)
}

func wrapByApproxChars(words []string, target int) []string {
	var lines []string
	var current string
	for _, word := range words {
		candidate := word
		if current != "" {
			candidate = current + " " + word
		}
		if len([]rune(candidate)) > target && current != "" {
			lines = append(lines, current)
			current = word
		} else {
			current = candidate
		}
	}
	if current != "" {
		lines = append(lines, current)
	}
	return lines
}

func shouldJustify(line string, index int, total int) bool {
	return index < total-1 && len(strings.Fields(line)) > 1
}

func drawJustified(img draw.Image, line string, x int, y int, maxW int) {
	words := strings.Fields(line)
	wordsWidth := 0
	for _, word := range words {
		wordsWidth += measureText(word)
	}
	spaces := len(words) - 1
	if spaces <= 0 {
		drawString(img, line, x, y)
		return
	}

	extra := float64(maxW-wordsWidth) / float64(spaces)
	cursor := float64(x)
	for _, word := range words {
		drawString(img, word, int(math.Round(cursor)), y)
		cursor += float64(measureText(word)) + extra
	}
}

func drawString(img draw.Image, text string, x int, y int) {
	cursor := x
	for _, r := range text {
		if r == ' ' {
			cursor += 4
			continue
		}
		drawGlyph(img, r, cursor, y)
		cursor += 6
	}
}

func drawGlyph(img draw.Image, r rune, x int, y int) {
	pattern, ok := glyphs[r]
	if !ok {
		pattern = glyphs['?']
	}
	for row, bits := range pattern {
		for col, bit := range bits {
			if bit == '1' {
				img.Set(x+col, y+row, color.Black)
			}
		}
	}
}

func measureText(text string) int {
	width := 0
	for _, r := range text {
		if r == ' ' {
			width += 4
		} else {
			width += 6
		}
	}
	return width
}

var glyphs = map[rune][]string{
	'a': {"01110", "10001", "10001", "11111", "10001", "10001", "10001"},
	'b': {"11110", "10001", "10001", "11110", "10001", "10001", "11110"},
	'c': {"01111", "10000", "10000", "10000", "10000", "10000", "01111"},
	'd': {"11110", "10001", "10001", "10001", "10001", "10001", "11110"},
	'e': {"11111", "10000", "10000", "11110", "10000", "10000", "11111"},
	'f': {"11111", "10000", "10000", "11110", "10000", "10000", "10000"},
	'g': {"01111", "10000", "10000", "10011", "10001", "10001", "01110"},
	'h': {"10001", "10001", "10001", "11111", "10001", "10001", "10001"},
	'i': {"11111", "00100", "00100", "00100", "00100", "00100", "11111"},
	'j': {"00111", "00010", "00010", "00010", "00010", "10010", "01100"},
	'k': {"10001", "10010", "10100", "11000", "10100", "10010", "10001"},
	'l': {"10000", "10000", "10000", "10000", "10000", "10000", "11111"},
	'm': {"10001", "11011", "10101", "10101", "10001", "10001", "10001"},
	'n': {"10001", "11001", "10101", "10011", "10001", "10001", "10001"},
	'o': {"01110", "10001", "10001", "10001", "10001", "10001", "01110"},
	'p': {"11110", "10001", "10001", "11110", "10000", "10000", "10000"},
	'q': {"01110", "10001", "10001", "10001", "10101", "10010", "01101"},
	'r': {"11110", "10001", "10001", "11110", "10100", "10010", "10001"},
	's': {"01111", "10000", "10000", "01110", "00001", "00001", "11110"},
	't': {"11111", "00100", "00100", "00100", "00100", "00100", "00100"},
	'u': {"10001", "10001", "10001", "10001", "10001", "10001", "01110"},
	'v': {"10001", "10001", "10001", "10001", "10001", "01010", "00100"},
	'w': {"10001", "10001", "10001", "10101", "10101", "10101", "01010"},
	'x': {"10001", "10001", "01010", "00100", "01010", "10001", "10001"},
	'y': {"10001", "10001", "01010", "00100", "00100", "00100", "00100"},
	'z': {"11111", "00001", "00010", "00100", "01000", "10000", "11111"},
	'0': {"01110", "10001", "10011", "10101", "11001", "10001", "01110"},
	'1': {"00100", "01100", "00100", "00100", "00100", "00100", "01110"},
	'2': {"01110", "10001", "00001", "00010", "00100", "01000", "11111"},
	'3': {"11110", "00001", "00001", "01110", "00001", "00001", "11110"},
	'4': {"10010", "10010", "10010", "11111", "00010", "00010", "00010"},
	'5': {"11111", "10000", "10000", "11110", "00001", "00001", "11110"},
	'6': {"01110", "10000", "10000", "11110", "10001", "10001", "01110"},
	'7': {"11111", "00001", "00010", "00100", "01000", "01000", "01000"},
	'8': {"01110", "10001", "10001", "01110", "10001", "10001", "01110"},
	'9': {"01110", "10001", "10001", "01111", "00001", "00001", "01110"},
	'.': {"00000", "00000", "00000", "00000", "00000", "01100", "01100"},
	',': {"00000", "00000", "00000", "00000", "01100", "00100", "01000"},
	'!': {"00100", "00100", "00100", "00100", "00100", "00000", "00100"},
	'?': {"01110", "10001", "00001", "00010", "00100", "00000", "00100"},
	'-': {"00000", "00000", "00000", "11111", "00000", "00000", "00000"},
	'_': {"00000", "00000", "00000", "00000", "00000", "00000", "11111"},
	':': {"00000", "01100", "01100", "00000", "01100", "01100", "00000"},
	'(': {"00010", "00100", "01000", "01000", "01000", "00100", "00010"},
	')': {"01000", "00100", "00010", "00010", "00010", "00100", "01000"},
}

func fitImageToSticker(src image.Image) image.Image {
	bounds := src.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	if width <= 0 || height <= 0 {
		canvas := image.NewRGBA(image.Rect(0, 0, stickerSize, stickerSize))
		draw.Draw(canvas, canvas.Bounds(), &image.Uniform{C: color.White}, image.Point{}, draw.Src)
		return canvas
	}

	scale := math.Min(float64(stickerSize)/float64(width), float64(stickerSize)/float64(height))
	targetW := max(1, int(math.Round(float64(width)*scale)))
	targetH := max(1, int(math.Round(float64(height)*scale)))
	resized := scaleNearest(src, targetW, targetH)

	canvas := image.NewRGBA(image.Rect(0, 0, stickerSize, stickerSize))
	draw.Draw(canvas, canvas.Bounds(), &image.Uniform{C: color.White}, image.Point{}, draw.Src)
	offset := image.Pt((stickerSize-targetW)/2, (stickerSize-targetH)/2)
	draw.Draw(canvas, image.Rect(offset.X, offset.Y, offset.X+targetW, offset.Y+targetH), resized, image.Point{}, draw.Src)
	return canvas
}

func scaleNearest(src image.Image, targetW int, targetH int) *image.RGBA {
	dst := image.NewRGBA(image.Rect(0, 0, targetW, targetH))
	bounds := src.Bounds()
	for y := 0; y < targetH; y++ {
		sy := bounds.Min.Y + y*bounds.Dy()/targetH
		for x := 0; x < targetW; x++ {
			sx := bounds.Min.X + x*bounds.Dx()/targetW
			dst.Set(x, y, src.At(sx, sy))
		}
	}
	return dst
}

func writePNG(img image.Image) (string, error) {
	filePath := filepath.Join(os.TempDir(), fmt.Sprintf("anexpert-sticker-%d.png", time.Now().UnixNano()))
	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
	if err != nil {
		return "", fmt.Errorf("gagal membuat file sticker: %w", err)
	}
	defer file.Close()

	if err := png.Encode(file, img); err != nil {
		return "", fmt.Errorf("gagal encode sticker PNG: %w", err)
	}
	return filePath, nil
}
