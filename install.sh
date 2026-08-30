#!/bin/sh
set -e

REPO_URL="https://github.com/your-username/your-repo.git"
BINARY_NAME="your-app-name"
INSTALL_DIR="/usr/local/bin"

# 必須コマンドのチェック (git, go, wails)
for cmd in git go wails; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: Required command '$cmd' is not installed."
        exit 1
    fi
done

# Linuxの場合の依存関係自動インストール関数
install_linux_dependencies() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "==> Checking system dependencies for $ID..."
        
        case "$ID" in
            ubuntu|debian|linuxmint|pop)
                if ! dpkg -s libwebkit2gtk-4.1-dev >/dev/null 2>&1 && ! dpkg -s libwebkit2gtk-4.0-dev >/dev/null 2>&1; then
                    echo "==> Installing WebKit2GTK and build tools (sudo required)..."
                    sudo apt-get update
                    sudo apt-get install -y build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev || \
                    sudo apt-get install -y build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.0-dev
                fi
                ;;
            fedora|rhel|centos|rocky|almalinux)
                if ! rpm -q webkit2gtk4.1-devel >/dev/null 2>&1 && ! rpm -q webkit2gtk4.0-devel >/dev/null 2>&1; then
                    echo "==> Installing WebKit2GTK and build tools (sudo required)..."
                    sudo dnf install -y gcc pkgconf-pkg-config gtk3-devel webkit2gtk4.1-devel || \
                    sudo dnf install -y gcc pkgconf-pkg-config gtk3-devel webkit2gtk4.0-devel
                fi
                ;;
            arch|manjaro)
                if ! pacman -Q webkit2gtk >/dev/null 2>&1 && ! pacman -Q webkit2gtk-4.1 >/dev/null 2>&1; then
                    echo "==> Installing WebKit2GTK and build tools (sudo required)..."
                    sudo pacman -Syu --needed base-devel webkit2gtk pkgconf
                fi
                ;;
            *)
                echo "Warning: Unknown Linux distribution. Skipping auto-dependency installation."
                ;;
        esac
    fi
}

# 一時ディレクトリにリポジトリをクローン
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "==> Cloning repository..."
git clone --depth 1 "$REPO_URL" "$TEMP_DIR/app"
cd "$TEMP_DIR/app"

# OSの自動判別とビルド処理
OS="$(uname -s)"
BUILD_TAGS=""

case "$OS" in
    Linux)
        install_linux_dependencies
        
        echo "==> Detecting WebKit version..."
        if pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
            BUILD_TAGS="-tags webkit2_41"
        elif pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
            BUILD_TAGS="-tags webkit2_40"
        else
            BUILD_TAGS="-tags webkit2_41" # デフォルトフォールバック
        fi
        
        echo "==> Building for Linux ($BUILD_TAGS)..."
        wails build $BUILD_TAGS --clean -ldflags "-s -w"
        ;;
    Darwin)
        echo "==> Building for macOS..."
        wails build --clean -ldflags "-s -w"
        ;;
    *)
        echo "Error: Unsupported OS ($OS)"
        exit 1
        ;;
esac

# バイナリのインストール
BUILT_BINARY="build/bin/$BINARY_NAME"
if [ ! -f "$BUILT_BINARY" ]; then
    BUILT_BINARY=$(find build/bin -type f -maxdepth 1 | head -n 1)
fi

if [ -f "$BUILT_BINARY" ]; then
    echo "==> Installing to $INSTALL_DIR (sudo required)..."
    sudo cp "$BUILT_BINARY" "$INSTALL_DIR/"
    echo "==> Successfully installed: $INSTALL_DIR/$(basename "$BUILT_BINARY")"
else
    echo "Error: Built binary not found."
    exit 1
fi