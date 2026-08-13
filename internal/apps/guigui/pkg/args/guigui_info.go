package args

import (
	_ "embed"
)

type GuiGuiInfo struct {
	GuiGui struct {
		Version     string `toml:"version"`
		Name        string `toml:"name"`
		Description string `toml:"description"`
	} `toml:"guigui"`
}
