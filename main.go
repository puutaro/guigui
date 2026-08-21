package main

import (
	"embed"
	"fmt"
	"os"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/image"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

const (
	exitErrGeneral = 1
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	appConfig, parseErr := args.Parse()
	if parseErr != nil {
		fmt.Fprintf(os.Stderr, "%s\n", parseErr)
		os.Exit(exitErrGeneral)
	}
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
		Frameless: true,
		// BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
