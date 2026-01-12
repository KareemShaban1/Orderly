# SaaS Smart QR Ordering & Restaurant Management System

A comprehensive SaaS platform for restaurants and cafés in Egypt that enables QR-based table ordering, real-time kitchen management, and digital payments.

## Features

### Guest Experience
- QR scan → web app (PWA)
- Multilingual support (Arabic / English)
- Table auto-detection
- Item customization (extras, notes, removals)
- Real-time order status tracking
- Digital receipt
- Multiple payment methods

### Restaurant Admin Dashboard
- Branch & table management
- Menu management
- Real-time order monitoring
- Kitchen display system (KDS)
- Staff roles & permissions
- Tax & service charge configuration

### Kitchen & Staff Panels
- Live incoming orders
- Order prioritization
- Status updates
- Order history tracking

### Payment & Billing
- Digital invoice generation
- Split bill per table
- Multiple payment methods
- Egyptian payment gateway integration

### Analytics & Reports
- Daily/weekly sales reports
- Most ordered items
- Table turnover rate
- Peak hours analysis
- Revenue per branch

## Tech Stack

- **Backend**: Laravel 12+
- **Frontend**: React 18+ with TypeScript
  - Guest App (PWA): Customer ordering interface
  - Admin Dashboard: Restaurant management
  - Kitchen Panel: Order display system
  - Landing Page: Public restaurant discovery
- **Database**: MySQL
- **Real-time**: Laravel Echo + Pusher/WebSockets
- **QR Codes**: SimpleSoftwareIO/simple-qrcode
- **PWA**: Workbox
- **Styling**: Tailwind CSS

## Project Structure

```
qr-order/
├── backend/          # Laravel API
├── frontend/          # All Frontend Applications
│   ├── guest/        # Customer PWA (Port 5173)
│   ├── admin/        # Admin Dashboard (Port 5174)
│   ├── kitchen/      # Kitchen Panel (Port 5175)
│   └── landing/      # Landing Page (Port 5176)
└── docs/             # Documentation
```

## Getting Started

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- MySQL 8.0+

### Installation

#### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

#### Frontend Setup
```bash
# Install all frontend dependencies
cd frontend
npm run install:all

# Run all frontends simultaneously
npm run dev:all

# Or run individual apps
npm run dev:guest    # Customer PWA (Port 5173)
npm run dev:admin    # Admin Dashboard (Port 5174)
npm run dev:kitchen  # Kitchen Panel (Port 5175)
npm run dev:landing  # Landing Page (Port 5176)
```

See [RUN_ALL_FRONTENDS.md](./RUN_ALL_FRONTENDS.md) for detailed instructions.

## License

Proprietary - All rights reserved



