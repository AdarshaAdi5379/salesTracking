# Edubricz Sales Tracking System - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Installation & Setup](#installation--setup)
9. [Usage Guide](#usage-guide)
10. [Google Integration](#google-integration)
11. [Build & Deployment](#build--deployment)

---

## 1. Project Overview

**Edubricz Sales Tracking System** is a comprehensive sales management application designed specifically for educational institutions (schools and colleges) sales teams. It provides a complete solution for managing sales routes, tracking field visits, monitoring sales performance, and analyzing coverage data.

The system consists of three main components:
- **Backend API**: PHP-based REST API
- **Admin Dashboard**: Web-based admin interface (React)
- **Mobile App**: Field sales app for salespersons (React + Capacitor)

---

## 2. Problem Statement

Sales teams in the education sector face several challenges:

1. **Route Management**: Manual planning of daily visits is time-consuming and inefficient
2. **Tracking Field Visits**: No reliable way to verify if salespersons actually visited their assigned locations
3. **Performance Monitoring**: Difficulty in tracking and analyzing sales performance
4. **Data Collection**: Collecting contact information, notes, and photos from visits requires multiple tools
5. **Coverage Analysis**: Hard to identify which schools/colleges have been visited and which remain uncovered
6. **GPS Verification**: Cannot verify proof of visit with location data

This system addresses all these challenges by providing an integrated solution for field sales management.

---

## 3. Features

### 3.1 Admin Dashboard Features

#### Dashboard
- Overview of today's routes and visits
- Statistics: Total routes, active routes, total visits, completed visits
- Recent routes table with status and visit counts

#### Routes Management
- Create new routes with:
  - Salesperson selection
  - Area selection
  - Date selection
  - School/college selection from the area
- View all routes with filtering by date and salesperson
- Update and delete routes
- Automatic school/college loading based on selected area

#### Schools/Colleges Management
- Add schools/colleges manually
- **Import from Google Places API**:
  - Search by location and type (school/college)
  - Auto-fetch: name, address, phone, website, coordinates
  - Bulk import selected locations
- Edit and delete schools/colleges
- View schools by area
- Store additional metadata: contact person, phone, email

#### Users Management
- Create and manage users (admin and salesperson roles)
- View all users
- Edit user details
- Delete users (admin only)
- Role-based access control

#### Reports
- **Daily Reports**: Visit statistics for a specific date
  - Total routes, total visits, visited, not visited, follow-up counts
  - Coverage rate percentage
  - Coverage alerts for unvisited locations
  - Detailed visit table with school name, type, status, notes
- **Salesperson Performance Reports**:
  - Performance over time (single date or date range)
  - Total routes, visits, visited count, follow-up count
  - Distance traveled
- **Uncovered Schools Report**: List of schools not yet visited

#### Coverage Map
- Interactive Google Maps integration
- Visual representation of visited locations
- Color-coded markers: Schools (blue), Colleges (purple)
- Filter by date, salesperson, and area
- Summary statistics: Total visited, areas covered, last visit date
- Click markers to view visit details

### 3.2 Mobile App Features

#### Authentication
- Login for salespersons
- Session management
- Logout functionality

#### Today's Route
- View assigned route for the current day
- Ordered list of schools/colleges to visit
- Progress tracking: visited count vs total
- Route summary: name, area, progress

#### Navigation
- Open location in Google Maps for navigation
- One-click navigation to each school/college

#### Visit Update
- Mark visit status:
  - Visited
  - Not Visited
  - Follow-up
  - Meeting Scheduled
  - Invalid Location
- Add notes about the visit
- **Photo Capture**:
  - In-app camera integration
  - Capture and upload photos as proof of visit
- **GPS Location Capture**: Automatic timestamp with coordinates
- **Competitor Tracking**:
  - Check if using competitor product
  - Enter competitor name if applicable
- **Deal Tracking**:
  - Mark deal as closed
  - Enter deal value (approximate)
  - Record any deal issues
- **Contact Details Update**:
  - Update phone, email, contact person
  - Updates reflect in admin dashboard

#### Real-time Progress
- View completion status of each visit
- Status badges for each location

---

## 4. Technology Stack

### Frontend (Admin Dashboard)
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **@react-google-maps/api** - Google Maps integration

### Frontend (Mobile App)
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Capacitor** - Cross-platform mobile framework (can build to Android APK)
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client

### Backend
- **PHP 7.4+** - Server-side language
- **MySQL** - Database
- **Composer** - PHP dependency management
- **PHP built-in server** - For development (or Apache/Nginx for production)

### External Services
- **Google Maps JavaScript API** - Map display and interaction
- **Google Places API** - Auto-fetch schools/colleges
- **Google Directions API** - Route navigation

---

## 5. Project Structure

```
salestracking/
├── backend/                    # PHP Backend API
│   ├── api/                    # API endpoints
│   │   ├── auth.php           # Authentication
│   │   ├── areas.php          # Areas CRUD
│   │   ├── schools.php        # Schools CRUD
│   │   ├── routes.php         # Routes CRUD
│   │   ├── visits.php         # Visits CRUD
│   │   ├── users.php          # Users CRUD
│   │   ├── reports.php        # Reports & analytics
│   │   ├── coverage.php       # Coverage data
│   │   ├── places.php         # Google Places integration
│   │   ├── upload.php         # File uploads
│   │   └── index.php          # Main router
│   ├── config/                # Configuration
│   │   ├── database.php       # Database connection
│   │   ├── google.php         # Google API keys
│   │   └── cors.php           # CORS settings
│   └── utils/                 # Utilities
│       └── auth.php           # Auth helpers
├── admin/                     # Admin Dashboard (React)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RoutesManagement.jsx
│   │   │   ├── CreateRoute.jsx
│   │   │   ├── Schools.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── CoverageMap.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── Login.jsx
│   │   ├── utils/             # Utility functions
│   │   │   ├── api.js         # API client
│   │   │   └── googleMapsLoader.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                   # Environment variables
│   └── dist/                  # Production build
├── mobile/                    # Mobile App (React + Capacitor)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── TodayRoute.jsx
│   │   │   ├── VisitDetails.jsx
│   │   │   └── Login.jsx
│   │   ├── utils/             # Utility functions
│   │   │   └── api.js         # API client
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── android/               # Android native project (generated)
│   ├── package.json
│   ├── vite.config.js
│   ├── capacitor.config.json
│   └── public/                # Mobile assets
├── database/                  # Database files
│   ├── schema.sql            # Full schema
│   └── migrations.sql        # Migration scripts
├── uploads/                   # Uploaded photos (auto-created)
├── package.json              # Root package.json
├── composer.json             # PHP dependencies
├── SETUP.md                  # Quick setup guide
├── README.md                 # Project readme
├── GOOGLE_PLACES_SETUP.md    # Google Places integration guide
├── START_SERVERS.md          # Server startup guide
└── NGINX_FIX.md              # Production deployment guide
```

---

## 6. Database Schema

### Tables

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | Unique email |
| password | VARCHAR(255) | Bcrypt hashed |
| role | ENUM | 'admin' or 'salesperson' |
| phone | VARCHAR(20) | Contact number |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

#### areas
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(255) | Area name (e.g., Chandra Layout) |
| city | VARCHAR(255) | City name |
| state | VARCHAR(255) | State name |

#### schools
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| area_id | INT | Foreign key to areas |
| name | VARCHAR(255) | School/college name |
| type | ENUM | 'school' or 'college' |
| address | TEXT | Full address |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |
| phone | VARCHAR(20) | Contact phone |
| email | VARCHAR(255) | Contact email |
| contact_person | VARCHAR(255) | Contact person name |
| google_place_id | VARCHAR(255) | Google Places ID |
| additional_fields | JSON | Extra metadata |

#### routes
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| salesperson_id | INT | Foreign key to users |
| area_id | INT | Foreign key to areas |
| date | DATE | Route date |
| name | VARCHAR(255) | Route name |
| status | ENUM | 'active', 'completed', 'cancelled' |
| total_distance | DECIMAL(10,2) | Total distance (km) |

#### route_items
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| route_id | INT | Foreign key to routes |
| school_id | INT | Foreign key to schools |
| order_index | INT | Visit order |

#### visits
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| route_item_id | INT | Foreign key to route_items |
| status | ENUM | 'visited', 'not_visited', 'follow_up', 'meeting_scheduled', 'invalid_location' |
| notes | TEXT | Visit notes |
| using_competitor | BOOLEAN | Is using competitor? |
| competitor_name | VARCHAR(255) | Competitor name |
| deal_closed | BOOLEAN | Was deal closed? |
| deal_value | DECIMAL(12,2) | Deal value |
| deal_issues | TEXT | Deal issues |
| photo_url | VARCHAR(500) | Photo URL |
| latitude | DECIMAL(10,8) | GPS latitude at visit |
| longitude | DECIMAL(11,8) | GPS longitude at visit |
| visited_at | TIMESTAMP | Visit timestamp |

#### gps_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| route_id | INT | Foreign key to routes |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |
| timestamp | TIMESTAMP | Log timestamp |

---

## 7. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth | Login or register |

### Areas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/areas | Get all areas |
| POST | /api/areas | Create area (Admin only) |

### Schools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/schools?area_id={id} | Get schools by area |
| POST | /api/schools | Create school (Admin only) |
| PUT | /api/schools/{id} | Update school (Admin only) |
| DELETE | /api/schools/{id} | Delete school (Admin only) |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/routes?date={date} | Get routes by date |
| GET | /api/routes/{id} | Get route details |
| POST | /api/routes | Create route (Admin only) |
| PUT | /api/routes/{id} | Update route (Admin only) |
| DELETE | /api/routes/{id} | Delete route (Admin only) |

### Visits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/visits?route_id={id} | Get visits by route |
| POST | /api/visits | Create/Update visit |
| PUT | /api/visits/{id} | Update visit |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports?type=daily&date={date} | Daily report |
| GET | /api/reports?type=salesperson&salesperson_id={id}&start_date={date}&end_date={date} | Salesperson performance |
| GET | /api/reports?type=uncovered | Uncovered schools (Admin only) |

### Coverage
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/coverage?date={date}&salesperson_id={id}&area_id={id} | Coverage data for map |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get users |
| POST | /api/users | Create user (Admin only) |
| PUT | /api/users/{id} | Update user |
| DELETE | /api/users/{id} | Delete user (Admin only) |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload | Upload photo (multipart/form-data) |

### Places
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/places | Search Google Places (Admin only) |

---

## 8. Installation & Setup

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Node.js 16 or higher
- npm or yarn
- Composer (for PHP dependencies)

### Step 1: Database Setup
```bash
mysql -u root -p < database/schema.sql
```
Or manually:
1. Create database: `CREATE DATABASE sales_tracking;`
2. Import: `mysql -u root -p sales_tracking < database/schema.sql`

### Step 2: Backend Configuration
Edit `backend/config/database.php` or set environment variables:
```php
DB_HOST=localhost
DB_NAME=sales_tracking
DB_USER=root
DB_PASS=your_password
```

Configure Google API key in `backend/.env`:
```
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### Step 3: Install Dependencies
```bash
cd admin && npm install
cd ../mobile && npm install
cd ..
```

### Step 4: Start Servers
**Terminal 1 - Backend:**
```bash
cd backend
php -S localhost:8000 -t api
```

**Terminal 2 - Admin Dashboard:**
```bash
cd admin
npm run dev
# Access: http://localhost:3000
```

**Terminal 3 - Mobile App:**
```bash
cd mobile
npm run dev
# Access: http://localhost:3001
```

### Step 5: Create Uploads Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

### Default Login Credentials
- **Admin**: admin@example.com / admin123
- **Salesperson**: Create through admin dashboard

---

## 9. Usage Guide

### Admin Workflow
1. Login to admin dashboard
2. Add areas (e.g., "Chandra Layout", "Rajajinagar")
3. Add schools/colleges:
   - Either manually enter details
   - Or use "Import from Google" to auto-fetch
4. Create salesperson users
5. Create routes:
   - Select salesperson
   - Select area
   - Select date
   - Choose schools to visit
6. Monitor reports and coverage map

### Salesperson Workflow
1. Login to mobile app
2. View today's assigned route
3. Navigate to each location using Google Maps
4. At each location:
   - Update status (visited/not visited/etc.)
   - Add notes
   - Capture photo (optional)
   - Record GPS location (automatic)
   - Track competitor and deal info
5. View progress in real-time

---

## 10. Google Integration

### Google Maps API (Required)
- **Admin Dashboard**: Coverage map display
- **Mobile App**: Navigation to schools

Enable in Google Cloud Console:
- Maps JavaScript API
- Directions API

Configure in `admin/.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

### Google Places API (Optional but Recommended)
- Auto-fetch schools/colleges from Google
- Eliminates manual data entry

Enable in Google Cloud Console:
- Places API

Configure in `backend/.env`:
```
GOOGLE_PLACES_API_KEY=your_places_api_key
```

---

## 11. Build & Deployment

### Admin Dashboard Build
```bash
cd admin
npm run build
# Output: admin/dist/
```

### Mobile App APK Build
```bash
cd mobile
npm run build
npx cap sync
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Production Deployment
- Use Apache/Nginx for backend
- Configure proper CORS settings
- Enable HTTPS
- Use environment variables for sensitive data

---

## License

This project is open source and available for use.

---

## Support

For issues and questions, please contact the development team.