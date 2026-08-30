#!/bin/sh
set -e

REPO_URL="https://github.com/puutaro/guigui"
BINARY_NAME="guigui"
INSTALL_DIR="/usr/local/bin"

# 1. Gitの確認・自動インストール
ensure_git() {
    if ! command -v git >/dev/null 2>&1; then
        echo "==> Git is not installed. Installing Git..."
        if [ "$(uname -s)" = "Darwin" ]; then
            brew install git || xcode-select --install
        else
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                case "$ID" in
                    ubuntu|debian|linuxmint|pop)
                        sudo apt-get update && sudo apt-get install -y git
                        ;;
                    fedora|rhel|centos|rocky|almalinux)
                        sudo dnf install -y git
                        ;;
                    arch|manjaro)
                        sudo pacman -S --needed --noconfirm git
                        ;;
                    *)
                        sudo apt-get install -y git || sudo dnf install -y git
                        ;;
                esac
            fi
        fi
    fi
}

# 2. Goの確認・自動インストール（公式バイナリを使用）
ensure_go() {
    if ! command -v go >/dev/null 2>&1; then
        echo "==> Go is not installed. Installing Go..."
        GO_VERSION="1.22.5"
        ARCH="$(uname -m)"
        [ "$ARCH" = "x86_64" ] && ARCH="amd64"
        [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ] && ARCH="arm64"
        OS_LOWER="$(echo "$(uname -s)" | tr '[:upper:]' '[:lower:]')"
        
        GO_TARBALL="go${GO_VERSION}.${OS_LOWER}-${ARCH}.tar.gz"
        curl -sLO "https://golang.org/dl/${GO_TARBALL}"
        sudo rm -rf /usr/local/go
        sudo tar -C /usr/local -xzf "${GO_TARBALL}"
        rm -f "${GO_TARBALL}"
    fi
    # パスを通す
    export PATH=$PATH:/usr/local/go/bin
    export PATH=$PATH:$(go env GOPATH)/bin
}

# 3. Wails CLIの確認・自動インストール
ensure_wails() {
    if ! command -v wails >/dev/null 2>&1; then
        echo "==> Wails CLI is not installed. Installing Wails..."
        go install github.com/wailsapp/wails/v2/cmd/wails@latest
    fi
}

# 4. LinuxのWebKit依存関係の自動インストール
install_linux_dependencies() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "==> Checking system dependencies for $ID..."
        
        case "$ID" in
            ubuntu|debian|linuxmint|pop)
                if ! dpkg -s libwebkit2gtk-4.1-dev >/dev/null 2>&1 && ! dpkg -s libwebkit2gtk-4.0-dev >/dev/null 2>&1; then
                    echo "==> Installing WebKit2GTK and build tools..."
                    sudo apt-get update
                    sudo apt-get install -y build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev || \
                    sudo apt-get install -y build-essential pkg-config libgtk-3-dev libwebkit2gtk-4.0-dev
                fi
                ;;
            fedora|rhel|centos|rocky|almalinux)
                if ! rpm -q webkit2gtk4.1-devel >/dev/null 2>&1 && ! rpm -q webkit2gtk4.0-devel >/dev/null 2>&1; then
                    echo "==> Installing WebKit2GTK and build tools..."
                    sudo dnf install -y gcc pkgconf-pkg-config gtk3-devel webkit2gtk4.1-devel || \
                    sudo dnf install -y gcc pkgconf-pkg-config gtk3-devel webkit2gtk4.0-devel
                fi
                ;;
            arch|manjaro)
                if ! pacman -Q webkit2gtk >/dev/null 2>&1 && ! pacman -Q webkit2gtk-4.1 >/dev/null 2>&1; then
                    echo "==> Installing WebKit2GTK and build tools..."
                    sudo pacman -Syu --needed --noconfirm base-devel webkit2gtk pkgconf
                fi
                ;;
        esac
    fi
}

# 実行フロー
ensure_git
ensure_go
ensure_wails

# 一時ディレクトリにリポジトリをクローン
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "==> Cloning repository..."
git clone --depth 1 "$REPO_URL" "$TEMP_DIR/app"
cd "$TEMP_DIR/app"

# OSの自動判別とビルド
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
            BUILD_TAGS="-tags webkit2_41"
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