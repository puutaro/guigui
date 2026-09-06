//go:build !darwin

package image

func ApplyMacAppIcon(iconBytes []byte) {
	// macOS以外では何もしない
}
