# How to Show Restaurant Page for Customers to Scan QR Codes and Order

## Overview

The restaurant/organization page is already implemented and shows:
- Organization information (name, logo, contact)
- All branches with their details
- **Tables with QR codes for each branch**
- Options to scan QR codes or enter table codes manually

## Access the Restaurant Page

### URL Format
```
https://orderly.kareemsoft.org/organizations/{slug}
```

Example:
```
https://orderly.kareemsoft.org/organizations/cairo-restaurant-dy7GSb
```

### How Customers Access It

1. **From Landing Page**: Search and click on a restaurant
2. **Direct Link**: Share the organization URL
3. **From Table Scan**: After scanning a QR code, click "View Menu & Order" button

## What the Page Shows

### 1. Organization Header
- Restaurant/Organization name
- Logo
- Contact information (email, phone)

### 2. Branches Section
For each branch, displays:
- Branch name and address
- Location (area, city, governorate)
- Phone number
- Opening hours
- **Tables with QR Codes** (if available)

### 3. Tables & QR Codes
Each branch shows:
- Grid of table QR codes
- Table number and capacity
- Clickable QR code images
- Quick links to each table

### 4. Order Section
- **Table Code Input**: Customers can manually enter table code
- **Scan QR Code Button**: Opens QR scanner
- Instructions and tips

## Features for Customers

### Option 1: Scan QR Code from Page
1. Customer visits organization page
2. Scrolls to their branch
3. Finds their table QR code
4. Clicks on the QR code image
5. Redirected to menu/order page

### Option 2: Scan with Camera
1. Customer clicks "📱 Scan QR Code with Camera" button
2. Opens QR scanner
3. Scans QR code at their table
4. Redirected to menu/order page

### Option 3: Enter Table Code Manually
1. Customer enters table code (e.g., `TBL-XXXXXXXX`)
2. Clicks "Go to Menu"
3. Redirected to menu/order page

## How QR Codes Work

### QR Code URL Format
```
https://orderly.kareemsoft.org/order/{qr_code}
```

Example:
```
https://orderly.kareemsoft.org/order/TBL-1C5A3626
```

### What Happens When QR Code is Scanned
1. Customer scans QR code
2. Redirected to `/order/{qr_code}`
3. Guest app validates table
4. Shows table confirmation
5. Customer clicks "View Menu & Order"
6. Redirected to menu page
7. Customer can browse menu and place order

## Backend API

The organization data comes from:
```
GET /api/organizations/{slug}
```

Returns:
- Organization details
- Branches with tables
- Table QR codes and URLs

## Frontend Implementation

### File Location
```
frontend/landing/src/pages/OrganizationPage.tsx
```

### Key Features
- Fetches organization data from API
- Displays branches and tables
- Shows QR code images
- Provides multiple ways to access menu:
  - Click QR code
  - Scan with camera
  - Enter table code manually

## Enhancements Made

### 1. Enhanced Order Section
- Added table code input field
- Added "Go to Menu" button
- Better instructions for customers

### 2. Improved QR Code Display
- Clickable QR code images
- Quick links to tables
- Better visual presentation

### 3. Multiple Access Methods
- Direct QR code click
- Camera scanner
- Manual table code entry

## Testing

### Test the Page
1. Visit: `https://orderly.kareemsoft.org/organizations/{slug}`
2. Verify organization info displays
3. Check branches show tables with QR codes
4. Test clicking a QR code
5. Test entering table code manually
6. Test "Scan QR Code" button

### Test QR Code Flow
1. Click a QR code on the page
2. Should redirect to `/order/{qr_code}`
3. Should show table confirmation
4. Should allow ordering

## Customization

### Change QR Code Display
Edit `frontend/landing/src/pages/OrganizationPage.tsx`:
- Modify grid layout (currently 2-3 columns)
- Change QR code size
- Add/remove table information

### Change Order Section
- Modify table code input
- Change button text
- Add more instructions

## Result

Customers can now:
1. ✅ Visit restaurant page
2. ✅ See all branches and tables
3. ✅ View QR codes for each table
4. ✅ Click QR codes to order
5. ✅ Scan QR codes with camera
6. ✅ Enter table code manually
7. ✅ Access menu and place orders

The restaurant page is fully functional and provides multiple ways for customers to scan QR codes and order!

