#!/bin/bash

# Script to start/reload Nginx on Contabo/BT Panel servers

echo "=========================================="
echo "Nginx Service Management"
echo "=========================================="
echo ""

# Try different methods to start/reload nginx

# Method 1: systemctl (standard)
echo "Method 1: Trying systemctl..."
if systemctl start nginx 2>/dev/null; then
    echo "✅ Nginx started with systemctl"
    systemctl status nginx --no-pager | head -5
    exit 0
fi

# Method 2: service command
echo "Method 2: Trying service command..."
if service nginx start 2>/dev/null; then
    echo "✅ Nginx started with service"
    service nginx status | head -5
    exit 0
fi

# Method 3: Direct nginx command (BT Panel)
echo "Method 3: Trying direct nginx command..."
if /www/server/nginx/sbin/nginx 2>/dev/null; then
    echo "✅ Nginx started directly"
    exit 0
fi

# Method 4: BT Panel command
echo "Method 4: Trying BT Panel command..."
if /etc/init.d/nginx start 2>/dev/null; then
    echo "✅ Nginx started with init.d"
    exit 0
fi

echo ""
echo "❌ Could not start Nginx automatically"
echo ""
echo "Try manually:"
echo "  /www/server/nginx/sbin/nginx"
echo "  or"
echo "  systemctl start nginx"
echo "  or"
echo "  service nginx start"

