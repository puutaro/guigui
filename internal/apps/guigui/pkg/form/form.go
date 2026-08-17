package form

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/buttons"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args/window"
)

// フロントエンドへ渡すための1フィールド分の構造体
type FieldDef struct {
	Label        string   `json:"label"`
	Type         string   `json:"type"`         // CB, TXT, LBL など
	DefaultValue string   `json:"defaultValue"` // 初期値
	Items        []string `json:"items"`        // CBやCBEの選択肢（item-separatorで分割したもの）
}
type ButtonDef struct {
	Label    string `json:"label"`
	ExitCode int    `json:"exitCode"`
}

type FormCmd struct {
	ItemSeparator string   `name:"item-separator" default:"!" help:"Separator for list items"`
	Separator     string   `name:"separator" default:"|" help:"Separator for output values"`
	DateFormat    string   `name:"date-format" default:"%Y:%m:%d" help:"Date format"`
	Fields        []string `name:"field" help:"Define fields in the form"`
	FieldValues   []string `arg:"" optional:"" name:"fieldValues" help:"field values"`
	window.WindowOptions
	Buttons buttons.ButtonOptions `embed:""`
}

// KongのRun()からも接続できるようにする
func (cmd *FormCmd) Run(ctx context.Context) error {
	fmt.Println("Launching Wails window for form...")
	// ここで Wails のアプリケーションを起動する（wails.Run(...)）
	return nil
}
func (c *FormCmd) GetWindowConfig() window.WindowOptions {
	return window.WindowOptions{
		Title:  c.Title,
		Center: c.Center,
		Width:  c.Width,
		Height: c.Height,
		X:      c.X,
		Y:      c.Y,
	}
}

// レスポンス用の構造体を定義（これなら型安全！）
type FormConfigResponse struct {
	Text          string      `json:"text"`
	Borders       int         `json:"borders"`
	FontSize      int         `json:"fontSize"`
	ItemSeparator string      `json:"itemSeparator"`
	Separator     string      `json:"separator"`
	Fields        []FieldDef  `json:"fields"`
	Buttons       []ButtonDef `json:"buttons"`
}

func (cmd *FormCmd) GetFormConfig() FormConfigResponse {
	var parsedFields []FieldDef
	for index, raw := range cmd.Fields {
		fieldValues := cmd.FieldValues
		fValue := ""
		if index < len(fieldValues) {
			fValue = fieldValues[index]
		}
		parsed := parseFieldString(raw, fValue, cmd.ItemSeparator)
		parsedFields = append(parsedFields, parsed)
	}
	var parsedButtons []ButtonDef
	for _, raw := range cmd.Buttons.Buttons {
		parsed := parseButtonString(raw)
		parsedButtons = append(parsedButtons, parsed)
	}

	return FormConfigResponse{
		Text:          cmd.Text,
		Borders:       cmd.Borders,
		FontSize:      cmd.FontSize,
		ItemSeparator: cmd.ItemSeparator,
		Separator:     cmd.Separator,
		Fields:        parsedFields,
		Buttons:       parsedButtons,
	}
}
func parseButtonString(raw string) ButtonDef {
	parts := strings.SplitN(raw, ":", 2)
	label := parts[0]
	exitCode := 0
	if len(parts) > 1 {
		val, err := strconv.Atoi(parts[1])
		if err != nil {
			val = 0
		}
		exitCode = val
	}
	return ButtonDef{
		Label:    label,
		ExitCode: exitCode,
	}
}

// 文字列パースのヘルパー（簡易版）
func parseFieldString(raw, fValue, itemSep string) FieldDef {
	// 実際には yad の書式（--field="ラベル:タイプ" 初期値 のようなスペース区切りやイコール区切り）に合わせて堅牢にパースします
	left := strings.Split(raw, "=")[0]
	labelType := strings.Split(left, ":")
	label := labelType[0]
	fType := "TXT" // デフォルト
	if len(labelType) > 1 {
		fType = labelType[1]
	}

	var items []string
	if fType == "CB" || fType == "CBE" {
		items = strings.Split(fValue, itemSep)
	}

	return FieldDef{
		Label:        label,
		Type:         fType,
		DefaultValue: fValue,
		Items:        items,
	}
}
