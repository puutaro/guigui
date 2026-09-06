package text

import (
	"encoding/base64"
	"strings"
)

type Base64Text string

func (b *Base64Text) UnmarshalText(text []byte) error {
	decodedBytes, err := base64.StdEncoding.DecodeString(string(text))
	if err == nil {
		*b = Base64Text(decodedBytes)
	} else {
		*b = Base64Text(text)
	}
	return nil
}

// Stringer インターフェースを実装しておくと、fmt や他の関数に直接渡せます
func (b Base64Text) String(isTrimEndNewLine bool) string {
	if isTrimEndNewLine {
		return strings.TrimSuffix(string(b), "\n")
	}
	return string(b)
}
