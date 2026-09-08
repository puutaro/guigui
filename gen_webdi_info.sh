#!/bin/bash
# gen_version.sh

readonly OUTPUT_FILE="internal/apps/webdi/pkg/args/z_webdi_toml.go"

# 自動生成される Go ファイルの構造をヒアドキュメントで書き出す
cat << EOF > "$OUTPUT_FILE"
package args

const WebdiInfoRaw = \`$(cat webdi.toml)\`
EOF