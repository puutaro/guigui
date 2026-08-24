package args

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/alexflint/go-arg"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
)

type CLI struct {
	Form *form.FormCmd `arg:"subcommand:form" help:"Launch a form dialog"`
	List *list.ListCmd `arg:"subcommand:list" help:"Launch a list dialog"`
}
type AppConfig struct {
	CmdName      string
	WindowConfig window.WindowOptions

	FormCmd   *form.FormCmd
	ListCmd   *list.ListCmd
	IsGuiMode bool
	IsQuitGui bool
	UniqueId  string
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
	switch {
	case args.Form != nil:
		if strings.TrimSpace(args.Form.Id) == "" {
			return nil, fmt.Errorf("Error: --id must not be blank string")
		}
	case args.List != nil:
		if strings.TrimSpace(args.List.Id) == "" {
			return nil, fmt.Errorf("Error: --id must not be blank string")
		}
	}
	cmdName := "form"
	var windowConfig window.WindowOptions
	formCmd := args.Form
	listCmd := args.List
	switch {
	case listCmd != nil:
		stat, err := os.Stdin.Stat()
		if err != nil || (stat.Mode()&os.ModeCharDevice) != 0 {
			break
		}
		var lines []string
		scanner := bufio.NewScanner(os.Stdin)
		// スキャナーで1行ずつループして読み込む
		for scanner.Scan() {
			lines = append(lines, scanner.Text())
		}
		if err := scanner.Err(); err != nil {
			return nil, fmt.Errorf("error reading stdin: %v\n", err)
		}
		// 読み込んだ行を改行で結合して格納する
		if len(lines) > 0 {
			args.List.List = strings.Join(lines, "\n")
			args.List.IsStdin = true
		}
	}
	isQuitGui := false
	isGuiMode := false
	uniqueId := ""
	switch {
	case formCmd != nil:
		windowConfig = formCmd.WindowOptions
		isGuiMode = formCmd.GuiMode
		isQuitGui = formCmd.QuitGui
		uniqueId = formCmd.Id
	case listCmd != nil:
		windowConfig = listCmd.WindowOptions
		cmdName = "list"
		isGuiMode = listCmd.GuiMode
		isQuitGui = listCmd.QuitGui
		uniqueId = listCmd.Id
	}
	return &AppConfig{
		CmdName:      cmdName,
		WindowConfig: windowConfig,
		FormCmd:      args.Form,
		ListCmd:      args.List,
		IsGuiMode:    isGuiMode,
		IsQuitGui:    isQuitGui,
		UniqueId:     uniqueId,
	}, nil
}
