import React, { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from './Layout'
import api from '../utils/api'
import './RoutesManagement.css'

function RoutesManagement({ user, onLogout }) {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedRoute, setExpandedRoute] = useState(null)
  const [uncoveredSchools, setUncoveredSchools] = useState({})
  const [loadingUncovered, setLoadingUncovered] = useState({})
  const [showMoveDialog, setShowMoveDialog] = useState(null)
  const [nextDate, setNextDate] = useState('')
  const [moving, setMoving] = useState(false)
  const [routeDetails, setRouteDetails] = useState(null)
  const [routeDetailsLoading, setRouteDetailsLoading] = useState(false)
  const [routeDetailsError, setRouteDetailsError] = useState(null)

  const uploadsBaseUrl = useMemo(() => {
    const base = api.defaults.baseURL || ''
    return base.replace(/\/api\/?$/, '')
  }, [])

  useEffect(() => {
    fetchRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const url = date ? `/routes?date=${date}` : '/routes'
      const response = await api.get(url)
      if (Array.isArray(response.data)) {
        setRoutes(response.data)
      } else {
        console.error('Invalid response format:', response.data)
        setRoutes([])
      }
    } catch (err) {
      console.error('Failed to fetch routes:', err)
      alert('Failed to fetch routes: ' + (err.response?.data?.error || err.message))
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) {
      return
    }

    try {
      await api.delete(`/routes/${routeId}`)
      fetchRoutes()
    } catch (err) {
      alert('Failed to delete route: ' + (err.response?.data?.error || err.message))
    }
  }

  const fetchUncoveredSchools = async (routeId) => {
    if (uncoveredSchools[routeId]) {
      // Already loaded
      return
    }

    try {
      setLoadingUncovered(prev => ({ ...prev, [routeId]: true }))
      const response = await api.get(`/routes/${routeId}?uncovered=true`)
      setUncoveredSchools(prev => ({
        ...prev,
        [routeId]: response.data
      }))
    } catch (err) {
      console.error('Failed to fetch uncovered schools:', err)
      alert('Failed to fetch uncovered schools: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoadingUncovered(prev => ({ ...prev, [routeId]: false }))
    }
  }

  const toggleRouteExpansion = (routeId) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null)
    } else {
      setExpandedRoute(routeId)
      fetchUncoveredSchools(routeId)
    }
  }

  const handleMoveUncovered = async (routeId) => {
    if (!nextDate) {
      alert('Please select a date for the next route')
      return
    }

    setMoving(true)
    try {
      const response = await api.post('/routes?move_uncovered=true', {
        route_id: routeId,
        next_date: nextDate
      })
      alert(response.data.message || 'Successfully moved uncovered schools to next day')
      setShowMoveDialog(null)
      setNextDate('')
      // Refresh routes and uncovered schools
      fetchRoutes()
      setUncoveredSchools(prev => {
        const updated = { ...prev }
        delete updated[routeId]
        return updated
      })
    } catch (err) {
      alert('Failed to move uncovered schools: ' + (err.response?.data?.error || err.message))
    } finally {
      setMoving(false)
    }
  }

  const openRouteDetails = async (routeId) => {
    setRouteDetailsError(null)
    setRouteDetails(null)
    setRouteDetailsLoading(true)
    try {
      const response = await api.get(`/routes/${routeId}`)
      setRouteDetails(response.data)
    } catch (err) {
      console.error('Failed to fetch route details:', err)
      setRouteDetailsError(err.response?.data?.error || err.message)
    } finally {
      setRouteDetailsLoading(false)
    }
  }

  const closeRouteDetails = () => {
    setRouteDetails(null)
    setRouteDetailsError(null)
    setRouteDetailsLoading(false)
  }

  const toPhotoSrc = (photoUrl) => {
    if (!photoUrl) return null
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl
    return `${uploadsBaseUrl}${photoUrl}`
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading">Loading routes...</div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="routes-management">
        <div className="page-header">
          <h1>Routes Management</h1>
          <Link to="/routes/create" className="btn-primary">
            Create New Route
          </Link>
        </div>

        <div className="filter-section">
          <label>
            Filter by Date:
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button
            onClick={() => {
              setDate('')
              fetchRoutes()
            }}
            className="btn-secondary"
            style={{ marginLeft: '10px', fontSize: '14px', padding: '8px 16px' }}
          >
            Show All Routes
          </button>
        </div>

        {routes.length === 0 ? (
          <div className="empty-state">
            <p>{date ? `No routes found for ${new Date(date).toLocaleDateString()}.` : 'No routes found.'}</p>
            <Link to="/routes/create" className="btn-primary">
              Create First Route
            </Link>
          </div>
        ) : (
          <div className="routes-list">
            {routes.map(route => (
              <div key={route.id} className="route-card">
                <div className="route-header">
                  <h3>{route.name || 'Unnamed Route'}</h3>
                  <span className={`status-badge status-${route.status}`}>
                    {route.status}
                  </span>
                </div>
                <div className="route-details">
                  <div className="route-info-grid">
                    <div className="info-item">
                      <span className="info-label">Route ID:</span>
                      <span className="info-value">#{route.id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Salesperson:</span>
                      <span className="info-value">{route.salesperson_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Area:</span>
                      <span className="info-value">{route.area_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Date:</span>
                      <span className="info-value">{new Date(route.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Visits Progress:</span>
                      <span className="info-value">
                        {route.visited_count || 0} / {route.total_items || 0}
                        {route.total_items > 0 && (
                          <span className="progress-percentage">
                            ({Math.round(((route.visited_count || 0) / route.total_items) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    {route.total_distance && (
                      <div className="info-item">
                        <span className="info-label">Distance:</span>
                        <span className="info-value">{parseFloat(route.total_distance).toFixed(2)} km</span>
                      </div>
                    )}
                    {route.created_at && (
                      <div className="info-item">
                        <span className="info-label">Created:</span>
                        <span className="info-value">{new Date(route.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {route.updated_at && route.updated_at !== route.created_at && (
                      <div className="info-item">
                        <span className="info-label">Last Updated:</span>
                        <span className="info-value">{new Date(route.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                    {route.total_items > 0 && (
                      <div className="progress-bar-container" style={{ marginTop: '15px' }}>
                        <div className="progress-bar" style={{ 
                          width: `${Math.round(((route.visited_count || 0) / route.total_items) * 100)}%`,
                          backgroundColor: route.visited_count === route.total_items ? '#28a745' : 
                                         route.visited_count === 0 ? '#e74c3c' : '#f39c12',
                          height: '8px',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    )}
                    {route.total_items > 0 && route.visited_count < route.total_items && (
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        background: '#fff3cd', 
                        border: '1px solid #ffc107', 
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}>
                        <strong>⚠️ Coverage Alert:</strong> {route.total_items - (route.visited_count || 0)} school(s) not yet visited
                      </div>
                    )}
                  </div>
                  <div className="route-actions">
                    <button
                      onClick={() => toggleRouteExpansion(route.id)}
                      className="btn-secondary"
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      {expandedRoute === route.id ? 'Hide Details' : 'Show Uncovered'}
                    </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openRouteDetails(route.id)}
                  >
                    View Details
                  </button>
                  {user.role === 'admin' && (
                    <>
                      <Link to={`/routes/edit/${route.id}`} className="btn-primary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                        Edit
                      </Link>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(route.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
                
                {expandedRoute === route.id && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    background: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '5px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0 }}>Uncovered Schools</h4>
                      {loadingUncovered[route.id] ? (
                        <span style={{ color: '#666' }}>Loading...</span>
                      ) : (
                        <span style={{ color: '#666' }}>
                          {uncoveredSchools[route.id]?.count || 0} school(s) not covered
                        </span>
                      )}
                    </div>
                    
                    {loadingUncovered[route.id] ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>Loading uncovered schools...</div>
                    ) : uncoveredSchools[route.id]?.count > 0 ? (
                      <>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#e9ecef', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>School Name</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Type</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Status</th>
                                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Address</th>
                              </tr>
                            </thead>
                            <tbody>
                              {uncoveredSchools[route.id].uncovered_schools.map((school, idx) => (
                                <tr key={school.id || idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                  <td style={{ padding: '10px', fontSize: '13px' }}>{school.school_name}</td>
                                  <td style={{ padding: '10px', fontSize: '13px' }}>
                                    <span style={{ 
                                      padding: '3px 8px', 
                                      borderRadius: '3px', 
                                      background: school.type === 'school' ? '#e3f2fd' : '#f3e5f5',
                                      fontSize: '12px'
                                    }}>
                                      {school.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px', fontSize: '13px' }}>
                                    <span style={{ 
                                      padding: '3px 8px', 
                                      borderRadius: '3px', 
                                      background: '#fff3cd',
                                      color: '#856404',
                                      fontSize: '12px'
                                    }}>
                                      {school.visit_status || 'Not Visited'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                                    {school.address || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {user.role === 'admin' && (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              Move to next day:
                              <input
                                type="date"
                                value={nextDate}
                                onChange={(e) => setNextDate(e.target.value)}
                                min={new Date(new Date(route.date).getTime() + 86400000).toISOString().split('T')[0]}
                                style={{ 
                                  padding: '6px 10px', 
                                  border: '1px solid #ddd', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </label>
                            <button
                              onClick={() => handleMoveUncovered(route.id)}
                              disabled={!nextDate || moving}
                              className="btn-primary"
                              style={{ 
                                fontSize: '14px', 
                                padding: '8px 16px',
                                opacity: (!nextDate || moving) ? 0.6 : 1,
                                cursor: (!nextDate || moving) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {moving ? 'Moving...' : `Move ${uncoveredSchools[route.id].count} School(s)`}
                            </button>
                          </div>
                        )}
                      </>
                    ) : uncoveredSchools[route.id] ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px', 
                        color: '#28a745',
                        fontWeight: '500'
                      }}>
                        ✅ All schools in this route have been visited!
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                          Total schools: {route.total_items || 0} | Visited: {route.visited_count || 0}
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px', 
                        color: '#666'
                      }}>
                        Click "Show Uncovered" to check coverage status
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(routeDetailsLoading || routeDetails || routeDetailsError) && (
        <div className="route-details-modal-backdrop" onClick={closeRouteDetails} role="presentation">
          <div className="route-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="route-details-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Route Details</h3>
                {routeDetails?.id && (
                  <div className="route-details-modal-subtitle">
                    #{routeDetails.id} • {routeDetails.salesperson_name || 'N/A'} • {routeDetails.area_name || 'N/A'}
                  </div>
                )}
              </div>
              <button type="button" className="route-details-modal-close" onClick={closeRouteDetails}>
                ✕
              </button>
            </div>

            {routeDetailsLoading && <div style={{ padding: '14px' }}>Loading…</div>}
            {routeDetailsError && (
              <div className="route-details-modal-error">
                Failed to load route details: {routeDetailsError}
              </div>
            )}

            {routeDetails?.items && (
              <div className="route-details-table-wrap">
                <table className="route-details-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>School</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Photo</th>
                      <th>Visited At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeDetails.items.map((item, idx) => {
                      const photoSrc = toPhotoSrc(item.photo_url)
                      return (
                        <tr key={item.id || idx}>
                          <td>{item.order_index || idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.school_name || '-'}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{item.type || ''}</div>
                          </td>
                          <td>
                            <span className={`status-pill status-${item.visit_status || 'not_visited'}`}>
                              {item.visit_status ? item.visit_status.replaceAll('_', ' ') : 'not visited'}
                            </span>
                          </td>
                          <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>{item.notes || '-'}</td>
                          <td>
                            {photoSrc ? (
                              <a href={photoSrc} target="_blank" rel="noreferrer" title="Open full image">
                                <img className="route-photo-thumb" src={photoSrc} alt="Visit" loading="lazy" />
                              </a>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {item.visited_at ? new Date(item.visited_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default RoutesManagement
