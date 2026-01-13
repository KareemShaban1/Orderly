# Fix Node.js Version Error

## Problem
Getting error: `SyntaxError: Unexpected token ?` when running `npm run build`

This means Node.js version is too old. TypeScript requires Node.js 14+.

## Check Current Node.js Version

```bash
node -v
npm -v
```

## Solution: Upgrade Node.js

### Option 1: Using NVM (Recommended)

```bash
# Install NVM if not installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 18 LTS (recommended)
nvm install 18

# Use Node.js 18
nvm use 18

# Set as default
nvm alias default 18

# Verify
node -v
# Should show: v18.x.x or higher
```

### Option 2: Using NodeSource Repository

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify
node -v
npm -v
```

### Option 3: Using BT Panel (If using Baota Panel)

1. Go to BT Panel → Software Store
2. Search for "Node.js"
3. Install Node.js 18 or higher
4. Set as default

## After Upgrading

```bash
# Verify Node.js version
node -v
# Should be v14.x.x or higher (v18.x.x recommended)

# Rebuild guest app
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

## Minimum Requirements

- **Node.js**: v14.0.0 or higher (v18 LTS recommended)
- **npm**: v6.0.0 or higher (comes with Node.js)

## Quick Fix Script

```bash
#!/bin/bash

echo "=== Checking Node.js Version ==="
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)

if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version is too old (current: $(node -v 2>/dev/null || echo 'not found'))"
    echo ""
    echo "Installing Node.js 18 LTS..."
    
    # Install NVM
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Install Node.js 18
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    echo "✅ Node.js 18 installed"
    echo "   Version: $(node -v)"
else
    echo "✅ Node.js version is OK: $(node -v)"
fi

echo ""
echo "=== Rebuilding Guest App ==="
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

Run it:
```bash
chmod +x fix-node-version.sh
./fix-node-version.sh
```

## Verify After Upgrade

```bash
# Check versions
node -v
npm -v

# Should show:
# node: v18.x.x or higher
# npm: v9.x.x or higher
```

## If Still Having Issues

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Reinstall dependencies:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Check TypeScript version:**
   ```bash
   npx tsc --version
   ```

The main issue is the Node.js version. Upgrade to Node.js 18 LTS and the build should work.

