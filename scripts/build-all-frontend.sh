#!/usr/bin/env bash
# Build all frontend apps (guest, admin, kitchen, landing).
# Run from repo root on the server, e.g.:
#   cd /var/www/qr-order && ./scripts/build-all-frontend.sh
# Or from anywhere:
#   /var/www/qr-order/scripts/build-all-frontend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"

# Optional: set web server user for chown after build (e.g. www-data, www)
RUN_AS_USER="${RUN_AS_USER:-}"

cd "$REPO_ROOT"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: frontend directory not found at $FRONTEND_DIR"
  exit 1
fi

echo "=========================================="
echo "Building all frontends"
echo "=========================================="
echo "Repo root: $REPO_ROOT"
echo ""

# Install root deps if needed
if [ -f "$REPO_ROOT/package.json" ] && [ ! -d "$REPO_ROOT/node_modules" ]; then
  echo "Installing root dependencies..."
  npm install
  echo ""
fi

# Install dependencies in each app and build all
cd "$FRONTEND_DIR"
echo "Installing dependencies (guest, admin, kitchen, landing)..."
npm run install:all
echo ""
echo "Running build:all (guest, admin, kitchen, landing)..."
npm run build:all

echo ""
echo "=========================================="
echo "Build complete"
echo "=========================================="

# Optional: fix ownership for web server
if [ -n "$RUN_AS_USER" ]; then
  echo "Setting ownership to $RUN_AS_USER..."
  for app in guest admin kitchen landing; do
    if [ -d "$FRONTEND_DIR/$app/dist" ]; then
      chown -R "$RUN_AS_USER" "$FRONTEND_DIR/$app/dist"
      chmod -R 755 "$FRONTEND_DIR/$app/dist"
      find "$FRONTEND_DIR/$app/dist" -type f -exec chmod 644 {} \;
      echo "  $app/dist"
    fi
  done
  echo "Done."
fi

echo ""
echo "Outputs:"
echo "  guest:  $FRONTEND_DIR/guest/dist"
echo "  admin:  $FRONTEND_DIR/admin/dist"
echo "  kitchen: $FRONTEND_DIR/kitchen/dist"
echo "  landing: $FRONTEND_DIR/landing/dist"
