package text

import "strings"

func TextUnescapeNewlinesTab(str string) string {
	return textUnescapeNewlines(textUnescapeTabs(str))
}

func textUnescapeNewlines(str string) string {
	// 1. すでにエスケープされている \\n を一意なプレースホルダーに一時退避
	placeholder := "\x00__ESCAPED_LF__\x00"
	s := strings.ReplaceAll(str, "\\\\n", placeholder)
	// 2. 残った通常の \n を実際の改行文字に置換
	s = strings.ReplaceAll(s, "\\n", "\n")
	// 3. 退避させていた \\n を元の形に戻す
	s = strings.ReplaceAll(s, placeholder, "\\n")
	return s
}

func textUnescapeTabs(str string) string {
	placeholder := "\x00__ESCAPED_LF__\x00"
	s := strings.ReplaceAll(str, "\\\\t", placeholder)
	s = strings.ReplaceAll(s, "\\t", "\t")
	s = strings.ReplaceAll(s, placeholder, "\\t")
	return s
}
