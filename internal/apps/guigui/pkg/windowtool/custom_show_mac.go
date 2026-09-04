//go:build darwin

package windowtool

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// CustomMinimise 画面とドックから完全に姿を消す（非表示）
// CustomShow 非表示や最小化から確実に画面へ復元する
func CustomShow(ctx context.Context) {
	// 1. ウィンドウを画面上に表示させる（非表示からの復帰）
	runtime.WindowShow(ctx)

	// 2. もしユーザーが手動でドックへ「最小化」していた場合も考慮して、最小化を解除する
	runtime.WindowUnminimise(ctx)
}
