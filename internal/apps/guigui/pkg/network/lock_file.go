package network

// func getLockFilePath() string {
// 	appDir := getAppDir()
// 	return filepath.Join(appDir, "cmdclickgui.lock")
// }

// func mkDir() error {
// 	appDir := getAppDir()

// 	// 2. 権限「0700」（所有者のみ読み書き実行可能）でディレクトリを作成
// 	// すでに存在している場合は何もしない（nilを返す）
// 	err := os.MkdirAll(appDir, 0700)
// 	if err != nil {
// 		return fmt.Errorf("failure to make app dir: %v\n", err)
// 	}
// 	return nil
// }

// func IsLockFileExists() bool {
// 	lockFilePath := getLockFilePath()
// 	if _, err := os.Stat(lockFilePath); err == nil {
// 		return true
// 	}
// 	return false
// }
// func MakeLockFilePath() error {
// 	err := mkDir()
// 	if err != nil {
// 		return err
// 	}
// 	lockFilePath := getLockFilePath()
// 	// 3. ロックファイルを作成（すでに存在している場合は上書き）
// 	file, err := os.Create(lockFilePath)
// 	if err != nil {
// 		return fmt.Errorf("failure to create lock file: %v\n", err)
// 	}
// 	defer file.Close()
// 	return nil
// }
// func RemoveLockFile() error {
// 	if !IsLockFileExists() {
// 		return nil
// 	}
// 	lockFilePath := getLockFilePath()
// 	err := os.Remove(lockFilePath)
// 	if err != nil {
// 		return fmt.Errorf("failure to remove lock file: %v\n", err)
// 	}
// 	return nil
// }
