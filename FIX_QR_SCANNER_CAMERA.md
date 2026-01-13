# Fix QR Scanner Camera Access Error

## Problem
Getting error: "Can't enumerate devices, method not supported" when clicking "Scan QR Code" button.

## Root Cause
Camera access requires HTTPS in modern browsers (except localhost). The error occurs because:
1. The site is accessed via HTTP instead of HTTPS
2. `listVideoInputDevices()` fails when not in a secure context
3. Browser security restrictions block camera enumeration

## Solution Applied

Updated `frontend/guest/src/pages/TableScan.tsx` with:
1. **HTTPS check** - Detects if site is served over HTTPS
2. **Better error handling** - Graceful fallback when device enumeration fails
3. **Permission check** - Requests camera permission before scanning
4. **Fallback to default camera** - Uses default camera if enumeration fails
5. **Better error messages** - Clear messages explaining the issue

## Changes Made

### 1. Added HTTPS Check
```typescript
const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (!isSecureContext) {
  setError('Camera access requires HTTPS. Please access this site via HTTPS...');
  return;
}
```

### 2. Added Fallback for Device Enumeration
```typescript
try {
  const videoInputDevices = await codeReader.listVideoInputDevices();
  selectedDeviceId = videoInputDevices[0].deviceId;
} catch (listError) {
  // Fallback: use default camera (undefined = default)
  selectedDeviceId = undefined;
}
```

### 3. Added Permission Check
```typescript
await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
```

## Required: Enable HTTPS

**The main fix is to enable HTTPS on your server.** Camera access requires HTTPS in production.

### Option 1: Use Let's Encrypt (Free SSL)

```bash
# Install certbot (if not installed)
apt-get update
apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d orderly.kareemsoft.org

# Auto-renewal (certbot sets this up automatically)
```

### Option 2: Use BT Panel SSL

If using Baota Panel:
1. Go to website management
2. Click on your domain
3. Enable SSL
4. Use Let's Encrypt or upload your certificate

### Option 3: Update Nginx Config for HTTPS

After getting SSL certificate, update `nginx-orderly-config.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name orderly.kareemsoft.org;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name orderly.kareemsoft.org;
    return 301 https://$server_name$request_uri;
}
```

## After Enabling HTTPS

1. **Rebuild guest app:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
   npm run build
   ```

2. **Test QR scanner:**
   - Access via `https://orderly.kareemsoft.org`
   - Click "Scan QR Code"
   - Should request camera permission
   - Should work correctly

## Temporary Workaround

Until HTTPS is enabled, users can:
1. **Use manual table code entry** - Enter the table code manually (e.g., `TBL-XXXXXXXX`)
2. **Access via localhost** - Works on localhost without HTTPS

## Browser Compatibility

- ✅ **Chrome/Edge**: Requires HTTPS (except localhost)
- ✅ **Firefox**: Requires HTTPS (except localhost)
- ✅ **Safari**: Requires HTTPS (except localhost)
- ✅ **Mobile browsers**: All require HTTPS

## Error Messages

The updated code now shows helpful error messages:
- "Camera access requires HTTPS" - When accessed via HTTP
- "Camera permission denied" - When user denies permission
- "No camera found" - When no camera is available
- "Camera access is not available" - When browser doesn't support it

## Testing

After enabling HTTPS:

1. **Test on desktop:**
   - Open `https://orderly.kareemsoft.org`
   - Click "Scan QR Code"
   - Allow camera permission
   - Should show camera feed

2. **Test on mobile:**
   - Open `https://orderly.kareemsoft.org` on mobile
   - Click "Scan QR Code"
   - Allow camera permission
   - Should work with mobile camera

## Next Steps

1. **Enable HTTPS** on your server (most important!)
2. **Rebuild guest app** with the updated code
3. **Test QR scanner** via HTTPS
4. **Update QR codes** if needed (they should already point to the correct domain)

The code fix improves error handling, but **HTTPS is required** for camera access to work in production.

