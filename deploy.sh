#!/bin/bash

# QR Order System - Deployment Script for Contabo
# Run this script on your Contabo server after initial setup

set -e

echo "🚀 Starting QR Order System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Project directory
PROJECT_DIR="/var/www/orderly"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${GREEN}Step 1: Setting up directories...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo -e "${GREEN}Step 2: Setting permissions...${NC}"
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

if [ -d "$BACKEND_DIR" ]; then
    echo -e "${GREEN}Step 3: Setting backend permissions...${NC}"
    chmod -R 775 $BACKEND_DIR/storage
    chmod -R 775 $BACKEND_DIR/bootstrap/cache
    chown -R www-data:www-data $BACKEND_DIR/storage
    chown -R www-data:www-data $BACKEND_DIR/bootstrap/cache
fi

echo -e "${GREEN}Step 4: Installing backend dependencies...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    cd $BACKEND_DIR
    composer install --optimize-autoloader --no-dev --no-interaction
    echo -e "${GREEN}Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}Backend directory not found, skipping...${NC}"
fi

echo -e "${GREEN}Step 5: Building frontend applications...${NC}"
if [ -d "$FRONTEND_DIR" ]; then
    cd $FRONTEND_DIR
    
    # Build Guest App
    if [ -d "guest" ]; then
        echo -e "${GREEN}Building Guest App...${NC}"
        cd guest
        npm install --production
        npm run build
        cd ..
    fi
    
    # Build Admin App
    if [ -d "admin" ]; then
        echo -e "${GREEN}Building Admin App...${NC}"
        cd admin
        npm install --production
        npm run build
        cd ..
    fi
    
    # Build Kitchen App
    if [ -d "kitchen" ]; then
        echo -e "${GREEN}Building Kitchen App...${NC}"
        cd kitchen
        npm install --production
        npm run build
        cd ..
    fi
    
    # Build Landing App
    if [ -d "landing" ]; then
        echo -e "${GREEN}Building Landing App...${NC}"
        cd landing
        npm install --production
        npm run build
        cd ..
    fi
    
    echo -e "${GREEN}All frontend apps built${NC}"
else
    echo -e "${YELLOW}Frontend directory not found, skipping...${NC}"
fi

echo -e "${GREEN}Step 6: Optimizing Laravel...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    cd $BACKEND_DIR
    
    if [ -f ".env" ]; then
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
        echo -e "${GREEN}Laravel optimized${NC}"
    else
        echo -e "${YELLOW}.env file not found. Please configure it first.${NC}"
    fi
fi

echo -e "${GREEN}Step 7: Restarting services...${NC}"
systemctl restart php8.2-fpm 2>/dev/null || systemctl restart php8.1-fpm 2>/dev/null || echo "PHP-FPM restart skipped"
systemctl reload nginx 2>/dev/null || echo "Nginx reload skipped"
systemctl restart orderly-queue 2>/dev/null || echo "Queue worker restart skipped"
systemctl restart orderly-scheduler 2>/dev/null || echo "Scheduler restart skipped"

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  1. Configure .env file in backend directory"
echo "  2. Run migrations: php artisan migrate --force"
echo "  3. Set up SSL certificates with certbot"
echo "  4. Configure DNS records"
echo "  5. Test all applications"

