# QR Order System - Frontend Applications

This directory contains all frontend applications for the QR Order System.

## Applications

### 1. Guest App (`guest/`)
- **Port**: 5173
- **Description**: PWA for customers to scan QR codes, browse menus, and place orders
- **Tech**: React, TypeScript, Vite, PWA

### 2. Admin Dashboard (`admin/`)
- **Port**: 5174
- **Description**: Admin dashboard for restaurant management
- **Tech**: React, TypeScript, Vite, Tailwind CSS

### 3. Kitchen Panel (`kitchen/`)
- **Port**: 5175
- **Description**: Kitchen display system for order management
- **Tech**: React, TypeScript, Vite, Tailwind CSS

### 4. Landing Page (`landing/`)
- **Port**: 5176
- **Description**: Public landing page to discover restaurants
- **Tech**: React, TypeScript, Vite, Tailwind CSS

## Quick Start

### Install all dependencies
```bash
npm run install:all
```

### Run individual apps
```bash
# Guest app
npm run dev:guest

# Admin dashboard
npm run dev:admin

# Kitchen panel
npm run dev:kitchen

# Landing page
npm run dev:landing
```

### Run all apps simultaneously
```bash
npm run dev:all
```

### Build all apps
```bash
npm run build:all
```

## Development URLs

- Guest App: http://localhost:5173
- Admin Dashboard: http://localhost:5174
- Kitchen Panel: http://localhost:5175
- Landing Page: http://localhost:5176

## Project Structure

```
frontend/
├── guest/          # Customer PWA app
├── admin/          # Admin dashboard
├── kitchen/        # Kitchen display panel
├── landing/        # Public landing page
└── package.json    # Root package.json for managing all apps
```











