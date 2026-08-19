package window

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
