package unique

type Unique struct {
	Id    string `arg:"--id" help:"id for gui server, this is require if you specify --quit-gui"`
	SubId string `arg:"--sub-id" help:"id for component"`
}
