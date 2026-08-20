#!/usr/bin/env bash
set -euo pipefail

APP="ladizcode"
BASE_URL="https://ladizai.chinafezz.my.id/downloads"
INSTALL_DIR="$HOME/.ladizcode/bin"

echo "Installing $APP for $(uname -s)..."

# 1. Detect OS and Architecture
raw_os=$(uname -s)
os=$(echo "$raw_os" | tr '[:upper:]' '[:lower:]')
case "$raw_os" in
  Darwin*) os="darwin" ;;
  Linux*) os="linux" ;;
  *)
    echo "Error: Unsupported OS '$raw_os'"
    exit 1
    ;;
esac

arch=$(uname -m)
case "$arch" in
  x86_64) arch="x64" ;;
  aarch64|arm64) arch="arm64" ;;
  *)
    echo "Error: Unsupported architecture '$arch'"
    exit 1
    ;;
esac

filename="${APP}-${os}-${arch}.zip"
download_url="${BASE_URL}/${filename}"

mkdir -p "$INSTALL_DIR"
temp_dir=$(mktemp -d)
temp_zip="${temp_dir}/${filename}"

trap 'rm -rf "$temp_dir"' EXIT

echo "Downloading $APP ($os/$arch)..."
echo "URL: $download_url"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$download_url" -o "$temp_zip"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$temp_zip" "$download_url"
else
  echo "Error: curl or wget is required."
  exit 1
fi

file_size=$(wc -c < "$temp_zip" 2>/dev/null || echo 0)
if [ "$file_size" -lt 1048576 ]; then
  echo "Error: Downloaded package is invalid ($file_size bytes). Please verify '$filename' exists on the server."
  exit 1
fi

echo "Extracting package to $INSTALL_DIR..."
if command -v unzip >/dev/null 2>&1; then
  unzip -q -o "$temp_zip" -d "$INSTALL_DIR"
elif command -v tar >/dev/null 2>&1; then
  tar -xzf "$temp_zip" -C "$INSTALL_DIR"
else
  echo "Error: 'unzip' or 'tar' is required."
  exit 1
fi

chmod +x "$INSTALL_DIR/$APP" 2>/dev/null || true

# 2. PATH Setup
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo "Adding $INSTALL_DIR to PATH..."
    if [ -f "$HOME/.zshrc" ]; then
      echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$HOME/.zshrc"
    fi
    if [ -f "$HOME/.bashrc" ]; then
      echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$HOME/.bashrc"
    fi
    ;;
esac

echo ""
echo "$APP installed successfully."
echo "Run '$APP' in a new terminal session to begin."
