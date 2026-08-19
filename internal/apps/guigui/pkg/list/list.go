package list

import (
	"context"
	"fmt"
	"strings"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
)

type ListCmd struct {
	List string `arg:"--list" help:"string contents separated by newline"`
	window.WindowOptions
}

func (cmd *ListCmd) Run(ctx context.Context) error {
	fmt.Println("Launching Wails window for list...")
	// TODO: Wailsの起動処理（後述）
	return nil
}
func (c *ListCmd) GetWindowConfig() window.WindowOptions {
	return window.WindowOptions{
		Width:  c.Width,
		Height: c.Height,
		X:      c.X,
		Y:      c.Y,
	}
}

type ListConfigResponse struct {
	List     []string `json:"list"`
	Borders  int      `json:"borders"`
	FontSize int      `json:"fontSize"`
}

// GetListConfig returns list configuration for frontend
// Pass list config to frontend
func (cmd *ListCmd) GetListConfig() ListConfigResponse {
	return ListConfigResponse{
		List:     strings.Split(cmd.List, "\n"),
		Borders:  cmd.Borders,
		FontSize: cmd.FontSize,
	}
}
