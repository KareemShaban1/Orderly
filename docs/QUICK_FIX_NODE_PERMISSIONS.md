# Quick Fix for Node.js Permission Denied

## Problem
Getting `Permission denied` when running `npm run build`:
```
sh: /www/wwwroot/orderly.kareemsoft.org/frontend/admin/node_modules/.bin/tsc: Permission denied
```

## Solution

### Quick Fix (Run on Server)

```bash
# Fix permissions for all frontend apps
cd /www/wwwroot/orderly.kareemsoft.org/frontend

# Make all .bin files executable
find . -path "*/node_modules/.bin/*" -type f -exec chmod +x {} \;

# Or fix specific app
cd admin
chmod +x node_modules/.bin/*
cd ..
```

### Alternative: Reinstall Node Modules

If permissions are too messed up:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/admin

# Remove node_modules
rm -rf node_modules

# Reinstall (this will set correct permissions)
npm install

# Now build should work
npm run build
```

### Fix All Apps at Once

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend

for app in admin kitchen guest landing; do
    if [ -d "$app" ]; then
        echo "Fixing $app..."
        cd $app
        chmod +x node_modules/.bin/* 2>/dev/null
        cd ..
    fi
done
```

### Using the Script

```bash
# Upload fix-node-permissions.sh to server
chmod +x fix-node-permissions.sh
./fix-node-permissions.sh
```

## Why This Happens

When files are copied/extracted or permissions are changed, executable files lose their execute bit. Node.js binaries in `node_modules/.bin/` need to be executable.

## After Fixing

Try building again:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/admin
npm run build
```

Should work now! ✅



