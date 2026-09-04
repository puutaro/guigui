package proc

import (
	"bytes"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/network"
)

const NoProcessSignal = -1

func GetPidByGuiProcessRunning(machineId string) int {
	appExistFilePath := network.GetAppExistFilePath(machineId)
	_, err := os.Stat(appExistFilePath)
	if err != nil {
		return NoProcessSignal
	}
	// 検索するキーワードのリスト（guigui, --gui-mode, machineId）
	keywords := []string{machineId, "guigui", "--gui-mode"}
	// 最初のキーワード("guigui")で候補を絞り込み
	cmd := exec.Command("pgrep", "-f", keywords[0])
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return NoProcessSignal
	}
	output := strings.TrimSpace(out.String())
	if output == "" {
		return NoProcessSignal
	}
	// 候補のPIDを順に走査し、すべてのキーワードが含まれているか検証
	for _, line := range strings.Split(output, "\n") {
		pidStr := strings.TrimSpace(line)
		if pidStr == "" {
			continue
		}
		pid, err := strconv.Atoi(pidStr)
		if err != nil {
			continue
		}
		cmdLine, err := getProcessCommandLine(pid)
		if err != nil {
			continue
		}
		matchAll := true
		for _, kw := range keywords {
			if !strings.Contains(cmdLine, kw) {
				matchAll = false
				break
			}
		}

		if matchAll {
			return pid
		}
	}

	return NoProcessSignal
}

// getProcessCommandLine は macOS / Linux 共通でPIDから実行コマンドラインを取得する
func getProcessCommandLine(pid int) (string, error) {
	cmd := exec.Command("ps", "-p", strconv.Itoa(pid), "-o", "command=")
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return "", err
	}
	return out.String(), nil
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
