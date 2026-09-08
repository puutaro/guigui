package args

import (
	_ "embed"
)

type WebdiInfo struct {
	Webdi struct {
		Version     string `toml:"version"`
		Name        string `toml:"name"`
		Description string `toml:"description"`
	} `toml:"webdi"`
}
