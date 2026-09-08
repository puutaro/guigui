//go:build !darwin

package windowtool

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CustomShow(ctx context.Context) {
	runtime.WindowUnminimise(ctx)
	runtime.WindowShow(ctx)
}
