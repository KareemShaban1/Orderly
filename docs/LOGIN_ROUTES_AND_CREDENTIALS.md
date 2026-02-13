# Login Routes and Default Credentials

This document provides all login routes/pages across the QR Order System with default test credentials.

## Overview

The QR Order System has **4 frontend applications**, each serving different user roles:

1. **Guest App** (Port 5173) - Customer-facing PWA (No login required)
2. **Admin Dashboard** (Port 5174) - Restaurant management
3. **Kitchen Panel** (Port 5175) - Kitchen display system
4. **Landing Page** (Port 5176) - Public restaurant discovery & organization management

---

## 1. Admin Dashboard Login

### Route
- **Development**: `http://localhost:5174/admin/login`
- **Production**: `https://yourdomain.com/admin/login`

### Purpose
Restaurant administrators, managers, and super admins use this dashboard to:
- Manage branches, menus, orders
- View analytics and reports
- Configure restaurant settings
- Access POS system
- Manage staff

### Default Credentials

#### Super Admin
```
Email: admin@qroder.com
Password: password
Role: super_admin
Access: Full system access, can manage all tenants
```

#### Tenant Admin (Demo Restaurant)
```
Email: admin@cairorestaurant.com
Password: password
Role: tenant_admin
Tenant: Cairo Restaurant
Access: Full access to their restaurant's data
```

### API Endpoint
- **POST** `/api/auth/login`
- **Body**: `{ "email": "admin@cairorestaurant.com", "password": "password" }`

### Protected Routes
After login, users are redirected to `/admin/dashboard`. All routes except `/admin/login` require authentication.

---

## 2. Kitchen Panel Login

### Route
- **Development**: `http://localhost:5175/kitchen/login`
- **Production**: `https://yourdomain.com/kitchen/login`

### Purpose
Kitchen staff use this panel to:
- View incoming orders
- Update order item status (preparing, ready)
- Track order preparation times
- View order details and special instructions

### Default Credentials

#### Kitchen Staff (Demo Restaurant)
```
Email: kitchen@cairorestaurant.com
Password: password
Role: kitchen_staff
Tenant: Cairo Restaurant
Branch: Main Branch
Access: View and update orders for their branch
```

### API Endpoint
- **POST** `/api/auth/login`
- **Body**: `{ "email": "kitchen@cairorestaurant.com", "password": "password" }`

### Protected Routes
After login, users are redirected to `/kitchen/` (kitchen dashboard). All routes except `/kitchen/login` require authentication.

---

## 3. Landing Page - Organization Login

### Route
- **Development**: `http://localhost:5176/login-organization`
- **Production**: `https://yourdomain.com/login-organization`

### Purpose
Restaurant owners use this page to:
- Login to their organization account
- Access organization management features
- Register new organizations

### Default Credentials

#### Tenant Admin (Same as Admin Dashboard)
```
Email: admin@cairorestaurant.com
Password: password
Role: tenant_admin
Tenant: Cairo Restaurant
```

### API Endpoint
- **POST** `/api/auth/login`
- **Body**: `{ "email": "admin@cairorestaurant.com", "password": "password" }`

### Related Routes
- `/register-organization` - Register a new organization
- `/` - Home page (organization listing)
- `/organizations/:slug` - View organization details

---

## 4. Guest App (Customer PWA)

### Route
- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`

### Purpose
**No login required** - Customers use this app to:
- Scan QR codes at tables
- Browse restaurant menus
- Place orders
- Track order status
- Make payments
- View receipts

### Authentication
- **No authentication required** for basic ordering
- Optional customer accounts may be added in the future

### Routes
- `/` - Organizations list
- `/scan` - QR code scanner
- `/order/:qrCode` - Table scan via QR code
- `/menu/:tableId` - Menu browsing
- `/order-status/:orderId` - Order tracking
- `/payment/:orderId` - Payment processing
- `/receipt/:orderId` - Digital receipt

---

## User Roles Summary

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **super_admin** | admin@qroder.com | password | Full system access, manage all tenants |
| **tenant_admin** | admin@cairorestaurant.com | password | Full access to Cairo Restaurant |
| **kitchen_staff** | kitchen@cairorestaurant.com | password | View/update orders for Main Branch |
| **manager** | (create via admin) | password | Branch-level management |
| **waiter** | (create via admin) | password | Limited order management |

---

## Seeding Default Data

To create these default users, run:

```bash
cd backend
php artisan migrate:fresh --seed
```

This will create:
1. **Super Admin** user (`admin@qroder.com`)
2. **Demo Tenant** (Cairo Restaurant) with:
   - Tenant admin user (`admin@cairorestaurant.com`)
   - Kitchen staff user (`kitchen@cairorestaurant.com`)
   - Main branch with 10 tables
   - Sample menu (Appetizers, Main Courses, Beverages)
   - Sample menu items with addons

---

## API Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

### Login Flow
1. **POST** `/api/auth/login` with email and password
2. Receive `{ user: {...}, token: "..." }`
3. Store token in `localStorage` as `auth_token`
4. Include token in subsequent API requests

### Logout
- **POST** `/api/auth/logout` (requires authentication)
- Clears token from server and client

---

## Development URLs Summary

| Application | Port | Login Route | Default User |
|------------|------|-------------|--------------|
| Guest App | 5173 | N/A (no login) | N/A |
| Admin Dashboard | 5174 | `/admin/login` | admin@cairorestaurant.com |
| Kitchen Panel | 5175 | `/kitchen/login` | kitchen@cairorestaurant.com |
| Landing Page | 5176 | `/login-organization` | admin@cairorestaurant.com |

---

## Troubleshooting

### Empty Page After Login
- Check browser console for errors
- Verify API is running (`php artisan serve --port=8001`)
- Check network tab for failed API requests
- Clear browser cache and localStorage

### Invalid Credentials
- Ensure database is seeded: `php artisan migrate:fresh --seed`
- Verify user exists: `php artisan tinker` → `User::where('email', 'admin@cairorestaurant.com')->first()`
- Check password hash matches: `Hash::check('password', $user->password)`

### CORS Issues
- Verify backend CORS config allows frontend origins
- Check `.env` file has correct `FRONTEND_URL`
- Ensure API base URL in frontend matches backend

### Token Expired
- Tokens don't expire by default (using Laravel Sanctum)
- If issues persist, clear localStorage and login again

---

## Security Notes

⚠️ **IMPORTANT**: These are **default test credentials** for development only!

- **Never use these credentials in production**
- Change all default passwords before deploying
- Use strong, unique passwords for production users
- Implement proper password policies
- Consider adding 2FA for admin accounts
- Regularly audit user access and permissions

---

## Additional Resources

- [System Flows and Dashboards](./SYSTEM_FLOWS_AND_DASHBOARDS.md)
- [Project Setup](./PROJECT_SETUP.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated**: February 2026
