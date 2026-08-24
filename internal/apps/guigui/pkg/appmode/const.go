package appmode

type AppModes struct {
	Loading string `json:"loading"`
	Form    string `json:"form"`
	List    string `json:"list"`
}

func GetAppModes() AppModes {
	return AppModes{
		Loading: "loading",
		Form:    "form",
		List:    "list",
	}
}
