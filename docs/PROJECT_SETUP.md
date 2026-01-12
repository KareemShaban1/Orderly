# QR Ordering System - Project Setup Guide

## Overview

This is a comprehensive SaaS platform for restaurants and cafés in Egypt that enables QR-based table ordering, real-time kitchen management, and digital payments.

## Project Structure

```
qr-order/
├── backend/          # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/         # React + TypeScript PWA (Guest Interface)
│   ├── src/
│   │   ├── pages/
│   │   ├── api/
│   │   └── App.tsx
└── README.md
```

## Features Implemented

### ✅ Completed
1. **Backend Structure**
   - Multi-tenant database schema
   - Models with relationships
   - API controllers (Auth, Menu, Order, Table, Admin, Kitchen)
   - QR Code generation service
   - API routes

2. **Frontend Structure**
   - React + TypeScript setup
   - Table scanning interface
   - Menu browsing with categories
   - Shopping cart functionality
   - Order status tracking
   - Arabic/English language support (basic)

3. **Database Schema**
   - Tenants (restaurants)
   - Branches
   - Tables with QR codes
   - Menu categories & items
   - Orders & order items
   - Payments
   - Restaurant settings

### 🚧 In Progress / To Do
1. **Authentication & Authorization**
   - Role-based middleware
   - Sanctum token management
   - Permission system

2. **Admin Dashboard**
   - Tenant management
   - Branch & table management
   - Menu management (CRUD)
   - Settings configuration
   - Analytics dashboard

3. **Kitchen Panel**
   - Real-time order display
   - Order status updates
   - Preparation time tracking

4. **Real-time Updates**
   - WebSocket integration (Laravel Echo + Pusher)
   - Live order status updates

5. **Payment Integration**
   - Paymob integration
   - Vodafone Cash
   - Apple Pay
   - Cash handling

6. **PWA Features**
   - Service worker
   - Offline support
   - Install prompt

7. **Analytics & Reports**
   - Sales reports
   - Popular items
   - Peak hours
   - Revenue analytics

## Getting Started

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- MySQL 8.0+
- Redis (optional, for queues)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
```

4. Update `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=qr_order
DB_USERNAME=root
DB_PASSWORD=
```

5. Run migrations:
```bash
php artisan migrate
```

6. Start the server:
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
```

4. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Public Endpoints
- `GET /api/table/{qrCode}` - Get table by QR code
- `GET /api/menu/{tableId}` - Get menu for table
- `POST /api/orders` - Create order
- `GET /api/orders/{orderId}/status` - Get order status

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout (protected)
- `GET /api/auth/user` - Get current user (protected)

### Admin Endpoints (Protected)
- `GET /api/admin/tenants` - List tenants
- `POST /api/admin/branches` - Create branch
- `POST /api/admin/branches/{id}/tables/generate` - Generate tables with QR codes
- `GET /api/admin/menu-categories` - List categories
- `POST /api/admin/menu-items` - Create menu item

### Kitchen Endpoints (Protected)
- `GET /api/kitchen/orders` - Get orders for kitchen
- `PUT /api/kitchen/orders/{id}/status` - Update order status

## Database Schema

### Key Tables
- **tenants** - Restaurant owners
- **branches** - Restaurant locations
- **tables** - Dining tables with QR codes
- **menu_categories** - Menu categories
- **menu_items** - Menu items with prices
- **item_addons** - Add-ons/extras
- **orders** - Customer orders
- **order_items** - Order line items
- **payments** - Payment transactions
- **restaurant_settings** - Tenant settings

## Next Steps

1. **Complete Authentication**
   - Implement role middleware
   - Add permission checks

2. **Build Admin Dashboard**
   - Create React admin app
   - Implement CRUD operations
   - Add settings management

3. **Kitchen Panel**
   - Real-time order display
   - Status update interface

4. **Real-time Updates**
   - Set up Laravel Echo
   - Configure Pusher/WebSockets
   - Implement broadcasting

5. **Payment Integration**
   - Integrate Paymob
   - Add payment processing
   - Handle payment callbacks

6. **PWA Features**
   - Add service worker
   - Implement offline mode
   - Add install prompt

7. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

## Configuration

### QR Code Generation
QR codes are generated automatically when tables are created. The QR code contains a URL pointing to the ordering interface:
```
{FRONTEND_URL}/order/{QR_CODE}
```

### Multi-language Support
The system supports English and Arabic. Language can be toggled in the frontend interface.

## Support

For issues or questions, please refer to the documentation or contact the development team.













