package network

import (
	"os"
	"path/filepath"
)

func GetAppDir() string {
	appDir := filepath.Join(os.TempDir(), "cmdclick")
	return appDir
}
func GetReqJsonDirPath() string {
	return filepath.Join(GetAppDir(), "req")
}
func GetReqJsonFilePath() string {
	return filepath.Join(GetReqJsonDirPath(), "req.json")
}
func GetResJsonDirPath() string {
	return filepath.Join(GetAppDir(), "res")
}
func GetResJsonFilePath() string {
	return filepath.Join(GetResJsonDirPath(), "res.json")
}
