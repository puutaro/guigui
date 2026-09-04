package network

import (
	"fmt"
	"os"
	"path/filepath"
)

func GetAppDir() string {
	appDir := filepath.Join(os.TempDir(), "guigui")
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

func getAppExistDirPath() string {
	return filepath.Join(GetAppDir(), "appExist")
}
func GetAppExistFilePath(id string) string {
	return filepath.Join(getAppExistDirPath(), fmt.Sprintf("exist_%s.json", id))
}
func getAppShowDirPath() string {
	return filepath.Join(GetAppDir(), "show")
}
func GetAppShowFilePath(id string) string {
	return filepath.Join(getAppShowDirPath(), fmt.Sprintf("show_%s.json", id))
}
