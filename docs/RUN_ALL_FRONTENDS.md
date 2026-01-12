# Running All Frontends Together

This project has four frontend applications, all located in the `frontend/` directory:
- **Guest** (Customer-facing PWA) - Port 5173
- **Admin** (Restaurant management) - Port 5174
- **Kitchen** (Kitchen display) - Port 5175
- **Landing** (Public landing page) - Port 5176

## Quick Start

### 1. Install Dependencies (First Time Only)

Run this command from the `frontend/` directory to install all dependencies:

```bash
cd frontend
npm run install:all
```

Or install manually:
```bash
# Guest app
cd frontend/guest && npm install && cd ../..

# Admin dashboard
cd frontend/admin && npm install && cd ../..

# Kitchen panel
cd frontend/kitchen && npm install && cd ../..

# Landing page
cd frontend/landing && npm install && cd ../..
```

### 2. Run All Frontends Together

From the `frontend/` directory, run:

```bash
npm run dev:all
```

This will start all four frontend applications simultaneously:
- Guest App: http://localhost:5173
- Admin Dashboard: http://localhost:5174
- Kitchen Panel: http://localhost:5175
- Landing Page: http://localhost:5176

### 3. Run Individual Frontends

If you only want to run one frontend:

```bash
# From frontend/ directory

# Guest app only
npm run dev:guest

# Admin dashboard only
npm run dev:admin

# Kitchen panel only
npm run dev:kitchen

# Landing page only
npm run dev:landing
```

Or run directly from each app's directory:
```bash
cd frontend/guest && npm run dev
cd frontend/admin && npm run dev
cd frontend/kitchen && npm run dev
cd frontend/landing && npm run dev
```

## Port Configuration

Each frontend runs on a different port to avoid conflicts:

- **Guest App**: Port 5173 (configured in `frontend/guest/vite.config.ts`)
- **Admin Dashboard**: Port 5174 (configured in `frontend/admin/vite.config.ts`)
- **Kitchen Panel**: Port 5175 (configured in `frontend/kitchen/vite.config.ts`)
- **Landing Page**: Port 5176 (configured in `frontend/landing/vite.config.ts`)

## Building for Production

To build all frontends for production:

```bash
cd frontend
npm run build:all
```

This will create production builds in each frontend's `dist` directory:
- `frontend/guest/dist/`
- `frontend/admin/dist/`
- `frontend/kitchen/dist/`
- `frontend/landing/dist/`

## Project Structure

```
frontend/
├── guest/          # Customer PWA app (Port 5173)
├── admin/          # Admin dashboard (Port 5174)
├── kitchen/        # Kitchen display panel (Port 5175)
├── landing/        # Public landing page (Port 5176)
├── package.json    # Root package.json for managing all apps
└── README.md       # Frontend documentation
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:
1. Check which process is using the port
2. Kill that process or change the port in the respective `vite.config.ts` file

### Dependencies Not Installed

If you get module not found errors:
1. Make sure you've run `npm run install:all` from the `frontend/` directory
2. Or install dependencies in each app directory individually
3. Check that `node_modules` exists in each frontend directory

### Concurrently Not Found

If you get an error about `concurrently`:
```bash
cd frontend
npm install
```

## Development Workflow

1. **Start Backend**: Make sure Laravel backend is running on port 8000
2. **Start Frontends**: Run `npm run dev:all` from `frontend/` directory
3. **Access Apps**:
   - Guest: http://localhost:5173
   - Admin: http://localhost:5174
   - Kitchen: http://localhost:5175
   - Landing: http://localhost:5176
