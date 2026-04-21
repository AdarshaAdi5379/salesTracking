import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import './TodayRoute.css'

function TodayRoute({ user, onLogout }) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState(null)

  useEffect(() => {
    fetchTodayRoute()
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const fetchTodayRoute = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await api.get(`/routes?date=${today}`)
      const routes = response.data.filter(r => r.status === 'active')
      
      if (routes.length > 0) {
        const routeResponse = await api.get(`/routes/${routes[0].id}`)
        setRoute(routeResponse.data)
      }
    } catch (err) {
      console.error('Failed to fetch route:', err)
    } finally {
      setLoading(false)
    }
  }

  const openMaps = (lat, lng, name) => {
    // Open in Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="loading">Loading your route...</div>
      </div>
    )
  }

  if (!route || !route.items || route.items.length === 0) {
    return (
      <div className="mobile-container">
        <div className="header">
          <h1>Today's Route</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
        <div className="empty-state">
          <p>No active route assigned for today.</p>
          <p className="hint">Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  const visitedCount = route.items.filter(item => item.visit_status === 'visited').length
  const totalCount = route.items.length

  return (
    <div className="mobile-container">
      <div className="header">
        <h1>Today's Route</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      <div className="route-summary">
        <div className="summary-item">
          <span className="label">Route:</span>
          <span className="value">{route.name || 'Unnamed Route'}</span>
        </div>
        <div className="summary-item">
          <span className="label">Area:</span>
          <span className="value">{route.area_name}</span>
        </div>
        <div className="summary-item">
          <span className="label">Progress:</span>
          <span className="value">{visitedCount} / {totalCount}</span>
        </div>
      </div>

      <div className="route-items">
        <h2>Visits ({visitedCount}/{totalCount})</h2>
        {route.items.map((item, index) => (
          <div key={item.id} className={`route-item ${item.visit_status || 'not_visited'}`}>
            <div className="item-header">
              <span className="item-number">{index + 1}</span>
              <div className="item-info">
                <h3>{item.school_name}</h3>
                <p className="item-type">{item.type}</p>
                {item.address && <p className="item-address">{item.address}</p>}
              </div>
              <span className={`status-badge status-${item.visit_status || 'not_visited'}`}>
                {item.visit_status ? item.visit_status.replace('_', ' ') : 'Not Visited'}
              </span>
            </div>
            <div className="item-actions">
              <button
                onClick={() => openMaps(item.latitude, item.longitude, item.school_name)}
                className="btn-navigate"
              >
                🗺️ Navigate
              </button>
              <Link to={`/visit/${item.id}`} className="btn-update">
                {item.visit_status === 'visited' ? 'Update Visit' : 'Mark Visit'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TodayRoute

