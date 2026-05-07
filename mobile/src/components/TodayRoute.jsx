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
  const [createSidebarOpen, setCreateSidebarOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [placeFilter, setPlaceFilter] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState(null)

  const [areas, setAreas] = useState([])
  const [createDate, setCreateDate] = useState('')
  const [createAreaId, setCreateAreaId] = useState('')
  const [createName, setCreateName] = useState('')
  const [schools, setSchools] = useState([])
  const [schoolSearch, setSchoolSearch] = useState('')
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([])
  const [visitedSchools, setVisitedSchools] = useState({})
  const [checkingVisits, setCheckingVisits] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetchRoutes()
    fetchAreas()
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

  useEffect(() => {
    if (!createSidebarOpen) return
    if (!createDate) setCreateDate(todayISO())
  }, [createSidebarOpen])

  useEffect(() => {
    if (!createSidebarOpen) return
    if (!createAreaId) {
      setSchools([])
      setSelectedSchoolIds([])
      setVisitedSchools({})
      return
    }
    // Reset filters/pickers when switching area to avoid hiding all results.
    setSchoolSearch('')
    setCreateError('')
    console.log('[create-route] selected area_id =', createAreaId)
    fetchSchoolsForArea(createAreaId)
    checkExistingRoutesAndVisits(createAreaId)
  }, [createAreaId, createSidebarOpen])

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

  const fetchAreas = async () => {
    try {
      const response = await api.get('/areas')
      if (Array.isArray(response.data)) {
        setAreas(response.data)
      } else {
        setAreas(response.data?.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch areas:', err)
      setAreas([])
    }
  }

  const fetchSchoolsForArea = async (areaId) => {
    try {
      const response = await api.get(`/schools?area_id=${encodeURIComponent(areaId)}&no_pagination=true`)
      if (Array.isArray(response.data)) {
        setSchools(response.data)
      } else {
        setSchools(response.data?.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err)
      const message = err?.response?.data?.error || err?.message || 'Failed to fetch schools'
      setCreateError(message)
      setSchools([])
    }
  }

  const resetCreateForm = () => {
    setCreateError('')
    setCreateName('')
    setCreateAreaId('')
    setSchools([])
    setSchoolSearch('')
    setSelectedSchoolIds([])
    setVisitedSchools({})
    setCreateDate(todayISO())
  }

  const toggleSelectSchool = (schoolId) => {
    const id = String(schoolId)
    setSelectedSchoolIds((prev) => {
      const exists = prev.some((x) => String(x) === id)
      if (exists) return prev.filter((x) => String(x) !== id)
      return [...prev, id]
    })
  }

  const moveSelectedSchool = (schoolId, direction) => {
    const id = String(schoolId)
    setSelectedSchoolIds((prev) => {
      const idx = prev.findIndex((x) => String(x) === id)
      if (idx === -1) return prev
      const next = [...prev]
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[newIdx]
      next[newIdx] = tmp
      return next
    })
  }

  const submitCreateRoute = async () => {
    setCreateError('')
    const today = todayISO()
    if (!createAreaId) {
      setCreateError('Please select a place (area).')
      return
    }
    // Salesperson is only allowed to create a route for today.
    if (!createDate || createDate !== today) {
      setCreateDate(today)
      setCreateError('You can create routes only for today.')
      return
    }
    if (!selectedSchoolIds.length) {
      setCreateError('Please select at least one school/college.')
      return
    }

    const alreadyVisited = selectedSchoolIds.filter((id) => visitedSchools[String(id)]?.visited)
    if (alreadyVisited.length > 0) {
      const names = alreadyVisited
        .map((id) => schools.find((s) => String(s.id) === String(id))?.name || `School #${id}`)
        .join(', ')
      const proceed = window.confirm(
        `Warning: ${alreadyVisited.length} selected place(s) look already visited today:\n\n${names}\n\nCreate the route anyway?`
      )
      if (!proceed) return
    }

    setCreating(true)
    try {
      const payload = {
        area_id: Number.isNaN(Number(createAreaId)) ? createAreaId : Number(createAreaId),
        date: today,
        name: createName,
        school_ids: selectedSchoolIds.map((x) => (Number.isNaN(Number(x)) ? x : Number(x)))
      }
      const response = await api.post('/routes', payload)
      const newId = response?.data?.id

      await fetchRoutes()
      if (newId) setSelectedRouteId(newId)
      setCreateSidebarOpen(false)
      resetCreateForm()
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to create route.'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  const checkExistingRoutesAndVisits = async (areaId) => {
    if (!areaId) return
    try {
      setCheckingVisits(true)
      const today = todayISO()
      const routesResponse = await api.get(`/routes?date=${encodeURIComponent(today)}&area_id=${encodeURIComponent(areaId)}&all_area=true`)
      const existing = Array.isArray(routesResponse.data) ? routesResponse.data : []

      const visitedMap = {}
      for (const r of existing) {
        try {
          const routeDetails = await api.get(`/routes/${r.id}`)
          const items = routeDetails?.data?.items || []
          for (const item of items) {
            const visitDate = item.last_visited_at || item.visited_at
            if ((item.visit_status === 'visited' || item.last_visited_at) && visitDate) {
              visitedMap[String(item.school_id)] = {
                visited: true,
                visitedAt: visitDate,
                routeName: r.name || `Route #${r.id}`,
                salesperson: r.salesperson_name
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch route ${r.id}:`, err)
        }
      }
      setVisitedSchools(visitedMap)
    } catch (err) {
      console.error('Failed to check existing routes/visits:', err)
      setVisitedSchools({})
    } finally {
      setCheckingVisits(false)
    }
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
  const filteredSchools = (schools || []).filter((s) => {
    const q = schoolSearch.trim().toLowerCase()
    if (!q) return true
    const hay = `${s.name || ''} ${s.address || ''} ${s.type || ''}`.toLowerCase()
    return hay.includes(q)
  })

  return (
    <div className="mobile-container mobile-layout">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      {createSidebarOpen && <div className="create-sidebar-backdrop" onClick={() => setCreateSidebarOpen(false)} />}

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

      <aside className={`create-sidebar ${createSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Create Route</div>
          <button className="sidebar-close" onClick={() => setCreateSidebarOpen(false)} aria-label="Close create route sidebar">✕</button>
        </div>

        <div className="create-form">
          {createError && <div className="create-error">{createError}</div>}

          <div className="filter-row">
            <label className="filter-label">Date</label>
            <input
              className="filter-input"
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              min={todayISO()}
              max={todayISO()}
              disabled
            />
            <div className="create-hint" style={{ padding: 0 }}>Routes can be created only for today.</div>
          </div>

          <div className="filter-row">
            <label className="filter-label">Place (Area)</label>
            <select
              className="filter-input"
              value={createAreaId}
              onChange={(e) => setCreateAreaId(e.target.value)}
            >
              <option value="">Select an area</option>
              {(areas || []).map((a) => (
                <option key={a.id} value={String(a.id)}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-row">
            <label className="filter-label">Route Name (optional)</label>
            <input
              className="filter-input"
              type="text"
              placeholder="e.g. Morning visits"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </div>

          <div className="filter-row">
            <label className="filter-label">Search schools/colleges</label>
            <input
              className="filter-input"
              type="text"
              placeholder="Search by name/address"
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              disabled={!createAreaId}
            />
          </div>
        </div>

          <div className="create-body">
                    <div className="create-section-title">Select Schools/Colleges</div>
                    {!createAreaId ? (
                      <div className="create-hint">Select a place (area) to load schools.</div>
                    ) : (
                      <>
                        {checkingVisits && <div className="create-hint">Checking visited schools…</div>}
                        {!checkingVisits && schools.length === 0 && (
                          <div className="create-hint">No schools/colleges found for this area. Ask admin to add/import them first.</div>
                        )}
                        {schools.length > 0 && filteredSchools.length === 0 && (
                          <div className="create-hint">No matches for your search.</div>
                        )}

                        <div className="schools-list">
                          {filteredSchools.map((s) => {
                            const checked = selectedSchoolIds.some((x) => String(x) === String(s.id))
                            const visited = !!visitedSchools[String(s.id)]?.visited
                            const visitedInfo = visitedSchools[String(s.id)]
                            return (
                              <label key={s.id} className={`school-checkbox ${checked ? 'checked' : ''} ${visited ? 'visited' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    if (visited && !checked) {
                              const proceed = window.confirm('This school/college is already marked as visited today. Add anyway?')
                                      if (!proceed) return
                                    }
                                    toggleSelectSchool(s.id)
                                  }}
                                />
                                <div className="school-item-info">
                                  <div className="school-item-name">
                                    {s.name}
                                    {visited ? <span className="visited-pill">Visited today</span> : null}
                                  </div>
                                  <div className="school-item-meta">
                                    <span className="school-item-type">{s.type}</span>
                                    {s.address ? <span className="school-item-sep">•</span> : null}
                                    {s.address ? <span className="school-item-address">{s.address}</span> : null}
                                  </div>
                                  {visited && visitedInfo ? (
                                    <div className="visited-meta">
                                      {visitedInfo.salesperson ? `By ${visitedInfo.salesperson}` : 'Visited'} • {visitedInfo.routeName || 'Route'} • {String(visitedInfo.visitedAt).slice(0, 16).replace('T', ' ')}
                                    </div>
                                  ) : null}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}

          <div className="create-section-title">Selected ({selectedSchoolIds.length})</div>
          {selectedSchoolIds.length === 0 ? (
            <div className="create-hint">Pick at least one school/college.</div>
          ) : (
            <div className="selected-list">
              {selectedSchoolIds.map((id) => {
                const s = (schools || []).find((x) => String(x.id) === String(id))
                return (
                  <div key={id} className="selected-item">
                    <div className="selected-item-name">{s?.name || 'School'}</div>
                    <div className="selected-item-actions">
                      <button className="selected-move" onClick={() => moveSelectedSchool(id, 'up')} aria-label="Move up">↑</button>
                      <button className="selected-move" onClick={() => moveSelectedSchool(id, 'down')} aria-label="Move down">↓</button>
                      <button className="selected-remove" onClick={() => toggleSelectSchool(id)} aria-label="Remove">Remove</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="create-footer">
          <button className="create-cancel" onClick={() => { setCreateSidebarOpen(false); resetCreateForm() }} disabled={creating}>Cancel</button>
          <button className="create-submit" onClick={submitCreateRoute} disabled={creating || !createAreaId || selectedSchoolIds.length === 0}>
            {creating ? 'Creating...' : 'Create Route'}
          </button>
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
          <button className="create-btn" onClick={() => setCreateSidebarOpen(true)} aria-label="Create route">＋</button>
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
