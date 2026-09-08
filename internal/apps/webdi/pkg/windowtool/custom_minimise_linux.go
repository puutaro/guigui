//go:build !darwin

package windowtool

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CustomMinimise(ctx context.Context) {
	// Windows/Linuxでは通常の最小化のみを実行
	runtime.WindowMinimise(ctx)
}
