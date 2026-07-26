package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
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
	DurationMS int64 `json:"duration_ms"`
}

type stickerTextPayload struct {
	Text string `json:"text"`
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

	filePath := filepath.Join(os.TempDir(), fmt.Sprintf("anexpert-sticker-%d.txt", time.Now().UnixNano()))
	if err := os.WriteFile(filePath, []byte(text), 0o600); err != nil {
		return response{}, fmt.Errorf("gagal menulis hasil worker: %w", err)
	}

	return response{OK: true, Data: map[string]string{"filePath": filePath}}, nil
}
