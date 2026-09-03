//go:build darwin

package main

/*
// 🚀 コンパイラにObjective-Cコードであることを明示します
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework AppKit
#import <AppKit/AppKit.h>

void hideFrontmostApplication() {
    @autoreleasepool {
        NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
        NSRunningApplication *frontmostApp = [workspace frontmostApplication];
        if (frontmostApp != nil) {
            [frontmostApp hide];
        }
    }
}
*/
import "C"

import (
	"context"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func customMinimise(ctx context.Context) {
	// ネイティブAPIで非表示化
	C.hideFrontmostApplication()

	// フォーカス移動の微小ウェイト
	time.Sleep(10 * time.Millisecond)

	// Wailsのウィンドウを最小化
	runtime.WindowHide(ctx)
	// runtime.WindowMinimise(ctx)
}
