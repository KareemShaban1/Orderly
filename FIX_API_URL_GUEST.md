# Fix API URL in Guest App

## Problem
The guest app is trying to call `http://localhost:8000/api/table/TBL-1C5A3626` instead of the production API URL.

## Root Cause
The `VITE_API_URL` environment variable is not set in the guest app, so it defaults to `http://localhost:8000`.

## Solution

### Step 1: Create/Update .env File

Create or update `/www/wwwroot/orderly.kareemsoft.org/frontend/guest/.env`:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://orderly.kareemsoft.org
EOF
```

Or if using HTTPS (recommended):
```bash
cat > .env << 'EOF'
VITE_API_URL=https://orderly.kareemsoft.org
EOF
```

### Step 2: Rebuild Guest App

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

### Step 3: Verify

After rebuilding, check the built files to ensure the API URL is correct:

```bash
# Check if API URL is in the built files
grep -r "orderly.kareemsoft.org" dist/ | head -5
```

### Step 4: Test

1. Open browser console (F12)
2. Navigate to `https://orderly.kareemsoft.org/order/TBL-1C5A3626`
3. Check Network tab - should see request to `http://orderly.kareemsoft.org/api/table/TBL-1C5A3626` (or https)

## Alternative: Update API Client

If you can't set environment variables, you can hardcode the API URL in `frontend/guest/src/api/client.ts`:

```typescript
// Change from:
const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// To:
const envUrl = import.meta.env.VITE_API_URL || 'http://orderly.kareemsoft.org';
```

Then rebuild:
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

## Quick Fix Script

```bash
#!/bin/bash

cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest

echo "Setting VITE_API_URL..."
echo "VITE_API_URL=http://orderly.kareemsoft.org" > .env

echo "Rebuilding guest app..."
npm run build

echo "✅ Done! Guest app rebuilt with correct API URL"
```

## Important Notes

1. **Environment variables** must be set BEFORE building (Vite embeds them at build time)
2. **After changing .env**, you MUST rebuild the app
3. **For HTTPS**, use `https://orderly.kareemsoft.org` in the .env file
4. **Check browser console** to see what API URL is being used

## Verify API Endpoint Works

Before fixing the frontend, test the API directly:

```bash
curl http://orderly.kareemsoft.org/api/table/TBL-1C5A3626
```

Should return JSON with table data.

