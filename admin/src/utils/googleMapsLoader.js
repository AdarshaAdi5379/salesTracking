let googleMapsLoadPromise = null

function buildGoogleMapsSrc(apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/js')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('libraries', 'places')
  return url.toString()
}

export default function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
  }

  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Google Maps can only be loaded in a browser environment'))
      return
    }

    const existing = document.getElementById('google-maps-js')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google))
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-js'
    script.src = buildGoogleMapsSrc(apiKey)
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })

  return googleMapsLoadPromise
}

