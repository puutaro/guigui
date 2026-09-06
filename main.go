//go:generate sh -c "sh ./gen_guigui_info.sh"
package main

import (
	"embed"
	"fmt"
	"os"
	"strings"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/image"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/guiproc"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/network"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

const (
	exitSuccess    = 0
	exitErrGeneral = 1
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	isWailsTool := false
	for _, arg := range os.Args {
		// wailsbindings や wails の文字が含まれているかチェック
		if strings.Contains(arg, "wailsbindings") || strings.Contains(arg, "wails") {
			isWailsTool = true
			break
		}
	}
	appConfig := &args.AppConfig{}
	isGuiMode := false
	isWindwoCmd := false
	var parseErr error
	switch {
	case isWailsTool:
		isGuiMode = true
	default:
		// 通常実行時のみ、本来の go-arg パースを実行する
		appConfig, parseErr = args.Parse()
		if parseErr != nil {
			fmt.Fprintf(os.Stderr, "%s\n", parseErr)
			os.Exit(exitErrGeneral)
		}
		isWindwoCmd = appConfig.WindowCmd != nil
		isGuiMode = getIsGuiModeFromCmd(
			appConfig.FormCmd,
			appConfig.ListCmd,
		)
	}
	if parseErr != nil {
		fmt.Fprintf(os.Stderr, "%s\n", parseErr)
		os.Exit(exitErrGeneral)
	}
	uniqueId := getIdFromCmd(
		appConfig.FormCmd,
		appConfig.ListCmd,
		appConfig.WindowCmd,
	)
	isGuiProcess := false
	var IsGuiProcessRunningErr error
	if !isWailsTool {
		isGuiProcess, IsGuiProcessRunningErr =
			network.IsGuiProcessRunning(uniqueId)
	}
	if IsGuiProcessRunningErr != nil {
		fmt.Fprintf(
			os.Stderr,
			"Info:IsGuiProcessRunning: %s\n",
			IsGuiProcessRunningErr.Error(),
		)
	}
	if isGuiMode &&
		!isGuiProcess &&
		!isWindwoCmd {
		err := startsGui(appConfig)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %s\n", err.Error())
			os.Exit(exitErrGeneral)
		}
		return
	}
	if !isGuiProcess && !isWindwoCmd {
		pid, err := guiproc.ExecGuiCmd(os.Args[1:], appConfig)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %s\n", err.Error())
			os.Exit(exitErrGeneral)
		}
		if err := network.CreateExistFile(uniqueId, pid); err != nil {
			fmt.Fprintf(os.Stderr, "Info:CreateExistFile: %s\n", err)
		}
	}
	if isGuiProcess {
		sendReqToGui(appConfig)
	}
	if isWindwoCmd {
		return
	}
	serveGuiRes(
		uniqueId,
		getisQuitGuiFromCmd(
			appConfig.FormCmd,
			appConfig.ListCmd,
		),
	)
}

func startsGui(appConfig *args.AppConfig) error {
	windowConfig := appConfig.WindowConfig
	// Create an instance of the app structure
	app := NewApp(
		appConfig,
	)

	windowIconBytes := image.LoadIconBytes(windowConfig.WindowIcon)
	// Create application with options
	err := wails.Run(&options.App{
		Title: windowConfig.Title,
		Windows: &windows.Options{
			DisableWindowIcon: false,
		},
		Linux: &linux.Options{
			Icon: windowIconBytes,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHidden(),
			Appearance:           mac.NSAppearanceNameAqua,
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			// macOSに「通常の最前面アプリ」として認識させ、起動時に後ろに回るのを防ぐ
			About: &mac.AboutInfo{
				Title: windowConfig.Title,
				Icon:  windowIconBytes,
			},
		},
		Width:  windowConfig.Width,
		Height: windowConfig.Height,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		// ★ 遅延と背面隠れの主因となる Frameless（枠なし）を false（標準ウィンドウ）に修正
		Frameless:        true,
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		OnStartup:        app.startup,
		OnBeforeClose:    app.sendAllQuitSignal,
		Bind: []interface{}{
			app,
		},
	})
	return err
}
