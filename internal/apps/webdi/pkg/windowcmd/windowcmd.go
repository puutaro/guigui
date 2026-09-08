package windowcmd

import "github.com/puutaro/webdi/internal/apps/webdi/pkg/args/unique"

type WindowCmd struct {
	Show bool `arg:"--show,required" help:"show gui"`
	unique.Unique
}
