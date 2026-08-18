package window

import "strings"

type WindowOptions struct {
	Title      string `name:"title" help:"window title string"`
	Text       string `name:"text" help:"description message"`
	Borders    int    `name:"borders" default:"10" help:"padding for component"`
	FontSize   int    `default:"10" help:"font size"`
	WindowIcon string `default:"" help:"window ion"`
	Width      int    `name:"width" default:"1024" help:"Window width"`
	Height     int    `name:"height" default:"768" help:"Window height"`
	X          *int   `name:"x" help:"Window X position"`
	Y          *int   `name:"y" help:"Window Y position"`
	Center     bool   `name:"center" help:"Window center position"`
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
