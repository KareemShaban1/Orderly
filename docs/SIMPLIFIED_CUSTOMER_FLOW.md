# Simplified Customer Flow

## Overview
The customer flow has been simplified to keep everything in one app (guest app) - no more switching between ports or apps!

## New Simple Flow

### 1. **Organizations List** (`/` or `/organizations`)
- Shows all active organizations
- Search functionality
- Click on any organization to view its page

### 2. **Organization Page** (`/organization/:slug`)
- Shows organization details
- **Built-in QR Scanner** - scan QR code directly from this page
- Manual table code input
- Shows branches and locations
- When QR is scanned or code entered → goes directly to menu

### 3. **Table Confirmation** (`/order/:qrCode`)
- Shows table details after scanning
- "View Menu" button → goes directly to menu

### 4. **Menu & Order** (`/menu/:tableId`)
- Browse menu, add items, place order
- All within the same app

## Routes

```
/                          → Organizations List
/organizations             → Organizations List (same)
/organization/:slug        → Organization Page with QR Scanner
/scan                      → QR Scanner (standalone)
/order/:qrCode             → Table Confirmation
/menu/:tableId             → Menu & Order
/order-status/:orderId     → Order Status
/payment/:orderId          → Payment
/receipt/:orderId          → Receipt
```

## Key Changes

### ✅ Everything in Guest App
- No more Blade views
- No more port switching
- All navigation within React Router

### ✅ Simple Navigation
1. Start → Organizations List
2. Click Organization → Organization Page
3. Scan QR or Enter Code → Menu
4. Order → Done

### ✅ QR Scanner Built-in
- QR scanner is now part of Organization Page
- No need to navigate to separate scan page
- Direct flow: Scan → Menu

## API Endpoints Used

- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:slug` - Get single organization
- `GET /api/table/:qrCode` - Get table by QR code
- `GET /api/menu/:tableId` - Get menu for table

## Benefits

1. **Simpler UX** - One app, clear flow
2. **No Port Switching** - Everything on same port
3. **Faster** - Direct navigation, no redirects
4. **Mobile Friendly** - All features in one responsive app
5. **Easy to Understand** - Clear path: List → Organization → Scan → Menu

## Testing

### Local
```bash
cd frontend/guest
npm run dev
# Visit http://localhost:5173
```

### Production
- All routes work on same domain
- No need for separate backend Blade views
- Everything served from guest app

## Migration Notes

- Removed dependency on Blade view (`/restaurant/:slug`)
- Removed "View Menu & Order" redirect to backend
- TableScan now goes directly to menu
- Organization page has integrated QR scanner

