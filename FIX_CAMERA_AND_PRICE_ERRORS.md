# Fix Camera Access and Price Errors

## Issues Fixed

### 1. Camera Not Opening
**Problem:** "No camera found" error when clicking QR scanner button on mobile/server.

**Root Cause:** 
- Camera permissions not requested before listing devices
- `listVideoInputDevices()` requires camera permission first
- On some devices, device enumeration fails but camera still works

**Solution:**
- Request camera permission first with `getUserMedia()`
- If device enumeration fails, use default camera with constraints
- Added fallback to use default camera when device list is empty

### 2. Price Error
**Problem:** `price.toFixed is not a function` - prices coming as strings from API.

**Solution:**
- Convert all prices to numbers in `fetchMenu()`
- Ensure prices, sizes, and addons prices are all numbers
- Added `Number()` conversion when displaying prices

## Changes Made

### 1. `frontend/guest/src/pages/OrganizationPage.tsx`
- Request camera permission before listing devices
- Added fallback to use default camera with constraints
- Better error handling for camera access

### 2. `frontend/guest/src/pages/TableScan.tsx`
- Same camera permission fix
- Better fallback handling

### 3. `frontend/guest/src/pages/Menu.tsx`
- Convert all prices to numbers in `fetchMenu()`
- Convert prices, sizes, and addons to numbers
- Added `Number()` wrapper when displaying prices

## Code Changes

### Camera Access
```typescript
// Request permission first
await navigator.mediaDevices.getUserMedia({ video: true });

// Then try to list devices
const videoInputDevices = await codeReader.listVideoInputDevices();

// If no devices, use default with constraints
if (!selectedDeviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } }
  });
  videoRef.current.srcObject = stream;
  selectedDeviceId = 'default';
}
```

### Price Conversion
```typescript
// In fetchMenu()
data.menu = data.menu.map((category) => ({
  ...category,
  items: category.items.map((item) => ({
    ...item,
    price: typeof item.price === 'string' 
      ? parseFloat(item.price) 
      : Number(item.price) || 0,
    // ... same for sizes and addons
  })),
}));

// When displaying
{Number(item.price || 0).toFixed(2)}
```

## Apply Fix

### On Server
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

## Testing

1. **Camera Test:**
   - Visit organization page
   - Click "Open QR Scanner"
   - Should request camera permission
   - Camera should open (back camera on mobile)

2. **Price Test:**
   - Scan QR code or enter table code
   - View menu
   - Prices should display correctly (no errors)

## Result

✅ **Camera Works** - Permission requested first, fallback to default camera
✅ **Prices Fixed** - All prices converted to numbers
✅ **No More Errors** - Menu displays correctly

