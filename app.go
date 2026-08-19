package main

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/alert"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/appmode"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type windowPositionConfig struct {
	x, y   *int
	center bool
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
	windowConfig := appConfig.WindowConfig
	return &App{
		activeMode: mode,
		windowPositionConfig: windowPositionConfig{
			x:      windowConfig.X,
			y:      windowConfig.Y,
			center: windowConfig.Center,
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
func (a *App) GetListConfig() list.ListConfigResponse {
	if a.listCmd == nil {
		return list.ListConfigResponse{}
	}
	return a.listCmd.GetListConfig()
}

func (a *App) SelectFile(title string) (string, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	return filePath, err
}
func (a *App) SelectDir(title string) (string, error) {
	dirPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	return dirPath, err
}
func (a *App) RunCmd(cmdStr string) error {
	cmd := exec.Command("bash", "-c", cmdStr)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	// コマンドを実行
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("command failed: %v", err)
	}
	return nil
}

func (a *App) RunReloadCmdForList(cmdStr, line, delimiter string) (string, error) {
	replacedCmdStr := a.replaceHolder(cmdStr, line, delimiter)
	cmd := exec.Command("bash", "-c", replacedCmdStr)
	cmd.Stderr = os.Stderr
	var stdoutBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("command failed: %w", err)
	}
	return strings.TrimSuffix(stdoutBuf.String(), "\n"), nil
}
func (a *App) RunlCmdForList(cmdStr, line, delimiter string) error {
	replacedCmdStr := a.replaceHolder(cmdStr, line, delimiter)
	return a.RunCmd(replacedCmdStr)
}

func (a *App) replaceHolder(cmdStr, line, delimiter string) string {
	replacedCmdStr := strings.ReplaceAll(
		cmdStr,
		"{}",
		line,
	)
	if delimiter != "" {
		fields := strings.Split(line, delimiter)
		for i, field := range fields {
			replacedCmdStr = strings.ReplaceAll(
				replacedCmdStr,
				fmt.Sprintf("{%d}", i+1),
				field,
			)
		}
	}
	return replacedCmdStr
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
	windowPositionConfig := a.windowPositionConfig
	isCenter := windowPositionConfig.center
	x := windowPositionConfig.x
	y := windowPositionConfig.y
	switch true {
	case isCenter:
		runtime.WindowCenter(a.ctx)
	case x != nil && y != nil:
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
