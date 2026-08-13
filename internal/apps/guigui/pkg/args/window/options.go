package window

type WindowOptions struct {
	Width  int  `name:"width" default:"1024" help:"Window width"`
	Height int  `name:"height" default:"768" help:"Window height"`
	X      *int `name:"x" help:"Window X position"`
	Y      *int `name:"y" help:"Window Y position"`
}
