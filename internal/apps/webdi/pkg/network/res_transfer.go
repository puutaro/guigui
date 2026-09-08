package network

import (
	"encoding/json"
	"fmt"
)

type GuiResponse struct {
	Id       string
	ExitCode int
	Stdout   string
}

func (res GuiResponse) SendResJson() error {
	fileBytes, err := json.MarshalIndent(res, "", "  ")
	if err != nil {
		return err
	}
	return SendJsonBytesToFile(
		fileBytes,
		GetResJsonFilePath(res.Id),
	)
}
func (res *GuiResponse) LoadResJson() error {
	fileBytes, err := LoadFileAsBytes(GetResJsonFilePath(res.Id))
	if err != nil {
		return err
	}
	// 修正: &req ではなく req をそのまま渡す
	if err := json.Unmarshal(fileBytes, res); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	return nil
}
