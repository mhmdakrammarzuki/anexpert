// anexpert/go-processor/internal/sysinfo/sysinfo.go
//
// Pengganti native untuk pemanggilan shell "fastfetch" di handlers/debug.py
// versi lama (yang hanya jalan di Termux/Android). Versi ini pakai
// gopsutil, jadi portable ke Linux/Windows/macOS/Android mana pun tempat
// bot dijalankan, dan Go-lah yang cocok melakukan pembacaan resource
// low-level seperti ini (CPU-bound / system-bound), bukan Node.js.
package sysinfo

import (
	"fmt"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

// Info adalah struktur data yang dikirim balik ke Node.js sebagai JSON.
type Info struct {
	CPUModel    string  `json:"cpu_model"`
	CPUPercent  float64 `json:"cpu_percent"`
	CPUCores    int     `json:"cpu_cores"`
	MemTotalMB  uint64  `json:"mem_total_mb"`
	MemUsedMB   uint64  `json:"mem_used_mb"`
	MemPercent  float64 `json:"mem_percent"`
	DiskTotalGB float64 `json:"disk_total_gb"`
	DiskUsedGB  float64 `json:"disk_used_gb"`
	DiskPercent float64 `json:"disk_percent"`
}

// Collect mengumpulkan info CPU, RAM, dan Disk saat ini.
func Collect() (*Info, error) {
	info := &Info{}

	cpuInfo, err := cpu.Info()
	if err == nil && len(cpuInfo) > 0 {
		info.CPUModel = cpuInfo[0].ModelName
		info.CPUCores = len(cpuInfo)
	}

	percents, err := cpu.Percent(0, false)
	if err == nil && len(percents) > 0 {
		info.CPUPercent = percents[0]
	}

	vmem, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("gagal baca memory: %w", err)
	}
	info.MemTotalMB = vmem.Total / 1024 / 1024
	info.MemUsedMB = vmem.Used / 1024 / 1024
	info.MemPercent = vmem.UsedPercent

	diskInfo, err := disk.Usage("/")
	if err != nil {
		return nil, fmt.Errorf("gagal baca disk: %w", err)
	}
	info.DiskTotalGB = float64(diskInfo.Total) / 1024 / 1024 / 1024
	info.DiskUsedGB = float64(diskInfo.Used) / 1024 / 1024 / 1024
	info.DiskPercent = diskInfo.UsedPercent

	return info, nil
}
