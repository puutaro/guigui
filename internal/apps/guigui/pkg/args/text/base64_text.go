package text

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"os"
	"strings"
)

type Base64Text string

func (b *Base64Text) UnmarshalText(text []byte) error {
	str := string(bytes.TrimSpace(text))
	base64Prefix := "base64://"
	if !strings.HasPrefix(str, base64Prefix) {
		*b = Base64Text(str)
		return nil
	}
	// "base64:" で始まっている場合のみデコードを実行
	rawBase64 := strings.TrimSpace(
		strings.TrimPrefix(str, base64Prefix),
	)
	decodedBytes, err := base64.StdEncoding.DecodeString(rawBase64)
	if err == nil {
		*b = Base64Text(decodedBytes)
		return nil
	}
	fmt.Fprintf(os.Stderr, "failure to decode base64: %s", str)
	*b = Base64Text(str)
	return nil
}

func (b Base64Text) String(isTrimEndNewLine bool) string {
	if isTrimEndNewLine {
		return strings.TrimSuffix(string(b), "\n")
	}
	return string(b)
}
