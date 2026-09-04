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

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/network"
)

const NoProcessSignal = -1

func GetPidByGuiProcessRunning(machineId string) int {
	appExistFilePath := network.GetAppExistFilePath(machineId)
	if _, err := os.Stat(appExistFilePath); err != nil {
		return NoProcessSignal
	}

	kwMachineId := machineId
	kwGuigui := "guigui"
	kwGuiMode := "--gui-mode"

	if runtime.GOOS == "darwin" {
		return getPidMacFast(kwMachineId, kwGuigui, kwGuiMode)
	} else {
		return getPidLinuxFast(kwMachineId, kwGuigui, kwGuiMode)
	}
}

// macOS用: `ps` を1回だけ実行してメモリ上で一括判定（確実＆高速）
func getPidMacFast(kw1, kw2, kw3 string) int {
	// 全プロセスの PID と COMMMAND を一括取得（実行は1回のみ）
	cmd := exec.Command("ps", "-eo", "pid,command")
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

			// 先頭の PID 部分を取り出す
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

// Linux用: /proc 直読み（外部プロセス起動ゼロで最速）
func getPidLinuxFast(kw1, kw2, kw3 string) int {
	b1, b2, b3 := []byte(kw1), []byte(kw2), []byte(kw3)

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
		if err != nil {
			continue
		}

		if bytes.Contains(cmdlineBytes, b1) &&
			bytes.Contains(cmdlineBytes, b2) &&
			bytes.Contains(cmdlineBytes, b3) {
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
	// 2. プロセスを強制終了（内部で SIGKILL または WindowsのTerminateProcess を実行）
	err = proc.Kill()
	if err != nil {
		log.Printf("failure to kill: PID %d, err: %v\n", pid, err)
		return
	}
}
