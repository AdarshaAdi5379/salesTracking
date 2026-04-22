import React, { useState, useEffect, useRef } from 'react'
import Layout from './Layout'
import api from '../utils/api'
import './CoverageMap.css'


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 100px)'
}

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
}

const defaultZoom = 10

function CoverageMap({ user, onLogout }) {
  const [visitedSchools, setVisitedSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [filters, setFilters] = useState({
    date: '',
    salesperson_id: '',
    area_id: ''
  })
  const [salespersons, setSalespersons] = useState([])
  const [areas, setAreas] = useState([])
  const [summary, setSummary] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Missing VITE_GOOGLE_MAPS_API_KEY; Google Maps will not load.')
      if (user.role === 'admin') {
        fetchSalespersons()
      }
      fetchAreas()
      fetchCoverageData()
      return
    }

    // Load Google Maps script
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        initializeMap()
        if (user.role === 'admin') {
          fetchSalespersons()
        }
        fetchAreas()
        fetchCoverageData()
      }
      document.head.appendChild(script)
    } else {
      initializeMap()
      if (user.role === 'admin') {
        fetchSalespersons()
      }
      fetchAreas()
      fetchCoverageData()
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current && visitedSchools.length > 0) {
      updateMarkers()
    }
  }, [visitedSchools, filters])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      streetViewControl: true,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true
    })
  }

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    const bounds = new window.google.maps.LatLngBounds()
    let hasValidCoords = false

    visitedSchools.forEach((school, index) => {
      if (!school.latitude || !school.longitude) return

      const position = {
        lat: parseFloat(school.latitude),
        lng: parseFloat(school.longitude)
      }

      const color = school.type === 'school' ? '#3498db' : '#9b59b6'
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: school.school_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(school)
      })

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close()
          }
        })
        infoWindow.open(mapInstanceRef.current, marker)
        marker.infoWindow = infoWindow
      })

      marker.infoWindow = infoWindow
      markersRef.current.push(marker)
      bounds.extend(position)
      hasValidCoords = true
    })

    if (hasValidCoords && markersRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds)
    }
  }

  const createInfoWindowContent = (school) => {
    return `
      <div style="max-width: 300px; padding: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">${school.school_name}</h3>
        <p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Type:</strong> ${school.type}</p>
        <p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Area:</strong> ${school.area_name || 'N/A'}</p>
        ${school.address ? `<p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Address:</strong> ${school.address}</p>` : ''}
        ${school.phone ? `<p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Phone:</strong> ${school.phone}</p>` : ''}
        ${school.contact_person ? `<p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Contact:</strong> ${school.contact_person}</p>` : ''}
        ${school.visited_at ? `<p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Visited:</strong> ${new Date(school.visited_at).toLocaleString()}</p>` : ''}
        ${school.salesperson_name ? `<p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Salesperson:</strong> ${school.salesperson_name}</p>` : ''}
        ${school.route_date ? `<p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Route Date:</strong> ${new Date(school.route_date).toLocaleDateString()}</p>` : ''}
      </div>
    `
  }

  const fetchSalespersons = async () => {
    try {
      const response = await api.get('/users?role=salesperson')
      setSalespersons(response.data)
    } catch (err) {
      console.error('Failed to fetch salespersons:', err)
    }
  }

  const fetchAreas = async () => {
    try {
      const response = await api.get('/areas')
      setAreas(response.data)
    } catch (err) {
      console.error('Failed to fetch areas:', err)
    }
  }

  const fetchCoverageData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.salesperson_id) params.append('salesperson_id', filters.salesperson_id)
      if (filters.area_id) params.append('area_id', filters.area_id)

      const response = await api.get(`/coverage?${params}`)
      
      // Handle both direct response and nested data
      const data = response.data?.data || response.data
      const schools = data?.visited_schools || data?.visited_schools || []
      setVisitedSchools(schools)
      setSummary(data?.summary || response.data?.summary)

      // Markers will be updated via useEffect when visitedSchools changes
    } catch (err) {
      console.error('Failed to fetch coverage data:', err)
      alert('Failed to load coverage data: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }


  if (loading && visitedSchools.length === 0) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading">Loading coverage map...</div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="coverage-map-container">
        <div className="coverage-header">
          <h1>Coverage Map</h1>
          <div className="coverage-summary">
            {summary && (
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Visited:</span>
                  <span className="stat-value">{summary.total_visited_schools || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Areas Covered:</span>
                  <span className="stat-value">{summary.total_areas_covered || 0}</span>
                </div>
                {summary.last_visit_date && (
                  <div className="stat-item">
                    <span className="stat-label">Last Visit:</span>
                    <span className="stat-value">
                      {new Date(summary.last_visit_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="coverage-filters">
          <div className="filter-group">
            <label>Filter by Date:</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          {user.role === 'admin' && (
            <div className="filter-group">
              <label>Filter by Salesperson:</label>
              <select
                value={filters.salesperson_id}
                onChange={(e) => setFilters({ ...filters, salesperson_id: e.target.value })}
              >
                <option value="">All Salespersons</option>
                {salespersons.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label>Filter by Area:</label>
            <select
              value={filters.area_id}
              onChange={(e) => setFilters({ ...filters, area_id: e.target.value })}
            >
              <option value="">All Areas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFilters({ date: '', salesperson_id: '', area_id: '' })}
            className="btn-clear-filters"
          >
            Clear Filters
          </button>
        </div>

        {!GOOGLE_MAPS_API_KEY && (
          <div
            style={{
              margin: '12px 0',
              padding: '12px 14px',
              border: '1px solid #f1c40f',
              background: '#fff9db',
              borderRadius: 8,
              color: '#7a5d00'
            }}
          >
            Google Maps is not configured. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>admin/.env</code>.
          </div>
        )}

        <div className="map-wrapper">
          <div ref={mapRef} style={mapContainerStyle}></div>
        </div>

        <div className="coverage-legend">
          <div className="legend-item">
            <span className="legend-marker" style={{ background: '#3498db' }}></span>
            <span>Schools</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker" style={{ background: '#9b59b6' }}></span>
            <span>Colleges</span>
          </div>
          <div className="legend-info">
            Showing {visitedSchools.length} visited location(s) on map
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CoverageMap
