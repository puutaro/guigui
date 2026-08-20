package list

import (
	"context"
	"fmt"
	"strings"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
)

type ListCmd struct {
	List string `arg:"positional,separate" help:"string contents separated by newline"`
	// List        string   `arg:"--list" help:"string contents separated by newline"`
	Reloads     []string `arg:"--reload,separate" help:"(alt/option)+key:shell reload list by shell stdout"`
	Executes    []string `arg:"--execute,separate" help:"(alt/option)+key:exec shell by shell stdout"`
	ExecQuits   []string `arg:"--exec-quit,separate" help:"(alt/option)+key:exit code:exec shell with exit by shell stdout"`
	Delimiter   string   `arg:"--delimiter" default:"" help:"delimiter about line in list"`
	WithNth     int      `arg:"--with-nth" default:"0" help:"display field by delimiter"`
	HeaderLines int      `arg:"--header-lines" default:"0" help:"display first line by header"`
	Cycle       bool     `arg:"--cycle" default:"false" help:"cycle cursor"`
	window.WindowOptions
}

func (cmd *ListCmd) Run(ctx context.Context) error {
	fmt.Println("Launching Wails window for list...")
	return nil
}

func (c *ListCmd) GetWindowConfig() window.WindowOptions {
	return window.WindowOptions{
		Width:  c.Width,
		Height: c.Height,
		X:      c.X,
		Y:      c.Y,
	}
}

type ListConfigResponse struct {
	Text        string          `json:"text"`
	List        []string        `json:"list"`
	Borders     int             `json:"borders"`
	FontSize    int             `json:"fontSize"`
	Reloads     []ExecuteConfig `json:"reloads"`
	Executes    []ExecuteConfig `json:"executes"`
	ExecQuits   []ExecuteConfig `json:"execQuits"`
	Delimiter   string          `json:"delimiter"`
	WithNth     int             `json:"withNth"`
	HeaderLines int             `json:"headerLines"`
	Cycle       bool            `json:"cycle"`
}

type ExecuteConfig struct {
	Key      string `json:"key"`
	Shell    string `json:"shell"`
	ExitCode int    `json:"exitCode"`
}

func (cmd *ListCmd) GetListConfig() ListConfigResponse {
	reloadsSrcList := cmd.Reloads
	reloads := make([]ExecuteConfig, len(reloadsSrcList))
	for i, reloadStr := range reloadsSrcList {
		reloads[i] = cmd.parseKeyShell(reloadStr)
	}
	executesSrcList := cmd.Executes
	executes := make([]ExecuteConfig, len(executesSrcList))
	for i, executeStr := range executesSrcList {
		executes[i] = cmd.parseKeyShell(executeStr)
	}
	execQuitsSrcList := cmd.ExecQuits
	execQuits := make([]ExecuteConfig, len(execQuitsSrcList))
	for i, quitExecStr := range execQuitsSrcList {
		execQuits[i] = cmd.parseKeyExitShell(quitExecStr)
	}
	return ListConfigResponse{
		Text:        cmd.Text,
		List:        strings.Split(cmd.List, "\n"),
		Borders:     cmd.Borders,
		FontSize:    cmd.FontSize,
		Reloads:     reloads,
		Executes:    executes,
		ExecQuits:   execQuits,
		Delimiter:   cmd.Delimiter,
		WithNth:     cmd.WithNth - 1,
		HeaderLines: cmd.HeaderLines,
		Cycle:       cmd.Cycle,
	}
}

func (cmd ListCmd) parseKeyShell(keyShellStr string) ExecuteConfig {
	key, shell, _ := strings.Cut(keyShellStr, ":")
	return ExecuteConfig{
		Key:   key,
		Shell: shell,
	}
}
func (cmd ListCmd) parseKeyExitShell(keyExitShellStr string) ExecuteConfig {
	keyExitShellList := strings.Split(keyExitShellStr, ":")
	key := keyExitShellList[0]
	keyExitShellListLen := len(keyExitShellList)
	exitCode := 0
	if keyExitShellListLen > 1 {
		fmt.Sscanf(keyExitShellList[1], "%d", &exitCode)
	}
	shell := ""
	if keyExitShellListLen > 2 {
		shell = keyExitShellList[2]
	}
	return ExecuteConfig{
		Key:      key,
		Shell:    shell,
		ExitCode: exitCode,
	}
}
