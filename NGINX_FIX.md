# Nginx Configuration Fix

## Problem
The `/api/auth` endpoint returns 404 because Nginx isn't routing API requests to `index.php`.

## Solution
Update your Nginx `/api` location block to use a rewrite rule:

```nginx
# API endpoints
location /api {
    root /var/www/html/salestracking/backend;
    
    # Rewrite all /api/* requests to /api/index.php
    rewrite ^/api/(.*)$ /api/index.php last;
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    # CORS headers
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    if ($request_method = OPTIONS) {
        return 204;
    }
}
```

## Steps to Apply

1. Edit your Nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/default
   # or wherever your config is
   ```

2. Replace the `/api` location block with the one above

3. Test the configuration:
   ```bash
   sudo nginx -t
   ```

4. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

5. Test the API:
   ```bash
   curl -X POST http://localhost/api/auth \
     -H "Content-Type: application/json" \
     -d '{"action":"login","email":"admin@example.com","password":"admin123"}'
   ```

6. Restart your Vite dev server:
   ```bash
   cd admin
   npm run dev
   ```

