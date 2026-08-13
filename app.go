package main

import (
	"context"
	"fmt"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/alert"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type windowPositionConfig struct {
	x, y *int
}

type App struct {
	ctx                  context.Context
	activeMode           string
	windowPositionConfig windowPositionConfig

	formCmd  *form.FormCmd
	listCmd  *list.ListCmd
	alertCmd *alert.AlertCmd
}

func NewApp(mode string, windowPositionConfig windowPositionConfig) *App {
	if mode == "" {
		mode = "form"
	}
	return &App{
		activeMode:           mode,
		windowPositionConfig: windowPositionConfig,
		formCmd:              &form.FormCmd{},
		listCmd:              &list.ListCmd{},
		alertCmd:             &alert.AlertCmd{},
	}
}

func (a *App) GetActiveMode() string {
	return a.activeMode
}
func (a *App) TestFunc() string {
	return "test"
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
	windowPositionConfig := a.windowPositionConfig
	x := windowPositionConfig.x
	y := windowPositionConfig.y
	if x != nil && y != nil {
		runtime.WindowSetPosition(a.ctx, *x, *y)
	}
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
