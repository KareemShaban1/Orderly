# Rebuild All Frontend Apps

After updating React Router basename configurations, rebuild all frontend apps.

## Updated Apps

1. ✅ **Admin App** - Added `basename="/admin"`
2. ✅ **Kitchen App** - Added `basename="/kitchen"`
3. ✅ **Landing App** - Added `basename="/landing"`
4. ⚪ **Guest App** - No basename needed (served at root `/`)

## Rebuild Commands

Run these commands on your server:

```bash
# Navigate to frontend directory
cd /www/wwwroot/orderly.kareemsoft.org/frontend

# Rebuild Admin App
echo "Building Admin App..."
cd admin
npm run build
cd ..

# Rebuild Kitchen App
echo "Building Kitchen App..."
cd kitchen
npm run build
cd ..

# Rebuild Landing App
echo "Building Landing App..."
cd landing
npm run build
cd ..

# Guest App (optional - only if you made changes)
echo "Building Guest App..."
cd guest
npm run build
cd ..

echo "All apps rebuilt successfully!"
```

## One-Liner Script

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend && \
for app in admin kitchen landing; do \
  echo "Building $app..."; \
  cd $app && npm run build && cd ..; \
done && \
echo "✅ All apps rebuilt!"
```

## Verify Builds

After rebuilding, verify each app:

```bash
BASE_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend"

# Check Admin
echo "=== Admin ==="
ls -lh $BASE_PATH/admin/dist/index.html
head -5 $BASE_PATH/admin/dist/index.html

# Check Kitchen
echo "=== Kitchen ==="
ls -lh $BASE_PATH/kitchen/dist/index.html
head -5 $BASE_PATH/kitchen/dist/index.html

# Check Landing
echo "=== Landing ==="
ls -lh $BASE_PATH/landing/dist/index.html
head -5 $BASE_PATH/landing/dist/index.html

# Check Guest
echo "=== Guest ==="
ls -lh $BASE_PATH/guest/dist/index.html
head -5 $BASE_PATH/guest/dist/index.html
```

## Fix Permissions

After rebuilding, fix permissions:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend

for app in admin kitchen landing guest; do
  if [ -d "$app/dist" ]; then
    echo "Fixing permissions for $app..."
    chown -R www:www $app/dist
    chmod -R 755 $app/dist
    find $app/dist -type f -exec chmod 644 {} \;
  fi
done

echo "✅ Permissions fixed for all apps"
```

## Test URLs

After rebuilding and fixing permissions, test:

- Admin: `http://orderly.kareemsoft.org/admin/`
- Kitchen: `http://orderly.kareemsoft.org/kitchen/`
- Landing: `http://orderly.kareemsoft.org/landing/`
- Guest: `http://orderly.kareemsoft.org/`

## Complete Rebuild Script

Save this as `rebuild-all.sh`:

```bash
#!/bin/bash

BASE_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend"
cd $BASE_PATH

echo "=========================================="
echo "Rebuilding All Frontend Apps"
echo "=========================================="
echo ""

APPS=("admin" "kitchen" "landing" "guest")

for app in "${APPS[@]}"; do
    if [ -d "$app" ]; then
        echo "Building $app..."
        cd $app
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "  Installing dependencies..."
            npm install
        fi
        
        # Build
        npm run build
        
        if [ $? -eq 0 ]; then
            echo "  ✅ $app built successfully"
            
            # Fix permissions
            if [ -d "dist" ]; then
                chown -R www:www dist
                chmod -R 755 dist
                find dist -type f -exec chmod 644 {} \;
                echo "  ✅ Permissions fixed"
            fi
        else
            echo "  ❌ $app build failed"
        fi
        
        cd ..
        echo ""
    else
        echo "⚠️  $app directory not found"
    fi
done

echo "=========================================="
echo "Rebuild Complete"
echo "=========================================="
echo ""
echo "Test URLs:"
echo "  Admin:   http://orderly.kareemsoft.org/admin/"
echo "  Kitchen: http://orderly.kareemsoft.org/kitchen/"
echo "  Landing: http://orderly.kareemsoft.org/landing/"
echo "  Guest:   http://orderly.kareemsoft.org/"
```

Make it executable and run:

```bash
chmod +x rebuild-all.sh
./rebuild-all.sh
```

