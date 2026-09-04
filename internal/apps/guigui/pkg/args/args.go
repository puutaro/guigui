package args

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"unicode/utf8"

	"github.com/BurntSushi/toml"
	"github.com/alexflint/go-arg"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/windowcmd"
)

type CLI struct {
	Form   *form.FormCmd        `arg:"subcommand:form" help:"Launch a form dialog"`
	List   *list.ListCmd        `arg:"subcommand:list" help:"Launch a list dialog"`
	Window *windowcmd.WindowCmd `arg:"subcommand:window" help:"manipulate dialog window"`
}
type AppConfig struct {
	CmdName      string
	WindowConfig window.WindowOptions

	WindowCmd *windowcmd.WindowCmd
	FormCmd   *form.FormCmd
	ListCmd   *list.ListCmd
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
		if err := validateId(args.Form.Id, "id"); err != nil {
			return nil, err
		}
	case args.List != nil:
		if err := validateId(args.List.Id, "id"); err != nil {
			return nil, err
		}
	}
	cmdName := "form"
	var windowConfig window.WindowOptions
	windowCmd := args.Window
	formCmd := args.Form
	listCmd := args.List
	switch {
	case windowCmd != nil:
		cmdName = "window"
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
	switch {
	case formCmd != nil:
		windowConfig = formCmd.WindowOptions
	case listCmd != nil:
		windowConfig = listCmd.WindowOptions
		cmdName = "list"
	}
	return &AppConfig{
		CmdName:      cmdName,
		WindowConfig: windowConfig,
		FormCmd:      args.Form,
		ListCmd:      args.List,
		WindowCmd:    args.Window,
	}, nil
}

func validateId(path string, name string) error {
	// 1. 空文字チェック
	if strings.TrimSpace(path) == "" {
		return fmt.Errorf("%s cannot be empty", name)
	}
	// 2. パス全体の長さチェック (通常は4096バイト未満)
	if len(path) > 4096 {
		return fmt.Errorf("%s is too long (exceeds 4096 bytes)", name)
	}
	// 3. 各文字単位での危険文字チェック
	for i, r := range path {
		switch {
		// ヌル文字 (パスの途中で途切れる原因)
		case r == '\x00':
			return fmt.Errorf("%s contains null character at index %d", name, i)
		// 改行文字 (LF, CR。スクリプトやログのパースを壊す)
		case r == '\n' || r == '\r':
			return fmt.Errorf("%s contains newline character at index %d", name, i)
		// シェルのメタ文字・制御文字（インジェクションやパース崩れを防ぐため厳格に弾く場合）
		// 必要に応じて許可する文字に合わせて調整してください
		case r == ';' || r == '&' || r == '|' || r == '`' || r == '$' || r == '<' || r == '>':
			return fmt.Errorf("%s contains dangerous shell meta character '%c' at index %d", name, r, i)
		// ダブルクォーテーション・シングルクォーテーション
		case r == '"' || r == '\'':
			return fmt.Errorf("%s contains quote character '%c' at index %d", name, r, i)
		}
	}
	// 4. 個別のファイル名セグメントごとのチェック（必要に応じて）
	// パスをスラッシュで分割して、各要素をチェック
	segments := strings.Split(path, "/")
	for _, seg := range segments {
		// セグメントが長すぎる場合（通常は255バイト以下）
		if len(seg) > 255 {
			return fmt.Errorf("%s is too long (exceeds 255 bytes)", name)
		}
		// 「.」や「..」単体の混入を厳しく弾きたい場合
		if seg == "." || seg == ".." {
			return fmt.Errorf("%s segment cannot be '.' or '..'", name)
		}
	}
	// 不正なUTF-8シーケンスが含まれていないかチェック
	if !utf8.ValidString(path) {
		return fmt.Errorf("%s contains invalid UTF-8 sequence", name)
	}
	return nil
}
