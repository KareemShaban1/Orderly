# QR Order System - Complete System Flows & Dashboards Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Application Architecture](#application-architecture)
3. [User Roles & Access](#user-roles--access)
4. [Frontend Applications](#frontend-applications)
5. [Complete User Flows](#complete-user-flows)
6. [API Endpoints](#api-endpoints)
7. [Dashboard Links & Navigation](#dashboard-links--navigation)
8. [System Workflows](#system-workflows)

---

## System Overview

The QR Order System is a comprehensive SaaS platform for restaurants and cafés in Egypt that enables:
- QR-based table ordering
- Real-time kitchen management
- Digital payments
- Multi-tenant organization management
- Analytics and reporting

**Base URL**: `http://localhost:8000` (Backend API)

---

## Application Architecture

### Backend
- **Framework**: Laravel 12+
- **Port**: 8000
- **Database**: MySQL
- **Real-time**: Laravel Echo + Pusher/WebSockets

### Frontend Applications

| Application | Port | URL | Purpose |
|------------|------|-----|---------|
| **Guest App (PWA)** | 5173 | http://localhost:5173 | Customer ordering interface |
| **Admin Dashboard** | 5174 | http://localhost:5174 | Restaurant management |
| **Kitchen Panel** | 5175 | http://localhost:5175 | Kitchen display system |
| **Landing Page** | 5176 | http://localhost:5176 | Public restaurant discovery |

---

## User Roles & Access

### 1. **Super Admin** (`super_admin`)
- Full system access
- Manage all organizations
- Manage subscription plans
- Manage locations (governorates, cities, areas)
- System-wide analytics

### 2. **Tenant Admin** (`tenant_admin`)
- Manage their own organization
- Manage branches and tables
- Manage menu
- View orders and analytics
- Configure settings

### 3. **Manager** (`manager`)
- Similar to tenant admin
- Can manage kitchen staff
- Access to analytics

### 4. **Kitchen Staff** (`kitchen_staff`)
- View and update orders
- Update order item status
- Kitchen display system access

### 5. **Waiter** (`waiter`)
- Limited order management
- Table management

### 6. **Guest/Customer** (No authentication required)
- Browse restaurants
- Scan QR codes
- Place orders
- Track order status
- Make payments

---

## Frontend Applications

### 1. Landing Page (Port 5176)
**URL**: http://localhost:5176

#### Routes
- `/` - Home page (Organization listing)
- `/organizations/:slug` - Individual organization page

#### Features
- Organization discovery
- Search and filter by location (governorate, city, area)
- Organization registration
- User login
- View organization details and branches

#### User Flow
```
1. Visit Landing Page (/)
   ↓
2. Browse Organizations
   - Search by name
   - Filter by governorate/city/area
   ↓
3. Click Organization
   → View Organization Details (/organizations/:slug)
   ↓
4. Options:
   - Register New Organization
   - Login to Existing Account
   - View Organization Menu (if available)
```

---

### 2. Guest App - PWA (Port 5173)
**URL**: http://localhost:5173

#### Routes
- `/` - Landing page
- `/login` - Customer login
- `/signup` - Customer signup
- `/scan` - QR code scanner
- `/order/:qrCode` - Table scan via QR code
- `/menu/:tableId` - Menu browsing
- `/order-status/:orderId` - Order tracking
- `/payment/:orderId` - Payment processing
- `/receipt/:orderId` - Digital receipt

#### Features
- QR code scanning
- Menu browsing with categories
- Shopping cart
- Order placement
- Real-time order status tracking
- Payment processing
- Digital receipts
- PWA support (offline capable)

#### Customer Flow
```
1. Scan QR Code at Table
   → /order/:qrCode
   ↓
2. Table Detected
   → /menu/:tableId
   ↓
3. Browse Menu
   - Select items
   - Customize (extras, notes)
   - Add to cart
   ↓
4. Place Order
   → Order created
   → /order-status/:orderId
   ↓
5. Track Order (Real-time)
   - Pending → Preparing → Ready
   ↓
6. Payment
   → /payment/:orderId
   - Multiple payment methods
   ↓
7. Receipt
   → /receipt/:orderId
```

---

### 3. Admin Dashboard (Port 5174)
**URL**: http://localhost:5174

#### Routes

##### Public Routes
- `/login` - Admin login

##### Protected Routes (Requires Authentication)
- `/` - Redirects to `/dashboard`
- `/dashboard` - Main dashboard with statistics
- `/branches` - Branch management
- `/menu` - Menu management (categories & items)
- `/orders` - Order management
- `/analytics` - Analytics and reports
- `/settings` - Restaurant settings

##### Super Admin Routes (Requires `super_admin` role)
- `/super-admin/organizations` - Organizations management
- `/super-admin/locations` - Locations management

#### Features by Page

##### Dashboard (`/dashboard`)
- Today's orders and revenue
- Weekly statistics
- Monthly statistics
- Recent activity
- Quick actions

##### Branches (`/branches`)
- List all branches
- Create new branch
- Edit branch details
- Delete branch
- Generate tables with QR codes
- View branch statistics

##### Menu Management (`/menu`)
- **Categories**:
  - Create/edit/delete categories
  - Bilingual support (EN/AR)
  - Sort order management
- **Menu Items**:
  - Create/edit/delete items
  - Price management
  - Image upload
  - Size options
  - Add-ons/extras
  - Preparation type (kitchen/bar/both)
  - Availability toggle

##### Orders (`/orders`)
- View all orders
- Filter by status
- Order details
- Order history
- Payment status

##### Analytics (`/analytics`)
- Dashboard statistics
- Popular items ranking
- Peak hours analysis
- Sales reports (daily/weekly/monthly)
- Revenue tracking

##### Settings (`/settings`)
- Tax rate configuration
- Service charge rate
- Currency settings
- Language settings
- Color customization
- Welcome messages (EN/AR)
- Payment gateway configuration

##### Super Admin - Organizations (`/super-admin/organizations`)
- List all organizations
- Search and filter organizations
- Create new organization
- Edit organization details
- Manage subscription plans
- Set subscription dates
- Toggle active/inactive status
- View organization statistics
- Delete organizations

##### Super Admin - Locations (`/super-admin/locations`)
- Manage governorates
- Manage cities (by governorate)
- Manage areas (by city/governorate)
- Location statistics
- Hierarchical location structure

#### Navigation Structure

**For Tenant Admin/Manager:**
```
Dashboard
├── Dashboard
├── Branches
├── Menu
├── Orders
├── Analytics
└── Settings
```

**For Super Admin:**
```
Dashboard
├── Dashboard
├── Branches
├── Menu
├── Orders
├── Analytics
├── Settings
├── Organizations (Super Admin)
└── Locations (Super Admin)
```

---

### 4. Kitchen Panel (Port 5175)
**URL**: http://localhost:5175

#### Routes
- `/login` - Kitchen staff login
- `/` - Kitchen dashboard (protected)

#### Features
- Real-time order display
- Order status updates
- Item status updates
- Filter by preparation type (all/kitchen/bar)
- Sound notifications for new orders
- Auto-refresh toggle
- Order statistics (pending/preparing/ready)

#### Kitchen Staff Flow
```
1. Login
   → /login
   ↓
2. Kitchen Dashboard (/)
   - View all active orders
   - Filter by preparation type
   ↓
3. Order Management
   - View order details
   - Update item status:
     * Pending → Preparing
     * Preparing → Ready
     * Ready → Completed
   ↓
4. Real-time Updates
   - New orders appear automatically
   - Sound notification (optional)
   - Status changes sync in real-time
```

---

## Complete User Flows

### Flow 1: Organization Registration Flow

```
1. Landing Page (/)
   ↓
2. Click "Register Organization"
   ↓
3. Fill Organization Form:
   - Organization name
   - Organization email
   - Phone, address
   - Subscription plan (starter/professional/enterprise)
   - Admin user details (name, email, password)
   ↓
4. Submit Registration
   ↓
5. Organization Created
   - 14-day trial period
   - Default settings created
   - Admin user created
   ↓
6. Auto-login to Admin Dashboard
   → http://localhost:5174/dashboard
```

### Flow 2: Customer Ordering Flow

```
1. Customer at Restaurant Table
   ↓
2. Scan QR Code
   → Opens Guest App
   → /order/:qrCode
   ↓
3. Table Detected
   → /menu/:tableId
   ↓
4. Browse Menu
   - View categories
   - Select items
   - Customize items (extras, notes)
   - Add to cart
   ↓
5. Review Cart
   - Check items
   - Review total
   ↓
6. Place Order
   → Order created
   → Real-time notification to kitchen
   → /order-status/:orderId
   ↓
7. Track Order (Real-time)
   - Pending
   - Preparing
   - Ready
   ↓
8. Order Ready
   → Notification to customer
   ↓
9. Payment
   → /payment/:orderId
   - Select payment method
   - Process payment
   ↓
10. Receipt
    → /receipt/:orderId
    - Digital receipt
    - Order summary
```

### Flow 3: Kitchen Order Processing Flow

```
1. New Order Created
   → Real-time notification to Kitchen Panel
   ↓
2. Kitchen Staff Views Order
   → Kitchen Dashboard (/)
   ↓
3. Filter Orders
   - All orders
   - Kitchen items only
   - Bar items only
   ↓
4. Process Order Items
   - Start preparing item
   - Mark item as ready
   - Complete item
   ↓
5. Order Status Updates
   - Real-time sync with customer
   - Admin dashboard updated
   ↓
6. All Items Ready
   → Order marked as ready
   → Customer notified
```

### Flow 4: Admin Restaurant Setup Flow

```
1. Login to Admin Dashboard
   → http://localhost:5174/login
   ↓
2. Dashboard Overview
   → /dashboard
   ↓
3. Setup Branches
   → /branches
   - Create branch
   - Add location details
   - Set operating hours
   ↓
4. Generate Tables
   → Select branch
   - Generate tables with QR codes
   - Download QR codes
   ↓
5. Setup Menu
   → /menu
   - Create categories
   - Add menu items
   - Set prices
   - Configure add-ons
   ↓
6. Configure Settings
   → /settings
   - Set tax rate
   - Configure payment methods
   - Customize colors
   - Set welcome messages
   ↓
7. Ready for Orders
   → System operational
```

### Flow 5: Super Admin Management Flow

```
1. Login as Super Admin
   → http://localhost:5174/login
   ↓
2. Access Super Admin Section
   → Sidebar shows additional menu items
   ↓
3. Manage Organizations
   → /super-admin/organizations
   - View all organizations
   - Create new organization
   - Edit subscription plans
   - Activate/deactivate organizations
   - View statistics
   ↓
4. Manage Locations
   → /super-admin/locations
   - Add governorates
   - Add cities (by governorate)
   - Add areas (by city)
   - View location statistics
   ↓
5. System Monitoring
   → /dashboard
   - System-wide analytics
   - Organization statistics
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api
```

### Public Endpoints (No Authentication)

#### Organizations
- `GET /organizations` - List all active organizations
- `GET /organizations/{slug}` - Get organization by slug
- `GET /governorates` - Get all governorates
- `GET /cities` - Get cities (optional: ?governorate=)
- `GET /areas` - Get areas (optional: ?city=, ?governorate=)

#### Table & Menu
- `GET /table/{qrCode}` - Get table by QR code
- `GET /menu/{tableId}` - Get menu for table

#### Orders
- `POST /orders` - Create new order
- `GET /orders/{orderId}/status` - Get order status

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/register-organization` - Organization registration

### Protected Endpoints (Requires Authentication)

#### Authentication
- `POST /auth/logout` - Logout
- `GET /auth/user` - Get current user

#### Admin Endpoints (Requires: `tenant_admin`, `super_admin`, or `manager`)

##### Tenants
- `GET /admin/tenants` - List tenants
- `POST /admin/tenants` - Create tenant
- `GET /admin/tenants/{id}` - Get tenant
- `PUT /admin/tenants/{id}` - Update tenant
- `DELETE /admin/tenants/{id}` - Delete tenant

##### Branches
- `GET /admin/branches` - List branches (filtered by tenant)
- `POST /admin/branches` - Create branch
- `GET /admin/branches/{id}` - Get branch
- `PUT /admin/branches/{id}` - Update branch
- `DELETE /admin/branches/{id}` - Delete branch
- `POST /admin/branches/{branch}/tables/generate` - Generate tables

##### Tables
- `GET /admin/tables` - List tables
- `POST /admin/tables` - Create table
- `GET /admin/tables/{id}` - Get table
- `PUT /admin/tables/{id}` - Update table
- `DELETE /admin/tables/{id}` - Delete table
- `POST /admin/tables/{table}/regenerate-qr` - Regenerate QR code
- `GET /admin/tables/{table}/download-qr` - Download QR code

##### Menu Categories
- `GET /admin/menu-categories` - List categories
- `POST /admin/menu-categories` - Create category
- `GET /admin/menu-categories/{id}` - Get category
- `PUT /admin/menu-categories/{id}` - Update category
- `DELETE /admin/menu-categories/{id}` - Delete category

##### Menu Items
- `GET /admin/menu-items` - List items
- `POST /admin/menu-items` - Create item
- `GET /admin/menu-items/{id}` - Get item
- `PUT /admin/menu-items/{id}` - Update item
- `DELETE /admin/menu-items/{id}` - Delete item

##### Item Addons
- `GET /admin/item-addons` - List addons
- `POST /admin/item-addons` - Create addon
- `GET /admin/item-addons/{id}` - Get addon
- `PUT /admin/item-addons/{id}` - Update addon
- `DELETE /admin/item-addons/{id}` - Delete addon

##### Settings
- `GET /admin/settings` - Get settings
- `PUT /admin/settings` - Update settings

#### Kitchen Endpoints (Requires: `kitchen_staff` or `manager`)
- `GET /kitchen/orders` - Get orders for kitchen
- `PUT /kitchen/orders/{order}/status` - Update order status
- `PUT /kitchen/order-items/{orderItem}/status` - Update order item status

#### Orders
- `GET /orders` - List orders
- `GET /orders/{id}` - Get order
- `PUT /orders/{id}` - Update order
- `DELETE /orders/{id}` - Delete order

#### Payments
- `POST /orders/{orderId}/payment` - Process payment
- `GET /orders/{orderId}/payments` - Get order payments
- `GET /orders/{orderId}/bill` - Request bill

#### Analytics (Requires: `tenant_admin`, `manager`, or `super_admin`)
- `GET /analytics/dashboard` - Dashboard statistics
- `GET /analytics/popular-items` - Popular items
- `GET /analytics/peak-hours` - Peak hours analysis
- `GET /analytics/sales-report` - Sales report

#### Super Admin Endpoints (Requires: `super_admin`)

##### Organizations
- `GET /super-admin/organizations` - List all organizations
- `POST /super-admin/organizations` - Create organization
- `GET /super-admin/organizations/{id}` - Get organization
- `PUT /super-admin/organizations/{id}` - Update organization
- `DELETE /super-admin/organizations/{id}` - Delete organization
- `GET /super-admin/organizations/{id}/statistics` - Get organization stats

##### Locations
- `GET /super-admin/locations/governorates` - List governorates
- `POST /super-admin/locations/governorates` - Add governorate
- `GET /super-admin/locations/cities` - List cities
- `POST /super-admin/locations/cities` - Add city
- `GET /super-admin/locations/areas` - List areas
- `POST /super-admin/locations/areas` - Add area
- `GET /super-admin/locations/statistics` - Location statistics

---

## Dashboard Links & Navigation

### Landing Page (Port 5176)
**URL**: http://localhost:5176

#### Main Navigation
- **Home** (`/`) - Organization listing
- **Register Organization** - Organization registration modal
- **Login** - User login modal
- **Organization Details** (`/organizations/:slug`) - Individual organization page

---

### Guest App (Port 5173)
**URL**: http://localhost:5173

#### Navigation Flow
```
Landing (/) 
  → Scan QR (/scan or /order/:qrCode)
    → Menu (/menu/:tableId)
      → Order Status (/order-status/:orderId)
        → Payment (/payment/:orderId)
          → Receipt (/receipt/:orderId)
```

---

### Admin Dashboard (Port 5174)
**URL**: http://localhost:5174

#### Main Navigation (Sidebar)

**For Tenant Admin/Manager:**
1. **Dashboard** (`/dashboard`)
   - Statistics overview
   - Recent activity
   - Quick actions

2. **Branches** (`/branches`)
   - Branch list
   - Create/Edit/Delete branches
   - Generate tables

3. **Menu** (`/menu`)
   - Categories management
   - Menu items management
   - Addons management

4. **Orders** (`/orders`)
   - Order list
   - Order details
   - Order history

5. **Analytics** (`/analytics`)
   - Dashboard stats
   - Popular items
   - Peak hours
   - Sales reports

6. **Settings** (`/settings`)
   - Restaurant configuration
   - Payment settings
   - Appearance settings

**For Super Admin (Additional):**
7. **Organizations** (`/super-admin/organizations`)
   - All organizations list
   - Create/Edit/Delete organizations
   - Subscription management

8. **Locations** (`/super-admin/locations`)
   - Governorates management
   - Cities management
   - Areas management

#### Header Navigation
- User profile dropdown
- Logout button
- Current page title

---

### Kitchen Panel (Port 5175)
**URL**: http://localhost:5175

#### Navigation
- **Login** (`/login`) - Kitchen staff login
- **Dashboard** (`/`) - Kitchen display system

#### Dashboard Features
- Order cards display
- Filter buttons (All/Kitchen/Bar)
- Sound toggle
- Auto-refresh toggle
- Statistics cards (Pending/Preparing/Ready)

---

## System Workflows

### Workflow 1: Complete Order Lifecycle

```
┌─────────────┐
│   Customer  │
│  Scans QR   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Table Detected │
│  Menu Loaded    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Customer Adds  │
│  Items to Cart  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Order Placed   │
│  (Status: Pending)
└──────┬──────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│   Kitchen   │    │ Admin Panel  │
│  Notified   │    │  Updated     │
│  (Real-time)│    │  (Real-time) │
└──────┬──────┘    └──────────────┘
       │
       ▼
┌─────────────────┐
│ Kitchen Starts  │
│  Preparing      │
│  (Status: Preparing)
└──────┬──────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│   Customer  │    │ Admin Panel  │
│  Notified   │    │  Updated     │
│  (Real-time)│    │  (Real-time) │
└──────┬──────┘    └──────────────┘
       │
       ▼
┌─────────────────┐
│ Items Ready     │
│  (Status: Ready)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Customer Pays   │
│  Receives Receipt
└─────────────────┘
```

### Workflow 2: Restaurant Setup Workflow

```
1. Organization Registration
   ↓
2. Admin Login
   ↓
3. Create Branch
   - Add location details
   - Set operating hours
   ↓
4. Generate Tables
   - Create tables
   - Generate QR codes
   - Download QR codes
   ↓
5. Setup Menu
   - Create categories
   - Add menu items
   - Set prices
   - Configure addons
   ↓
6. Configure Settings
   - Tax rates
   - Payment methods
   - Appearance
   ↓
7. System Ready
   - QR codes placed on tables
   - Menu available
   - Orders can be placed
```

### Workflow 3: Super Admin Management Workflow

```
1. Super Admin Login
   ↓
2. View All Organizations
   - Monitor subscriptions
   - Check status
   ↓
3. Manage Organizations
   - Create new organizations
   - Update subscription plans
   - Activate/deactivate
   ↓
4. Manage Locations
   - Add governorates
   - Add cities
   - Add areas
   ↓
5. System Monitoring
   - View analytics
   - Monitor system health
```

---

## Quick Access Links

### Development URLs

| Application | URL | Login Required |
|------------|-----|----------------|
| Landing Page | http://localhost:5176 | No |
| Guest App | http://localhost:5173 | No (for ordering) |
| Admin Dashboard | http://localhost:5174 | Yes |
| Kitchen Panel | http://localhost:5175 | Yes |
| Backend API | http://localhost:8000 | No (for public endpoints) |

### Direct Dashboard Links

#### Admin Dashboard
- Login: http://localhost:5174/login
- Dashboard: http://localhost:5174/dashboard
- Branches: http://localhost:5174/branches
- Menu: http://localhost:5174/menu
- Orders: http://localhost:5174/orders
- Analytics: http://localhost:5174/analytics
- Settings: http://localhost:5174/settings

#### Super Admin (requires super_admin role)
- Organizations: http://localhost:5174/super-admin/organizations
- Locations: http://localhost:5174/super-admin/locations

#### Kitchen Panel
- Login: http://localhost:5175/login
- Dashboard: http://localhost:5175/

#### Landing Page
- Home: http://localhost:5176/
- Organization: http://localhost:5176/organizations/{slug}

---

## Authentication & Authorization

### Authentication Flow
1. User submits credentials
2. Backend validates credentials
3. Returns JWT token (Sanctum)
4. Token stored in localStorage
5. Token included in API requests

### Role-Based Access Control

| Role | Guest App | Admin Dashboard | Kitchen Panel | Super Admin |
|------|-----------|-----------------|---------------|-------------|
| Guest | ✅ Full | ❌ | ❌ | ❌ |
| Waiter | ✅ Full | ⚠️ Limited | ❌ | ❌ |
| Kitchen Staff | ✅ Full | ❌ | ✅ Full | ❌ |
| Manager | ✅ Full | ✅ Full | ✅ Full | ❌ |
| Tenant Admin | ✅ Full | ✅ Full | ✅ Full | ❌ |
| Super Admin | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

---

## Real-time Features

### WebSocket Channels

#### Kitchen Channel
- Channel: `kitchen.{branchId}`
- Events:
  - `.order.created` - New order notification
  - `.order.status.updated` - Order status change

#### Order Channel
- Channel: `order.{orderId}`
- Events:
  - `.status.updated` - Status change notification

---

## Data Flow Summary

```
Customer (Guest App)
  ↓
  Places Order
  ↓
Backend API
  ↓
  ├─→ Database (Order Stored)
  ├─→ Kitchen Panel (Real-time Notification)
  ├─→ Admin Dashboard (Real-time Update)
  └─→ Customer (Order Status Update)
```

---

## System Status & Health

### Health Check Endpoints
- Backend: `GET http://localhost:8000/api/health` (if implemented)
- Frontend: Each app runs independently

### Monitoring Points
1. **Backend API**: Port 8000
2. **Database**: MySQL connection
3. **WebSocket**: Pusher connection
4. **Frontend Apps**: Ports 5173-5176

---

## Support & Troubleshooting

### Common Access Points
- **Can't access admin?** → Check user role in database
- **Kitchen not updating?** → Check WebSocket connection
- **QR code not working?** → Verify table exists and is active
- **Orders not appearing?** → Check branch_id and tenant_id

### Default Test Credentials
Refer to `COMPLETION_SUMMARY.md` for test user credentials.

---

## Version Information

- **Backend**: Laravel 12+
- **Frontend**: React 18+ with TypeScript
- **Database**: MySQL 8.0+
- **Real-time**: Laravel Echo + Pusher

---

**Last Updated**: 2024
**Documentation Version**: 1.0








