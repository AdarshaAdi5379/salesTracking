# Copilot Instructions for Edubricz Sales Tracking System

## Architecture Overview

This is a **three-tier application** with independent frontends and a shared backend:

- **Backend (PHP)**: REST API on port 8000, handles all business logic, database operations, and authentication
- **Admin Dashboard (React+Vite)**: Port 3000, for admins to manage routes, users, and view reports
- **Mobile App (React+Vite)**: Port 3001, for salespersons to execute routes and submit visits
- **Database (MySQL)**: Stores users, areas, schools, routes, visits, and reports

Data flows: Mobile/Admin → HTTP requests → PHP Backend → MySQL Database

## Critical Development Workflows

### Starting Development
All **three servers must run simultaneously** in separate terminals:
```bash
# Terminal 1: PHP Backend (required first)
cd backend && php -S localhost:8000 -t api

# Terminal 2: Admin Dashboard
cd admin && npm run dev

# Terminal 3: Mobile App
cd mobile && npm run dev
```

### Local vs Remote API
- **Local dev**: Backend runs on `http://localhost:8000/api`
- **Production/Staging**: Points to `https://pooja.edubricz.space/salesapi/api` (via `VITE_API_URL` env var)
- Admin/Mobile both use Axios with interceptors (see `admin/src/utils/api.js`) for auth token injection and 401 redirect

### Database & Configuration
- Database: `mysql -u admin -p < database/schema.sql`
- **DB Credentials** are in `backend/config/database.php` (defaults: host=`staging-db.c9ck86mssi9l.ap-south-1.rds.amazonaws.com`, db=`salestracking`, user=`admin`)
- Environment variables can override: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`

## Key Project Patterns

### Authentication (Base64 Bearer Token)
1. **Token Format**: `base64(JSON.stringify({id, name, email, role}))`
2. **Usage**: Stored in `localStorage` as `token` and `user`
3. **Role-Based Access**: `auth.php` enforces `requireAdmin()` or `requireSalesperson()` on backend
4. **Frontend Redirect**: Axios interceptor auto-redirects to `/login` on 401

### API Routing (Simple Router in PHP)
- Single entry point: `backend/api/index.php`
- Routes by resource name: `/api/auth`, `/api/areas`, `/api/schools`, `/api/routes`, `/api/visits`, `/api/reports`, `/api/users`, `/api/upload`, `/api/places`, `/api/coverage`
- No external routing library; simple `switch($resource)` then `require` handler file
- **CORS**: Handled by Nginx (headers set there, PHP fallback for OPTIONS)

### React Component Structure
Each admin component follows pattern:
- **Component file** (e.g., `CreateRoute.jsx`): React logic with axios calls
- **CSS file** (e.g., `CreateRoute.css`): Component-scoped styles
- **Router integration**: App.jsx uses React Router v6 with route guards (redirect to login if no user)

### Data Models
- **Users**: id, name, email, password, role (admin/salesperson), phone, timestamps
- **Areas**: id, name, city, state (geographic regions)
- **Schools**: id, area_id, name, type (school/college), GPS coords, contact info, google_place_id
- **Routes**: id, date, salesperson_id, assignments (schools assigned for that day)
- **Visits**: id, route_id, school_id, status (Visited/Not Visited/Follow-up/Meeting/Invalid), notes, photo_url, GPS timestamp
- **Reports**: Aggregated visit statistics per salesperson per day

## Common Tasks & Files to Reference

| Task | Key Files |
|------|-----------|
| Add new API endpoint | `backend/api/index.php` (router), create `backend/api/your-resource.php` handler |
| Add admin feature | Create component in `admin/src/components/YourFeature.jsx/.css`, wire in `admin/src/App.jsx` router |
| Add mobile feature | Create component in `mobile/src/components/`, use same API as admin (shared backend) |
| Debug API issue | Check `backend/config/database.php` for DB creds, enable `display_errors` in `backend/api/index.php` |
| Auth flow | `backend/utils/auth.php` (verification), `admin/src/utils/api.js` (token injection) |
| Handle CORS errors | Verify backend on port 8000, check Nginx config (`NGINX_FIX.md`) |

## Project-Specific Conventions

- **Port Layout**: Backend 8000, Admin 3000, Mobile 3001 (hardcoded in vite.config.js files)
- **Token Passing**: Always `Authorization: Bearer <token>` header via Axios interceptor
- **Admin Check**: Some endpoints require `requireAdmin()`, others allow both roles
- **GPS Integration**: Mobile app includes GPS timestamp for visit proof
- **Google Places API**: `backend/config/google.php` and endpoint `/api/places` for location search
- **Uploads**: Photos stored via `backend/api/upload.php`, path in visits table

## Database Connection Note
If database connection fails locally, ensure:
1. MySQL is running (`sudo systemctl start mysql`)
2. Database exists (`mysql -u root -p < database/schema.sql`)
3. Update credentials in `backend/config/database.php` OR set env vars
4. AWS RDS default in config is staging; local dev should use localhost

## Helpful Documentation Files
- [START_SERVERS.md](../START_SERVERS.md) - Step-by-step server startup
- [SETUP.md](../SETUP.md) - Initial setup and quick test workflow
- [NGINX_FIX.md](../NGINX_FIX.md) - Production Nginx configuration
- [GOOGLE_PLACES_SETUP.md](../GOOGLE_PLACES_SETUP.md) - Google Maps API setup
- [README.md](../README.md) - Feature overview and prerequisites
