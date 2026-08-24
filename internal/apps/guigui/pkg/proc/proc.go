package proc

import (
	"log"
	"os"
	"strings"

	"github.com/shirou/gopsutil/process"
)

const NoProcessSignal = -1

func GetPidByGuiProcessRunning(machineId string) int {
	currentPid := int32(os.Getpid())
	// 1. OS上で動いているすべてのプロセスを取得
	processes, err := process.Processes()
	if err != nil {
		// プロセス一覧が取得できない場合は、安全側に倒して「起動していない」とみなす
		return NoProcessSignal
	}
	for _, p := range processes {
		// 自分自身のPIDはスキップ
		if p.Pid == currentPid {
			continue
		}
		// 2. プロセスの名前（実行ファイル名）を取得
		name, err := p.Name()
		if err != nil {
			continue // 権限のないシステムプロセスなどはスキップ
		}
		// Windowsの場合、名前が `guigui.exe` になるため、拡張子を除外して比較
		nameWithoutExe := strings.TrimSuffix(strings.ToLower(name), ".exe")
		if nameWithoutExe != "guigui" {
			continue // `guigui` 以外のプロセスはスキップ
		}
		// 3. プロセスのコマンドライン引数（[]string）を取得
		cmdArgs, err := p.CmdlineSlice()
		if err != nil {
			continue
		}
		// フラグのチェック用フラグ
		hasGuiMode := false
		hasTargetMachineId := false
		// 4. 引数の中に「--gui-mode」と指定された「machineId」が含まれているかチェック
		for i := 0; i < len(cmdArgs); i++ {
			arg := cmdArgs[i]
			if arg == "--gui-mode" {
				hasGuiMode = true
			}
			// --id=<machineId> の形、または --id <machineId> の形に対応
			switch {
			case arg == "--id" && i+1 < len(cmdArgs):
				if cmdArgs[i+1] != machineId {
					break
				}
				hasTargetMachineId = true
			case strings.HasPrefix(arg, "--id="):
				idVal := strings.TrimPrefix(arg, "--id=")
				if idVal != machineId {
					break
				}
				hasTargetMachineId = true
			}
		}
		// 「guigui」という名前で、かつ `--gui-mode` があり、指定した `machineId` を持つ別プロセスを発見！
		if hasGuiMode && hasTargetMachineId {
			return int(p.Pid)
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
