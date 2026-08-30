#!/bin/bash
# gen_version.sh

readonly OUTPUT_FILE="internal/apps/guigui/pkg/args/z_guigui_toml.go"

# 自動生成される Go ファイルの構造をヒアドキュメントで書き出す
cat << EOF > "$OUTPUT_FILE"
package args

const GuiGuiInfoRaw = \`$(cat guigui.toml)\`
EOF