package window

type WindowOptions struct {
	Title    string `name:"title" help:"window title string"`
	Text     string `name:"text" help:"description message"`
	Borders  int    `name:"borders" default:"10" help:"padding for component"`
	FontSize int    `default:"10" help:"font size"`
	Width    int    `name:"width" default:"1024" help:"Window width"`
	Height   int    `name:"height" default:"768" help:"Window height"`
	X        *int   `name:"x" help:"Window X position"`
	Y        *int   `name:"y" help:"Window Y position"`
	Center   bool   `name:"center" help:"Window center position"`
}
