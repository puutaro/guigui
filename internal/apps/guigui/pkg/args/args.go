package args

import (
	"fmt"
	"os"

	"github.com/BurntSushi/toml"
	"github.com/alecthomas/kong"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/alert"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/argmethod"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
)

type CLI struct {
	Version kong.VersionFlag `name:"version" help:"Print version information."`
	Form    form.FormCmd     `cmd:"form" help:"Launch a form dialog"`
	List    list.ListCmd     `cmd:"list" help:"Launch a list dialog"`
	Alert   alert.AlertCmd   `cmd:"alert" help:"Launch an alert dialog"`
}
type AppConfig struct {
	CmdName      string
	WindowConfig window.WindowOptions
}

func Parse() (*AppConfig, error) {
	var info GuiGuiInfo
	if _, err := toml.Decode(string(GuiGuiInfoRaw), &info); err != nil {
		return nil, fmt.Errorf("failed to parse toml: %v", err)
	}

	var cli CLI
	parser, err := kong.New(&cli,
		kong.Name(info.GuiGui.Name),
		kong.Description(info.GuiGui.Description),
		kong.Vars{
			"version": info.GuiGui.Version,
		},
	)
	if err != nil {
		return nil, err
	}

	argsToParse := os.Args[1:]
	ctx, err := parser.Parse(argsToParse)

	var cmdName string
	if err != nil {
		if len(argsToParse) == 0 {
			cmdName = "form"
		} else {
			return nil, err
		}
	} else {
		cmdName = ctx.Command()
	}
	var commandRegistry = map[string]argmethod.Method{
		"form":  &cli.Form,
		"list":  &cli.List,
		"alert": &cli.Alert,
	}
	cmd, ok := commandRegistry[cmdName]
	if !ok {
		return nil, fmt.Errorf("cmd not found: %s", cmdName)
	}
	var windowConfig window.WindowOptions
	windowConfig = cmd.GetWindowConfig()
	return &AppConfig{
		CmdName:      cmdName,
		WindowConfig: windowConfig,
	}, nil
}
