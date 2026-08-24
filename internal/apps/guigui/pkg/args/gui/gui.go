package gui

type GuiOptions struct {
	GuiMode bool `arg:"--gui-mode,hidden" help:"launch gui"`
	QuitGui bool `arg:"--quit-gui" help:"quit gui in cmd end"`
}
