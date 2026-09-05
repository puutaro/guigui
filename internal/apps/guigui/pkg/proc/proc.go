package proc

import (
	"bytes"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

const NoProcessSignal = -1

func GetPidByGuiProcessRunning(machineId string) int {
	kwMachineId := machineId
	kwGuigui := "guigui"
	kwGuiMode := "--gui-mode"

	if runtime.GOOS == "darwin" {
		return getPidMacFast(kwMachineId, kwGuigui, kwGuiMode)
	} else {
		return getPidLinuxFast(kwMachineId, kwGuigui, kwGuiMode)
	}
}

// macOS用: `-ww` オプションを追加してコマンドライン文字列の切り捨てを防止
func getPidMacFast(kw1, kw2, kw3 string) int {
	// -ww を付けることで、長いコマンドラインが途中でトリミングされるのを防ぐ
	cmd := exec.Command("ps", "-ww", "-eo", "pid,command")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return NoProcessSignal
	}

	lines := strings.Split(out.String(), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 3つのキーワードがすべて含まれているか判定
		if strings.Contains(line, kw1) &&
			strings.Contains(line, kw2) &&
			strings.Contains(line, kw3) {

			fields := strings.Fields(line)
			if len(fields) > 0 {
				if pid, err := strconv.Atoi(fields[0]); err == nil {
					return pid
				}
			}
		}
	}

	return NoProcessSignal
}

// Linux用: ヌル文字 (\x00) をスペースに置換してから判定
func getPidLinuxFast(kw1, kw2, kw3 string) int {
	procDir, err := os.Open("/proc")
	if err != nil {
		return NoProcessSignal
	}
	defer procDir.Close()

	entries, err := procDir.Readdirnames(-1)
	if err != nil {
		return NoProcessSignal
	}

	for _, entry := range entries {
		pid, err := strconv.Atoi(entry)
		if err != nil {
			continue
		}

		cmdlineBytes, err := os.ReadFile(filepath.Join("/proc", entry, "cmdline"))
		if err != nil || len(cmdlineBytes) == 0 {
			continue
		}

		// 🌟 重要: \x00 (ヌル文字) をスペースに置換して1つの文字列にする
		fullCmdline := string(bytes.ReplaceAll(cmdlineBytes, []byte{0}, []byte(" ")))

		// 文字列として3つのキーワードが含まれるか検索
		if strings.Contains(fullCmdline, kw1) &&
			strings.Contains(fullCmdline, kw2) &&
			strings.Contains(fullCmdline, kw3) {
			return pid
		}
	}

	return NoProcessSignal
}

func Kill(pid int) {
	if pid == NoProcessSignal {
		return
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		log.Printf("PID: %d not found: %v\n", pid, err)
		return
	}
	err = proc.Kill()
	if err != nil {
		log.Printf("failure to kill: PID %d, err: %v\n", pid, err)
		return
	}
}
