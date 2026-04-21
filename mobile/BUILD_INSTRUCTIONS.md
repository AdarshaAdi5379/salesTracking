# Mobile App Build Instructions

## Quick Start - Build for Production

### 1. Build the App

```bash
cd /var/www/html/salestracking/mobile
npm run build
```

This creates a `dist` folder with all production files.

### 2. Deploy to Web Server

**Option A: Deploy to Nginx/Apache**

```bash
# Copy build files to web server
sudo cp -r dist/* /var/www/html/mobile-app/

# Or create a symlink
sudo ln -s /var/www/html/salestracking/mobile/dist /var/www/html/mobile-app
```

**Option B: Serve from existing Nginx config**

Add to your Nginx configuration:

```nginx
location /mobile-app {
    alias /var/www/html/salestracking/mobile/dist;
    try_files $uri $uri/ /mobile-app/index.html;
    
    # PWA support
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. Access on Mobile Device

1. Open mobile browser (Chrome/Safari)
2. Navigate to: `http://your-server-ip/mobile-app/`
3. Tap menu → "Add to Home Screen" (Android) or Share → "Add to Home Screen" (iOS)
4. App icon appears on home screen like a native app

## Build as Native Mobile App (Advanced)

### Using Capacitor (Recommended)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Initialize
npx cap init "Edubricz Sales Tracking" "com.edubricz.salestracking"

# Build web app first
npm run build

# Add platforms
npx cap add ios
npx cap add android

# Sync
npx cap sync

# Open in native IDEs
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

### Build APK (Android)

1. Open Android Studio
2. Build → Generate Signed Bundle/APK
3. Choose APK
4. Create keystore (first time)
5. Build → Build Bundle(s) / APK(s)

### Build IPA (iOS)

1. Open Xcode
2. Select your device/Simulator
3. Product → Archive
4. Distribute App → Ad Hoc/App Store

## Current Build Status

✅ Production build configured
✅ PWA manifest ready
✅ Mobile-optimized viewport
✅ Touch-friendly UI

## Testing Locally

```bash
# Build
npm run build

# Preview production build
npm run preview
# Opens at http://localhost:4173
```

## Production Checklist

- [ ] Update API base URL in production
- [ ] Configure HTTPS (required for PWA features)
- [ ] Add app icons (192x192 and 512x512 PNG)
- [ ] Test on actual mobile devices
- [ ] Test GPS location features
- [ ] Test camera/photo upload
- [ ] Test offline functionality

## API Configuration for Production

Update `src/utils/api.js` for production:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api'  // Production API
  : '/api'  // Development proxy
```

Or use environment variables:

```bash
# .env.production
VITE_API_URL=https://your-domain.com/api
```

