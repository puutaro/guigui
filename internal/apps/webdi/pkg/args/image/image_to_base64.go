package image

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func ImageToBase64(filePath string) string {
	if filePath == "" {
		return ""
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return ""
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	mimeType := "image/png" // デフォルト
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".svg":
		mimeType = "image/svg+xml"
	case ".gif":
		mimeType = "image/gif"
	case ".webp":
		mimeType = "image/webp"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	// ★ data:image/...;base64, を付与した形式で返す
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded)
}
