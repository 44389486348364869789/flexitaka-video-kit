#!/usr/bin/env bash
# ============================================================================
#  install-deps.sh — system dependencies for the video kit
# ----------------------------------------------------------------------------
#  Installs everything render.sh needs: node, npm, ffmpeg and Chromium.
#  Written for Debian/Ubuntu. On macOS use `brew install node ffmpeg` plus
#  `brew install --cask chromium`, then export CHROME_PATH to the binary.
#
#     sudo ./install-deps.sh
# ============================================================================
set -euo pipefail

echo "Installing system dependencies (Debian/Ubuntu)..."
apt-get update
apt-get install -y nodejs npm ffmpeg chromium fonts-dejavu-core

echo
echo "Done. Versions:"
node -v  || true
npm -v   || true
ffmpeg -version | head -1 || true
if [ -x /usr/bin/chromium ]; then echo "chromium: /usr/bin/chromium"; else
  echo "chromium: NOT at /usr/bin/chromium — set CHROME_PATH to its real path"; fi
