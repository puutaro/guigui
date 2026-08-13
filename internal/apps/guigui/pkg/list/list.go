package list

import (
	"context"
	"fmt"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
)

type ListCmd struct {
	Column []string `name:"column" help:"Columns for the list"`
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

// GetListConfig returns list configuration for frontend
// Pass list config to frontend
func (cmd *ListCmd) GetListConfig() map[string]any {
	return map[string]any{
		"columns": cmd.Column,
	}
}
