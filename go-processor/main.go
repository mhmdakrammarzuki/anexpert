// anexpert/go-processor/main.go
//
// Ini adalah "mesin berat" yang dipanggil oleh Node.js lewat child_process.
// Node.js TIDAK PERNAH mengirim string bebas yang dieksekusi shell — semua
// parameter dilewatkan sebagai argumen array (os.Args), sesuai aturan
// keamanan IPC di config.md repo asli.
//
// Cara pakai (dipanggil dari Node.js, bukan manual oleh manusia):
//   processor brat "<teks>" "<path_output.webp>"
//   processor convert "<path_input>" "<path_output.webp>"
//   processor sysinfo
package main

import (
	"encoding/json"
	"fmt"
	"os"

	"anexpert/processor/internal/sticker"
	"anexpert/processor/internal/sysinfo"
)

func fail(err error) {
	// Semua error dikirim sebagai JSON ke stderr, supaya Node.js gampang
	// mem-parsing-nya (bukan teks bebas yang formatnya berubah-ubah).
	payload, _ := json.Marshal(map[string]string{
		"status": "error",
		"error":  err.Error(),
	})
	fmt.Fprintln(os.Stderr, string(payload))
	os.Exit(1)
}

func ok(data map[string]interface{}) {
	data["status"] = "ok"
	payload, _ := json.Marshal(data)
	fmt.Fprintln(os.Stdout, string(payload))
}

func main() {
	if len(os.Args) < 2 {
		fail(fmt.Errorf("subcommand wajib diisi: brat | convert | sysinfo"))
	}

	switch os.Args[1] {
	case "brat":
		// processor brat "<teks>" "<path_output.webp>"
		if len(os.Args) < 4 {
			fail(fmt.Errorf("usage: brat <text> <output_path>"))
		}
		text := os.Args[2]
		outputPath := os.Args[3]
		if err := sticker.GenerateBratSticker(text, outputPath); err != nil {
			fail(err)
		}
		ok(map[string]interface{}{"output_path": outputPath})

	case "convert":
		// processor convert "<path_input>" "<path_output.webp>"
		if len(os.Args) < 4 {
			fail(fmt.Errorf("usage: convert <input_path> <output_path>"))
		}
		inputPath := os.Args[2]
		outputPath := os.Args[3]
		if err := sticker.ConvertImageToSticker(inputPath, outputPath); err != nil {
			fail(err)
		}
		ok(map[string]interface{}{"output_path": outputPath})

	case "sysinfo":
		info, err := sysinfo.Collect()
		if err != nil {
			fail(err)
		}
		ok(map[string]interface{}{"data": info})

	default:
		fail(fmt.Errorf("subcommand tidak dikenal: %s", os.Args[1]))
	}
}
