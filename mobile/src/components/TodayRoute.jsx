import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import './TodayRoute.css'

function TodayRoute({ user, onLogout }) {
  const [routes, setRoutes] = useState([])
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [placeFilter, setPlaceFilter] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState(null)

  useEffect(() => {
    fetchRoutes()
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (!routes.length) return

    // If current selection is filtered out, auto-select the first filtered route.
    const filtered = getFilteredRoutes(routes, { dateFilter, placeFilter, showCompleted })
    if (!filtered.length) {
      setSelectedRouteId(null)
      setRoute(null)
      return
    }

    if (selectedRouteId && filtered.some((r) => String(r.id) === String(selectedRouteId))) {
      return
    }

    setSelectedRouteId(filtered[0].id)
  }, [routes, dateFilter, placeFilter, showCompleted])

  useEffect(() => {
    if (!selectedRouteId) return
    fetchRouteDetails(selectedRouteId)
  }, [selectedRouteId])

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

  const isRouteCompleted = (r) => {
    if (!r) return false
    if (r.status === 'completed') return true
    const total = Number(r.total_items ?? 0)
    const visited = Number(r.visited_count ?? 0)
    return total > 0 && visited >= total
  }

  const getFilteredRoutes = (allRoutes, filters) => {
    const normalizedPlace = (filters.placeFilter || '').trim()
    const normalizedDate = (filters.dateFilter || '').trim()

    return (allRoutes || [])
      .filter((r) => {
        if (!filters.showCompleted && isRouteCompleted(r)) return false
        if (normalizedDate && r.date !== normalizedDate) return false
        if (normalizedPlace) {
          // Prefer filtering by area_id (more stable), fallback to area_name if needed.
          const areaId = r.area_id != null ? String(r.area_id) : ''
          if (areaId) {
            if (areaId !== normalizedPlace) return false
          } else {
            const areaName = String(r.area_name || '')
            if (areaName !== normalizedPlace) return false
          }
        }
        return true
      })
      .sort((a, b) => {
        // date DESC, then created_at DESC (already from API, but keep deterministic)
        if (a.date !== b.date) return a.date < b.date ? 1 : -1
        const aCreated = a.created_at || ''
        const bCreated = b.created_at || ''
        if (aCreated === bCreated) return 0
        return aCreated < bCreated ? 1 : -1
      })
  }

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/routes')
      setRoutes(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Failed to fetch routes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRouteDetails = async (routeId) => {
    try {
      const routeResponse = await api.get(`/routes/${routeId}`)
      setRoute(routeResponse.data)
      setSidebarOpen(false)
    } catch (err) {
      console.error('Failed to fetch route details:', err)
    }
  }

  const todayISO = () => new Date().toISOString().split('T')[0]

  const formatDate = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return iso
    return `${d}-${m}-${y}`
  }

  const openMaps = (lat, lng, name) => {
    // Open in Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="loading">Loading your routes...</div>
      </div>
    )
  }

  const filteredRoutes = getFilteredRoutes(routes, { dateFilter, placeFilter, showCompleted })
  const placeOptions = (() => {
    const seen = new Map()
    for (const r of routes || []) {
      const key = r.area_id != null ? String(r.area_id) : String(r.area_name || '')
      const label = String(r.area_name || 'Unknown area')
      if (!key) continue
      if (!seen.has(key)) seen.set(key, label)
    }
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })()

  const visitedCount = route?.items?.filter(item => item.visit_status === 'visited').length || 0
  const totalCount = route?.items?.length || 0

  return (
    <div className="mobile-container mobile-layout">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Routes</div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">✕</button>
        </div>

        <div className="sidebar-filters">
          <div className="filter-row">
            <label className="filter-label">Date</label>
            <input
              className="filter-input"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <div className="filter-actions">
              <button className="filter-btn" onClick={() => setDateFilter('')}>All Pending</button>
              <button className="filter-btn" onClick={() => setDateFilter(todayISO())}>Today</button>
            </div>
          </div>

          <div className="filter-row">
            <label className="filter-label">Place</label>
            <select
              className="filter-input"
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
            >
              <option value="">All places</option>
              {placeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show completed routes
          </label>
        </div>

        <div className="route-list">
          {filteredRoutes.length === 0 ? (
            <div className="route-list-empty">
              <div className="empty-title">No routes found</div>
              <div className="empty-hint">Try changing the date/place filters.</div>
            </div>
          ) : (
            filteredRoutes.map((r) => {
              const total = Number(r.total_items ?? 0)
              const visited = Number(r.visited_count ?? 0)
              const completed = isRouteCompleted(r)
              const selected = String(r.id) === String(selectedRouteId)
              return (
                <button
                  key={r.id}
                  className={`route-list-item ${selected ? 'selected' : ''}`}
                  onClick={() => setSelectedRouteId(r.id)}
                >
                  <div className="route-list-top">
                    <div className="route-list-name">{r.name || 'Unnamed Route'}</div>
                    <div className={`route-list-badge ${completed ? 'completed' : 'pending'}`}>
                      {completed ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                  <div className="route-list-meta">
                    <span className="route-list-date">{formatDate(r.date)}</span>
                    <span className="route-list-sep">•</span>
                    <span className="route-list-area">{r.area_name || 'Unknown area'}</span>
                  </div>
                  <div className="route-list-progress">
                    {visited}/{total} visited
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <div className="main">
        <div className="route-bar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open routes sidebar">☰</button>
          <div className="route-bar-title">
            <div className="route-bar-heading">{route ? (route.name || 'Route') : 'Routes'}</div>
            <div className="route-bar-subtitle">
              {route ? `${formatDate(route.date)} • ${route.area_name || 'Unknown area'}` : (dateFilter ? `Date: ${formatDate(dateFilter)}` : 'All pending routes')}
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn logout-btn-small">Logout</button>
        </div>

        {!route || !route.items || route.items.length === 0 ? (
          <div className="empty-state">
            <p>No route selected.</p>
            <p className="hint">Open the menu and pick a route.</p>
          </div>
        ) : (
          <>
            <div className="route-summary">
              <div className="summary-item">
                <span className="label">Route:</span>
                <span className="value">{route.name || 'Unnamed Route'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Date:</span>
                <span className="value">{formatDate(route.date)}</span>
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
          </>
        )}
      </div>
    </div>
  )
}

export default TodayRoute
