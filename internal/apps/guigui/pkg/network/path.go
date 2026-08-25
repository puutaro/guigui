package network

import (
	"fmt"
	"os"
	"path/filepath"
)

func GetAppDir() string {
	appDir := filepath.Join(os.TempDir(), "cmdclick")
	return appDir
}
func getReqJsonDirPath() string {
	return filepath.Join(GetAppDir(), "req")
}
func GetReqJsonFilePath(id string) string {
	return filepath.Join(getReqJsonDirPath(), fmt.Sprintf("req_%s.json", id))
}
func getResJsonDirPath() string {
	return filepath.Join(GetAppDir(), "res")
}
func GetResJsonFilePath(id string) string {
	return filepath.Join(getResJsonDirPath(), fmt.Sprintf("res_%s.json", id))
}
