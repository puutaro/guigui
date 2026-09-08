package image

import "os"

func LoadIconBytes(filePath string) []byte {
	if filePath == "" {
		return nil
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		// 必要に応じてログを出力するなどしてください
		return nil
	}

	return data
}
