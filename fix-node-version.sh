#!/bin/bash

# Fix Node.js version for TypeScript build
# Run this on your server

echo "=========================================="
echo "Node.js Version Check and Upgrade"
echo "=========================================="
echo ""

# Check current Node.js version
CURRENT_NODE=$(node -v 2>/dev/null || echo "not installed")
echo "Current Node.js version: $CURRENT_NODE"

# Extract major version number
NODE_MAJOR=$(echo $CURRENT_NODE | grep -oP 'v\K\d+' | head -1)

if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 14 ]; then
    echo ""
    echo "❌ Node.js version is too old (needs v14+, recommended v18+)"
    echo ""
    echo "Installing Node.js 18 LTS..."
    echo ""
    
    # Check if NVM is installed
    if [ ! -d "$HOME/.nvm" ]; then
        echo "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        
        # Load NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    else
        # Load NVM if already installed
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Install Node.js 18
    echo "Installing Node.js 18 LTS..."
    nvm install 18
    
    # Use Node.js 18
    nvm use 18
    nvm alias default 18
    
    echo ""
    echo "✅ Node.js 18 installed"
    echo "   New version: $(node -v)"
    echo ""
    echo "⚠️  IMPORTANT: You may need to reload your shell or run:"
    echo "   source ~/.bashrc"
    echo "   Or restart your terminal session"
else
    echo "✅ Node.js version is OK"
fi

echo ""
echo "=========================================="
echo "Current Versions"
echo "=========================================="
echo "Node.js: $(node -v 2>/dev/null || echo 'not found')"
echo "npm: $(npm -v 2>/dev/null || echo 'not found')"
echo ""

# Check if versions are sufficient
NODE_MAJOR=$(node -v 2>/dev/null | grep -oP 'v\K\d+' | head -1)
if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -ge 14 ]; then
    echo "✅ Node.js version is sufficient (v$NODE_MAJOR)"
    echo ""
    echo "You can now run:"
    echo "  cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest"
    echo "  npm run build"
else
    echo "❌ Node.js still needs to be upgraded"
    echo ""
    echo "Try:"
    echo "  1. Reload shell: source ~/.bashrc"
    echo "  2. Or restart terminal"
    echo "  3. Then run this script again"
fi

