package argmethod

import (
	"context"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
)

type Method interface {
	GetWindowConfig() window.WindowOptions
	Run(ctx context.Context) error
}
