# How to Start the Servers

## Quick Start

You need to run **3 servers** for the application to work:

### 1. PHP Backend Server (Port 8000)

Open a terminal and run:
```bash
cd /var/www/html/salestracking
./start-backend.sh
```

Or manually:
```bash
cd backend
php -S localhost:8000 -t api
```

The backend API will be available at `http://localhost:8000`

### 2. Admin Dashboard (Port 3000)

Open another terminal and run:
```bash
cd admin
npm run dev
```

The admin dashboard will be available at `http://localhost:3000`

### 3. Mobile App (Port 3001)

Open another terminal and run:
```bash
cd mobile
npm run dev
```

The mobile app will be available at `http://localhost:3001`

## Troubleshooting

### Error: 500 Internal Server Error

**Cause:** The PHP backend server is not running on port 8000.

**Solution:** Start the PHP backend server first (see step 1 above).

### Error: Connection Refused

**Cause:** The backend server is not running or the port is incorrect.

**Solution:** 
1. Check if the backend is running: `ps aux | grep "php -S"`
2. Make sure port 8000 is not used by another application
3. Start the backend server

### Error: Database Connection Failed

**Cause:** MySQL is not running or database credentials are incorrect.

**Solution:**
1. Start MySQL: `sudo service mysql start` or `sudo systemctl start mysql`
2. Check database credentials in `backend/config/database.php`
3. Verify database exists: `mysql -u nikhil -p -e "SHOW DATABASES;"`

## Verify Everything is Running

1. **Backend API:** Open `http://localhost:8000/api` - should show `{"message":"Edubricz Sales Tracking API"}`
2. **Admin Dashboard:** Open `http://localhost:3000` - should show login page
3. **Mobile App:** Open `http://localhost:3001` - should show login page

## Default Login Credentials

- **Email:** `admin@example.com`
- **Password:** `admin123`

