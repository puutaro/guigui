package unique

type Unique struct {
	Id    string `arg:"--id" help:"id for gui server"`
	SubId string `arg:"--sub-id" help:"id for component"`
}
