# Quick Setup Guide

## Step 1: Database Setup

```bash
# Create database and import schema
mysql -u root -p < database/schema.sql

# Or manually:
# 1. Create database: CREATE DATABASE sales_tracking;
# 2. Import: mysql -u root -p sales_tracking < database/schema.sql
```

## Step 2: Configure Backend

Edit `backend/config/database.php` or set environment variables:
- DB_HOST=localhost
- DB_NAME=sales_tracking
- DB_USER=root
- DB_PASS=your_password

## Step 3: Install Dependencies

```bash
# Install admin dashboard dependencies
cd admin
npm install

# Install mobile app dependencies
cd ../mobile
npm install

# Go back to root
cd ..
```

## Step 4: Start Servers

### Terminal 1: PHP Backend
```bash
cd backend
php -S localhost:8000 -t api
```

### Terminal 2: Admin Dashboard
```bash
cd admin
npm run dev
# Access at http://localhost:3000
```

### Terminal 3: Mobile App
```bash
cd mobile
npm run dev
# Access at http://localhost:3001
```

## Step 5: Create Uploads Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

## Step 6: Login

### Admin Dashboard
- URL: http://localhost:3000
- Email: admin@example.com
- Password: admin123

### Mobile App
- URL: http://localhost:3001
- Create a salesperson account through admin dashboard first

## Quick Test

1. Login to admin dashboard
2. Add an area (e.g., "Chandra Layout")
3. Add a school/college in that area
4. Create a user with role "salesperson"
5. Create a route for today with the salesperson and school
6. Login to mobile app with salesperson credentials
7. View route and update visit status

## Troubleshooting

### Port Already in Use
- Change ports in `vite.config.js` files
- Or kill the process using the port

### Database Connection Error
- Check MySQL is running: `sudo service mysql start`
- Verify credentials in `backend/config/database.php`

### CORS Errors
- Ensure backend is running on port 8000
- Check `backend/config/cors.php` settings

### File Upload Fails
- Create `uploads/` directory manually
- Set proper permissions: `chmod 755 uploads`

