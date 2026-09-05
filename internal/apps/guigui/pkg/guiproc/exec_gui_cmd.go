package guiproc

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"os/exec"
	"syscall"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/network"
)

func ExecGuiCmd(cmdArgs []string, appConfig *args.AppConfig) (int, error) {
	noPid := network.NoPid
	selfPath, err := os.Executable()
	if err != nil {
		log.Printf("failure to self executable path: %v\n", err)
		return noPid, err
	}
	var srcArgs []string
	// 2. 🌟 重要なポイント:
	// 手動実行で成功した時のように、サブコマンド（list）の直後に --gui-mode を差し込みます。
	if len(cmdArgs) > 0 {
		srcArgs = append(srcArgs, cmdArgs[0])     // まず "list"（サブコマンド名）を最初に入れる
		srcArgs = append(srcArgs, "--gui-mode")   // 次に "--gui-mode" を確実にここに挟む
		srcArgs = append(srcArgs, cmdArgs[1:]...) // 残りのオプション（--titleなど）を全て後ろに続ける
	} else {
		// for build
		srcArgs = append([]string{"--gui-mode"}, cmdArgs...)
	}
	// // これにより、自動生成されるコマンドは手動成功時と完全に一致します：
	cmd := exec.Command(selfPath, srcArgs...)
	// パイプ（|）からの入力データを子プロセスへ確実に引き渡す
	if appConfig.ListCmd != nil && appConfig.ListCmd.IsStdin {
		cmd.Stdin = bytes.NewBufferString(appConfig.ListCmd.List)
	}
	cmd.Stdout = os.Stderr
	cmd.Stderr = os.Stderr
	// 新しいプロセスグループを作成して所属させる
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
		Pgid:    0,
	}
	// Start() でバックグラウンド起動（Waitはしない）
	if err := cmd.Start(); err != nil {
		return noPid, fmt.Errorf("failure to start child process: %v\n", err)
	}
	return cmd.Process.Pid, nil
}
