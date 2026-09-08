package network

import (
	"fmt"
	"os"
	"path/filepath"
)

func SendJsonBytesToFile(fileBytes []byte, jsonPath string) error {
	// 2. 書き込み先の親ディレクトリが存在しない場合に備えて作成
	dir := filepath.Dir(jsonPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	// 3. ファイルに書き込む（既存ファイルは上書き）
	if err := os.WriteFile(jsonPath, fileBytes, 0644); err != nil {
		return err
	}
	return nil
}

func LoadFileAsBytes(jsonPath string) ([]byte, error) {
	bytes, err := os.ReadFile(jsonPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read JSON file: %w", err)
	}
	return bytes, nil
}
