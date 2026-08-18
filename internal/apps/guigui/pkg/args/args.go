package args

import (
	"github.com/BurntSushi/toml"
	"github.com/alexflint/go-arg"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/alert"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
)

type CLI struct {
	Form  *form.FormCmd   `arg:"subcommand:form" help:"Launch a form dialog"`
	List  *list.ListCmd   `arg:"subcommand:list" help:"Launch a list dialog"`
	Alert *alert.AlertCmd `arg:"subcommand:alert" help:"Launch an alert dialog"`
}
type AppConfig struct {
	CmdName      string
	WindowConfig window.WindowOptions
	FormCmd      *form.FormCmd
	ListCmd      *list.ListCmd
	AlertCmd     *alert.AlertCmd
}

func (CLI) Version() string {
	var info GuiGuiInfo
	if _, err := toml.Decode(string(GuiGuiInfoRaw), &info); err != nil {
		return ""
	}
	return info.GuiGui.Version
}

func Parse() (*AppConfig, error) {

	var args CLI
	arg.MustParse(&args)
	cmdName := "form"
	var windowConfig window.WindowOptions
	formCmd := args.Form
	listCmd := args.List
	alertCmd := args.Alert
	switch {
	case formCmd != nil:
		windowConfig = formCmd.WindowOptions
	case listCmd != nil:
		windowConfig = listCmd.WindowOptions
		cmdName = "list"
	case alertCmd != nil:
		windowConfig = alertCmd.WindowOptions
		cmdName = "alert"
	}
	return &AppConfig{
		CmdName:      cmdName,
		WindowConfig: windowConfig,
		FormCmd:      args.Form,
		AlertCmd:     args.Alert,
		ListCmd:      args.List,
	}, nil
}
