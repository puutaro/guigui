package window

import "strings"

type WindowOptions struct {
	Title      string `arg:"--title" help:"window title string"`
	Text       string `arg:"--text" help:"description message"`
	Borders    int    `arg:"--borders" default:"10" help:"padding for component"`
	FontSize   int    `arg:"--font-size" default:"10" help:"font size"`
	WindowIcon string `arg:"--window-icon" default:"" help:"window ion"`
	Width      int    `arg:"--width" default:"1024" help:"Window width"`
	Height     int    `height:"height" default:"768" help:"Window height"`
	X          *int   `--x:"x" help:"Window X position"`
	Y          *int   `--y:"y" help:"Window Y position"`
	Center     bool   `--center:"center" help:"Window center position"`
	Scroll     bool   `--scroll:"scroll" help:"yad comp stub"`
}

func (w WindowOptions) TextUnescapeNewlines() string {
	// 1. すでにエスケープされている \\n を一意なプレースホルダーに一時退避
	placeholder := "\x00__ESCAPED_LF__\x00"
	s := strings.ReplaceAll(w.Text, "\\\\n", placeholder)

	// 2. 残った通常の \n を実際の改行文字に置換
	s = strings.ReplaceAll(s, "\\n", "\n")

	// 3. 退避させていた \\n を元の形に戻す
	s = strings.ReplaceAll(s, placeholder, "\\n")

	return s
}
