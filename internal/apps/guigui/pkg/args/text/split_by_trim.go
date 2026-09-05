package text

import "strings"

func SplitKeepExclude(str string, spliter string) []string {
	var keepExcludes []string
	for _, s := range strings.Split(str, spliter) {
		trimmed := strings.TrimSpace(s)
		if trimmed != "" { // 空要素（例: "a, , b" や 末尾のカンマ）を除外したい場合
			keepExcludes = append(keepExcludes, trimmed)
		}
	}
	return keepExcludes
}
