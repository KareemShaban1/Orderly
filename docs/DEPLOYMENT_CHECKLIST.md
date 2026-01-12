# Deployment Checklist for Contabo Server

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] Contabo VPS server provisioned
- [ ] SSH access to server configured
- [ ] Domain name purchased and DNS access available
- [ ] Pusher account created (for real-time features)
- [ ] Email service configured (Mailtrap, SendGrid, etc.)

## Server Setup

- [ ] System updated (`sudo apt update && sudo apt upgrade`)
- [ ] PHP 8.2+ installed with all required extensions
- [ ] Composer installed globally
- [ ] Node.js 18+ and npm installed
- [ ] MySQL 8.0+ installed and secured
- [ ] Nginx installed
- [ ] Redis installed and running
- [ ] PM2 installed (optional, for process management)
- [ ] Firewall (UFW) configured

## Project Setup

- [ ] Project files uploaded to `/var/www/qr-order`
- [ ] File permissions set correctly
- [ ] Database created
- [ ] Database user created with proper permissions

## Backend Configuration

- [ ] Backend dependencies installed (`composer install`)
- [ ] `.env` file created from `.env.example`
- [ ] Database credentials configured in `.env`
- [ ] `APP_KEY` generated (`php artisan key:generate`)
- [ ] `APP_ENV=production` set
- [ ] `APP_DEBUG=false` set
- [ ] `APP_URL` set to production domain
- [ ] Pusher credentials configured
- [ ] Redis configured for cache/queues
- [ ] Mail configuration set
- [ ] Migrations run (`php artisan migrate --force`)
- [ ] Seeders run (if needed)
- [ ] Storage link created (`php artisan storage:link`)
- [ ] Laravel optimized (`config:cache`, `route:cache`, `view:cache`)

## Frontend Configuration

- [ ] API URLs updated in all frontend apps
- [ ] Guest app built (`npm run build`)
- [ ] Admin app built (`npm run build`)
- [ ] Kitchen app built (`npm run build`)
- [ ] Landing app built (`npm run build`)
- [ ] All build outputs in `dist` folders

## Nginx Configuration

- [ ] API server block configured
- [ ] Guest app server block configured
- [ ] Admin app server block configured
- [ ] Kitchen app server block configured
- [ ] Landing app server block configured
- [ ] All sites enabled
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded/restarted

## SSL Certificates

- [ ] Certbot installed
- [ ] SSL certificate obtained for main domain
- [ ] SSL certificate obtained for API subdomain
- [ ] SSL certificate obtained for admin subdomain
- [ ] SSL certificate obtained for kitchen subdomain
- [ ] Auto-renewal configured

## Services & Workers

- [ ] Queue worker service created and enabled
- [ ] Scheduler service created and enabled
- [ ] Queue worker running
- [ ] Scheduler running
- [ ] PHP-FPM running
- [ ] Nginx running
- [ ] MySQL running
- [ ] Redis running

## DNS Configuration

- [ ] A record for main domain → Server IP
- [ ] A record for www → Server IP
- [ ] A record for api subdomain → Server IP
- [ ] A record for admin subdomain → Server IP
- [ ] A record for kitchen subdomain → Server IP
- [ ] DNS propagation verified

## Testing

- [ ] API accessible (https://api.yourdomain.com)
- [ ] Guest app accessible (https://yourdomain.com)
- [ ] Admin dashboard accessible (https://admin.yourdomain.com)
- [ ] Kitchen panel accessible (https://kitchen.yourdomain.com)
- [ ] Landing page accessible (https://www.yourdomain.com)
- [ ] Database connection working
- [ ] Authentication working
- [ ] QR code scanning working
- [ ] Order placement working
- [ ] Real-time updates working
- [ ] Payment processing working (if configured)

## Security

- [ ] Firewall enabled and configured
- [ ] SSH key authentication set up
- [ ] Root login disabled (if using sudo user)
- [ ] Strong database passwords set
- [ ] `.env` file permissions restricted (600)
- [ ] `APP_DEBUG=false` in production
- [ ] SSL certificates valid
- [ ] Regular backups configured

## Monitoring & Maintenance

- [ ] Log rotation configured
- [ ] Monitoring tools set up (optional)
- [ ] Backup strategy implemented
- [ ] Update procedure documented
- [ ] Emergency contact information documented

## Post-Deployment

- [ ] All applications tested end-to-end
- [ ] Performance monitoring active
- [ ] Error logging verified
- [ ] Backup system tested
- [ ] Team access configured
- [ ] Documentation updated

## Troubleshooting Notes

Document any issues encountered and their solutions:

1. 
2. 
3. 

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Server IP**: _______________
**Domain**: _______________

