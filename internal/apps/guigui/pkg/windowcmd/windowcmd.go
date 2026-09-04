package windowcmd

import "github.com/puutaro/guigui/internal/apps/guigui/pkg/args/unique"

type WindowCmd struct {
	Show bool `arg:"--show,required" help:"show gui"`
	unique.Unique
}
