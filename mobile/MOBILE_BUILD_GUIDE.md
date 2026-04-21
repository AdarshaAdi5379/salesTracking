# Mobile App Build Guide

## Option 1: Build as Web App (PWA - Progressive Web App)

### Step 1: Build the Production Version

```bash
cd /var/www/html/salestracking/mobile
npm run build
```

This creates a `dist` folder with optimized production files.

### Step 2: Deploy to Web Server

Copy the `dist` folder contents to your web server:

```bash
# Example: Copy to Nginx/Apache web root
cp -r dist/* /var/www/html/salestracking/mobile-app/
```

### Step 3: Access on Mobile

1. Open mobile browser
2. Navigate to: `http://your-server-ip/mobile-app/`
3. Add to Home Screen (iOS/Android)

## Option 2: Build as Native Mobile App (Using Capacitor)

### Step 1: Install Capacitor

```bash
cd /var/www/html/salestracking/mobile
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### Step 2: Initialize Capacitor

```bash
npx cap init
# App name: Edubricz Sales Tracking
# App ID: com.edubricz.salestracking
# Web dir: dist
```

### Step 3: Build and Sync

```bash
# Build the app
npm run build

# Add platforms
npx cap add ios
npx cap add android

# Sync web assets to native projects
npx cap sync
```

### Step 4: Build Native Apps

**For Android:**
```bash
npx cap open android
# Opens Android Studio - build APK/AAB from there
```

**For iOS:**
```bash
npx cap open ios
# Opens Xcode - build IPA from there
```

## Option 3: Quick PWA Setup (Recommended for Quick Deployment)

The app is already configured as a PWA. Just build and deploy:

```bash
npm run build
# Deploy dist/ folder to web server
# Access via mobile browser
# Users can "Add to Home Screen"
```

## Production Build Configuration

Update `vite.config.js` for production:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/mobile-app/', // Change based on your deployment path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
```

## Testing the Build

```bash
# Build
npm run build

# Preview production build locally
npm run preview
```

## Mobile App Features

- ✅ Responsive design
- ✅ Touch-optimized UI
- ✅ GPS location tracking
- ✅ Camera/Photo upload
- ✅ Offline-capable (with service worker)
- ✅ Installable on home screen

