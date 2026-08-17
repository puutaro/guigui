package main

import (
	"context"
	"fmt"
	"os"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/alert"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/appmode"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args"
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

func NewApp(appConfig *args.AppConfig) *App {
	mode := appConfig.CmdName
	if mode == "" {
		mode = appmode.GetAppModes().Form
	}
	return &App{
		activeMode: mode,
		windowPositionConfig: windowPositionConfig{
			x: appConfig.WindowConfig.X,
			y: appConfig.WindowConfig.Y,
		},
		formCmd:  appConfig.FormCmd,
		listCmd:  appConfig.ListCmd,
		alertCmd: appConfig.AlertCmd,
	}
}

func (a *App) GetActiveMode() string {
	return a.activeMode
}
func (a *App) ExitWith252() {
	os.Exit(252)
}
func (a *App) ExitWith1() {
	os.Exit(1)
}
func (a *App) ExitWithNumber(exitCode int) {
	os.Exit(exitCode)
}
func (a *App) WriteStdout(str string) {
	fmt.Fprintln(os.Stdout, str)
}
func (a *App) WriteStderr(str string) {
	fmt.Fprintf(os.Stderr, "\x1b[31m%s\x1b[0m\n", str)
}

func (a *App) GetFormConfig() form.FormConfigResponse {
	if a.formCmd == nil {
		return form.FormConfigResponse{}
	}
	return a.formCmd.GetFormConfig()
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
