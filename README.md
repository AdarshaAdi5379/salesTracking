# Edubricz Sales Tracking System

A comprehensive sales tracking system with Admin Dashboard and Mobile App for salespersons to manage routes, visits, and track performance.

## Features

### Admin Dashboard
- Create and manage sales routes
- Select area → automatically load schools/colleges
- Assign visits for each day
- View daily reports with visit statistics
- Track total visits per salesperson
- View visit statuses (Visited / Not Visited / Follow-up / Meeting Scheduled / Invalid Location)
- View uncovered schools/colleges
- Manage users (admin and salespersons)
- Manage schools and colleges

### Salesperson Mobile App
- View today's route with ordered list of schools/colleges
- Navigate using Google Maps
- Update visit status for each location
- Add notes and upload photos
- Auto GPS timestamp (proof of visit)
- Real-time progress tracking

## Technology Stack

- **Frontend (Admin)**: React + Vite
- **Frontend (Mobile)**: React + Vite (Mobile-responsive)
- **Backend**: PHP + MySQL
- **Maps**: Google Maps API integration

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Node.js 16 or higher
- npm or yarn
- Composer (for PHP dependencies)

## Installation

### 1. Database Setup

```bash
# Create database
mysql -u root -p < database/schema.sql
```

Or manually:
1. Create a database named `sales_tracking`
2. Import the schema from `database/schema.sql`

### 2. Backend Setup

```bash
# Install PHP dependencies (if using Composer)
composer install

# Configure database connection
# Edit backend/config/database.php or set environment variables:
# DB_HOST=localhost
# DB_NAME=sales_tracking
# DB_USER=root
# DB_PASS=your_password
```

### 3. Start PHP Server

```bash
# Navigate to backend directory
cd backend

# Start PHP built-in server
php -S localhost:8000 -t api

# Or use Apache/Nginx with proper configuration
```

### 4. Admin Dashboard Setup

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Start development server
npm run dev

# Admin dashboard will be available at http://localhost:3000
```

### 5. Mobile App Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm run dev

# Mobile app will be available at http://localhost:3001
```

## Default Login Credentials

### Admin
- Email: `admin@example.com`
- Password: `admin123`

### Salesperson
- Create a salesperson account through the admin dashboard

## API Endpoints

### Authentication
- `POST /api/auth` - Login/Register

### Areas
- `GET /api/areas` - Get all areas
- `POST /api/areas` - Create area (Admin only)

### Schools
- `GET /api/schools?area_id={id}` - Get schools by area
- `POST /api/schools` - Create school (Admin only)
- `PUT /api/schools/{id}` - Update school (Admin only)
- `DELETE /api/schools/{id}` - Delete school (Admin only)

### Routes
- `GET /api/routes?date={date}` - Get routes by date
- `GET /api/routes/{id}` - Get route details
- `POST /api/routes` - Create route (Admin only)
- `PUT /api/routes/{id}` - Update route (Admin only)
- `DELETE /api/routes/{id}` - Delete route (Admin only)

### Visits
- `GET /api/visits?route_id={id}` - Get visits by route
- `POST /api/visits` - Create/Update visit
- `PUT /api/visits/{id}` - Update visit

### Reports
- `GET /api/reports?type=daily&date={date}` - Daily report
- `GET /api/reports?type=salesperson&salesperson_id={id}` - Salesperson performance
- `GET /api/reports?type=uncovered` - Uncovered schools (Admin only)

### Users
- `GET /api/users` - Get users
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user (Admin only)

### Upload
- `POST /api/upload` - Upload photo (multipart/form-data)

## Project Structure

```
salestracking/
├── backend/
│   ├── api/           # API endpoints
│   ├── config/        # Configuration files
│   └── utils/         # Utility functions
├── admin/             # Admin dashboard (React)
│   └── src/
│       ├── components/
│       └── utils/
├── mobile/            # Mobile app (React)
│   └── src/
│       ├── components/
│       └── utils/
├── database/          # Database schema
└── uploads/           # Uploaded photos (created automatically)
```

## Usage

### Admin Workflow

1. **Login** to admin dashboard
2. **Add Areas** (if not already added)
3. **Add Schools/Colleges** for each area
4. **Create Routes**:
   - Select salesperson
   - Select area
   - Select date
   - Choose schools/colleges to visit
   - Create route
5. **View Reports** to track performance

### Salesperson Workflow

1. **Login** to mobile app
2. **View Today's Route** - See all assigned visits
3. **Navigate** to each location using Google Maps
4. **Update Visit Status**:
   - Mark as Visited/Not Visited/Follow-up/etc.
   - Add notes
   - Upload photo (optional)
   - GPS location is automatically captured
5. **Track Progress** - See completed vs pending visits

## Google Maps Integration

The mobile app uses Google Maps for navigation. To enable full functionality:

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add the API key to the mobile app configuration
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Places API (optional, for auto-route feature)

## File Uploads

Photos are uploaded to the `uploads/` directory. Make sure:
- The directory is writable by the web server
- Maximum file size is 5MB
- Supported formats: JPEG, PNG, GIF, WebP

## Production Deployment

### Backend
- Use a proper web server (Apache/Nginx)
- Configure proper CORS settings
- Use environment variables for sensitive data
- Enable HTTPS
- Set up proper file permissions for uploads

### Frontend
- Build for production: `npm run build`
- Serve static files through web server
- Configure API proxy or CORS

## Troubleshooting

### Database Connection Issues
- Check database credentials in `backend/config/database.php`
- Ensure MySQL is running
- Verify database exists

### CORS Issues
- Check CORS configuration in `backend/config/cors.php`
- Ensure API URL is correct in frontend

### File Upload Issues
- Check `uploads/` directory permissions
- Verify PHP upload settings in `php.ini`

## License

This project is open source and available for use.

## Support

For issues and questions, please contact the development team.



-------------------------- Build Apk --------------------------------


How to Build APK File
Quick Build (Debug APK)
cd /var/www/html/salestracking/mobile/android./gradlew assembleDebug
The APK will be created at:
android/app/build/outputs/apk/debug/app-debug.apk
Complete Build Process
Step 1: Build the Web App First
cd /var/www/html/salestracking/mobilenpm run build
Step 2: Sync with Capacitor
cd /var/www/html/salestracking/mobilenpx cap sync
Step 3: Build APK
cd /var/www/html/s
Build Release APK (For Distribution)
Step 1: Create Keystore (First Time Only)
cd /var/www/html/salestracking/mobile/android/appkeytool -genkey -v -keystore edubricz-release.keystore -alias edubricz -keyalg RSA -keysize 2048 -validity 10000
Step 2: Create key.properties
Create android/key.properties:
storePassword=YOUR_KEYSTORE_PASSWORDkeyPassword=YOUR_KEY_PASSWORDkeyAlias=edubriczstoreFile=app/edubricz-release.keystore
Step 3: Update build.gradle
Add signing config to android/app/build.gradle:
android {    // ... existing code ...        signingConfigs {        release {            def keystorePropertiesFile = rootProject.file("key.properties")            def keystoreProperties = new Properties()            if (keystorePropertiesFile.exists()) {                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))                keyAlias keystoreProperties['keyAlias']                keyPassword keystoreProperties['keyPassword']                storeFile file(keystoreProperties['storeFile'])                storePassword keystoreProperties['storePassword']            }        }    }        buildTypes {        release {            signingConfig signingConfigs.release            minifyEnabled false            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'        }    }}
Step 4: Build Release APK
cd /var/www/html/salestracking/mobile/android./gradlew assembleRelease
Release APK location:
android/app/build/outputs/apk/release/app-release.apk
Quick Build Script
Create build-apk.sh:
#!/bin/bashcd /var/www/html/salestracking/mobileecho "Building web app..."npm run buildecho "Syncing with Capacitor..."npx cap syncecho "Building APK..."cd android./gradlew assembleDebugecho ""echo "✅ APK built successfully!"echo "📍 Location: android/app/build/outputs/apk/debug/app-debug.apk"
Make it executable:
chmod +x build-apk.sh./build-apk.sh
Install APK on Device
Option 1: Using ADB
# Connect device via USB# Enable USB debugging on deviceadb install android/app/build/outputs/apk/debug/app-debug.apk
Option 2: Manual Install
Copy APK to device (USB, email, cloud)
On device: Settings → Security → Enable "Install from Unknown Sources"
Open APK file and tap "Install"
Current Status
Gradle version: 8.9 (updated)
Java version: 17 (configured)
Build configuration: fixed
APK location: android/app/build/outputs/apk/debug/app-debug.apk
Verify APK
# Check APK existsls -lh /var/www/html/salestracking/mobile/android/app/build/outputs/apk/debug/app-debug.apk# Check APK infoaapt dump badging /var/www/html/salestracking/mobile/android/app/build/outputs/apk/debug/app-debug.apk | grep -E "package|application-label"
The APK is ready to build. Run ./gradlew assembleDebug in the android directory to create it.# salesTracking
# salesTracking
