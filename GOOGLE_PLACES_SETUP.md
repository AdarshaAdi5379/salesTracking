# Google Places API Setup

## Overview
The system can automatically fetch schools and colleges from Google Places API, eliminating the need for manual data entry.

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (required)
   - **Places API (New)** (recommended)
   - **Geocoding API** (optional, for better location data)

### 2. Create API Key

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy your API key
4. (Recommended) Restrict the API key:
   - Click on the API key to edit
   - Under **API restrictions**, select "Restrict key"
   - Choose "Places API" and "Geocoding API"
   - Under **Application restrictions**, you can restrict by IP or HTTP referrer

### 3. Configure API Key

#### Option A: Environment Variable (Recommended)
Add to your server environment or `.env` file:
```bash
export GOOGLE_PLACES_API_KEY=your_api_key_here
```

#### Option B: Direct Configuration
Edit `backend/api/places.php` and replace:
```php
$apiKey = $_ENV['GOOGLE_PLACES_API_KEY'] ?? 'YOUR_GOOGLE_PLACES_API_KEY';
```
with:
```php
$apiKey = 'your_actual_api_key_here';
```

### 4. For Nginx/PHP-FPM
If using Nginx with PHP-FPM, add to your PHP-FPM pool configuration or `.env` file:
```ini
env[GOOGLE_PLACES_API_KEY] = your_api_key_here
```

Or add to your Nginx server block:
```nginx
fastcgi_param GOOGLE_PLACES_API_KEY "your_api_key_here";
```

## Usage

1. Go to **Schools & Colleges Management**
2. Click **"Import from Google"** button
3. Enter:
   - **Location**: e.g., "Bangalore, Karnataka" or "Mumbai, Maharashtra"
   - **Type**: School or College
   - **Search Query** (optional): Specific name or keyword
4. Click **"Search Google Places"**
5. Review results and select schools/colleges to import
6. Select the **Area** where these schools belong
7. Click **"Import Selected"**

## Features

- ✅ Automatic fetching of school/college names
- ✅ Complete addresses
- ✅ GPS coordinates (latitude/longitude)
- ✅ Phone numbers (when available)
- ✅ Website URLs (when available)
- ✅ Bulk selection and import
- ✅ Filter by location and type

## API Costs

Google Places API has usage-based pricing:
- **Text Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests

For development/testing, Google provides $200 free credit per month.

## Troubleshooting

### Error: "Google Places API key not configured"
- Make sure the API key is set in environment variables
- Restart PHP-FPM/Nginx after setting environment variables
- Check that the API key is accessible to PHP

### Error: "REQUEST_DENIED"
- API key might be invalid
- Places API might not be enabled
- API key restrictions might be blocking the request

### Error: "OVER_QUERY_LIMIT"
- You've exceeded your quota
- Check your Google Cloud Console billing
- Consider upgrading your plan

### No Results Found
- Try different location names
- Use more specific search queries
- Check if the location has schools/colleges in Google's database

