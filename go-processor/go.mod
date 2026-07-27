module anexpert/processor

go 1.22.2

require (
	github.com/HugoSmits86/nativewebp v1.2.1
	github.com/fogleman/gg v1.3.0
	github.com/shirou/gopsutil/v3 v3.24.5
	golang.org/x/image v0.24.0
)

require (
	github.com/go-ole/go-ole v1.2.6 // indirect
	github.com/golang/freetype v0.0.0-20170609003504-e2365dfdc4a0 // indirect
	github.com/lufia/plan9stats v0.0.0-20211012122336-39d0f177ccd0 // indirect
	github.com/power-devops/perfstat v0.0.0-20210106213030-5aafc221ea8c // indirect
	github.com/shoenig/go-m1cpu v0.1.6 // indirect
	github.com/tklauser/go-sysconf v0.3.12 // indirect
	github.com/tklauser/numcpus v0.6.1 // indirect
	github.com/yusufpapurcu/wmi v1.2.4 // indirect
	golang.org/x/sys v0.20.0 // indirect
	golang.org/x/text v0.16.0 // indirect
)

// Catatan: jalankan `go mod tidy` di komputer kamu sendiri (yang punya akses
// internet penuh) supaya versi dan checksum di go.sum otomatis terisi benar.
// nativewebp adalah encoder WEBP murni Go (tanpa cgo/tanpa libwebp), jadi
// binary bisa langsung di-cross-compile ke Android/Termux tanpa toolchain C.
//
// Baris "replace" di bawah ini OPSIONAL — hanya diperlukan kalau jaringan
// kamu memblokir domain golang.org (vanity import redirect). Kalau internet
// kamu normal/tanpa firewall khusus, baris ini boleh dihapus.
replace golang.org/x/image => github.com/golang/image v0.18.0

replace golang.org/x/sys => github.com/golang/sys v0.20.0

replace golang.org/x/text => github.com/golang/text v0.16.0

replace golang.org/x/xerrors => github.com/golang/xerrors v0.0.0-20191204190536-9bdfabe68543

replace gopkg.in/yaml.v3 => github.com/go-yaml/yaml v0.0.0-20220512140231-539c8e751b99
