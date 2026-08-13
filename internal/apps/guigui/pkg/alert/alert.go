package alert

import (
	"context"
	"fmt"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
)

type AlertCmd struct {
	Text string `arg:"" help:"Alert message text"`
	window.WindowOptions
}

func (cmd *AlertCmd) Run(ctx context.Context) error {
	fmt.Printf("Launching Wails window for alert: %s\n", cmd.Text)
	// TODO: Wailsの起動処理（後述）
	return nil
}
func (c *AlertCmd) GetWindowConfig() window.WindowOptions {
	return window.WindowOptions{
		Width:  c.Width,
		Height: c.Height,
		X:      c.X,
		Y:      c.Y,
	}
}

// GetAlertConfig returns alert configuration for frontend
// Pass alert config to frontend
func (cmd *AlertCmd) GetAlertConfig() map[string]any {
	return map[string]any{
		"text": cmd.Text,
	}
}
