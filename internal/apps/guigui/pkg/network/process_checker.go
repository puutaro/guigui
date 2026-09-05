package network

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"golang.org/x/sys/unix"
)

const NoPid = -1

type existInfo struct {
	Pid   int  `json:"pid"`
	IsGui bool `json:"isGui"`
}

func CreateExistFile(id string, pid int) error {
	existFilePath := GetAppExistFilePath(id)
	dir := filepath.Dir(existFilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	fileBytes, err := json.MarshalIndent(
		existInfo{
			Pid:   pid,
			IsGui: false,
		},
		"", "  ",
	)
	if err != nil {
		return err
	}
	return SendJsonBytesToFile(
		fileBytes,
		existFilePath,
	)
}
func UpdateExistInfoByGuiEnable(id string) error {
	existFilePath := GetAppExistFilePath(id)
	existInfoBytes, err := LoadFileAsBytes(existFilePath)
	if err != nil {
		return err
	}
	var existInfo existInfo
	if err := json.Unmarshal(existInfoBytes, &existInfo); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	existInfo.IsGui = true
	updatedExistInfoBytes, err := json.MarshalIndent(existInfo, "", "  ")
	if err != nil {
		return err
	}
	return SendJsonBytesToFile(updatedExistInfoBytes, existFilePath)
}
func RemoveExistFile(id string) error {
	existFilePath := GetAppExistFilePath(id)
	err := os.Remove(existFilePath)
	if err != nil {
		return fmt.Errorf("failure to read pid from %s", existFilePath)
	}
	return nil
}

func IsGuiProcessRunning(id string) (bool, error) {
	existFilePath := GetAppExistFilePath(id)
	var existInfo existInfo
	existInfoBytes, LoadFileAsBytesErr := LoadFileAsBytes(existFilePath)
	if LoadFileAsBytesErr != nil {
		return false, fmt.Errorf("failed to load file: %s", LoadFileAsBytesErr)
	}
	if err := json.Unmarshal(existInfoBytes, &existInfo); err != nil {
		return false, fmt.Errorf("failed to unmarshal JSON: %s", err)
	}
	if !existInfo.IsGui {
		return false, nil
	}
	// Signal 0 を送信（実際にはシグナルを送らず、プロセスの存在と権限のみチェック）
	// macOS / Linux 共通で動作し、OSカーネルメモリ上で即座に完結するため最速
	err := unix.Kill(existInfo.Pid, 0)
	if err == nil {
		return true, nil
	}
	// err == unix.ESRCH の場合は「PIDが存在しない（プロセスが死んだ）」
	return false, nil
}
