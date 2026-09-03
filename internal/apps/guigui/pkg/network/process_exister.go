package network

import (
	"os"
	"path/filepath"
)

func CreateProcExistFile(id string) error {
	existFilePath := GetAppExistFilePath(id)
	dir := filepath.Dir(existFilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	// 3. ファイルに書き込む（既存ファイルは上書き）
	if _, err := os.Create(existFilePath); err != nil {
		return err
	}
	return nil
}
