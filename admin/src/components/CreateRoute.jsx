import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from './Layout'
import api from '../utils/api'
import './CreateRoute.css'

function CreateRoute({ user, onLogout }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const [areas, setAreas] = useState([])
  const [salespersons, setSalespersons] = useState([])
  const [schools, setSchools] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedSalesperson, setSelectedSalesperson] = useState('')
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0])
  const [routeName, setRouteName] = useState('')
  const [selectedSchools, setSelectedSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingRoute, setFetchingRoute] = useState(false)
  const [visitedSchools, setVisitedSchools] = useState({})
  const [existingRoutes, setExistingRoutes] = useState([])
  const [checkingVisits, setCheckingVisits] = useState(false)
  const [autoAssignMode, setAutoAssignMode] = useState(false)
  const [maxSchoolsPerRoute, setMaxSchoolsPerRoute] = useState(20)
  const [selectedSalespersons, setSelectedSalespersons] = useState([])
  const [excludeVisited, setExcludeVisited] = useState(true)

  useEffect(() => {
    fetchAreas()
    fetchSalespersons()
    if (isEditing) {
      fetchRoute()
    }
  }, [id])

  useEffect(() => {
    if (selectedArea) {
      fetchSchools(selectedArea)
      if (routeDate && !isEditing) {
        checkExistingRoutesAndVisits()
      }
    } else {
      setSchools([])
      setVisitedSchools({})
      setExistingRoutes([])
    }
  }, [selectedArea, routeDate])

  const checkExistingRoutesAndVisits = async () => {
    if (!selectedArea || !routeDate) return
    
    try {
      setCheckingVisits(true)
      // Check for existing routes for this area and date
      const routesResponse = await api.get(`/routes?date=${routeDate}`)
      const existing = Array.isArray(routesResponse.data) 
        ? routesResponse.data.filter(r => r.area_id == selectedArea)
        : []
      setExistingRoutes(existing)
      
      // Check which schools have been visited
      const visitedMap = {}
      for (const route of existing) {
        try {
          const routeDetails = await api.get(`/routes/${route.id}`)
          if (routeDetails.data.items) {
            routeDetails.data.items.forEach(item => {
              // Use last_visited_at if available (most recent visit across all routes), otherwise use visited_at
              const visitDate = item.last_visited_at || item.visited_at
              if ((item.visit_status === 'visited' || item.last_visited_at) && visitDate) {
                visitedMap[item.school_id] = {
                  visited: true,
                  visitedAt: visitDate,
                  routeName: route.name || `Route #${route.id}`,
                  salesperson: route.salesperson_name,
                  isRecentVisit: item.last_visited_at ? true : false
                }
              }
            })
          }
        } catch (err) {
          console.error(`Failed to fetch route ${route.id}:`, err)
        }
      }
      setVisitedSchools(visitedMap)
    } catch (err) {
      console.error('Failed to check existing routes:', err)
    } finally {
      setCheckingVisits(false)
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

  const fetchSalespersons = async () => {
    try {
      const response = await api.get('/users?role=salesperson')
      setSalespersons(response.data)
    } catch (err) {
      console.error('Failed to fetch salespersons:', err)
    }
  }

  const fetchRoute = async () => {
    try {
      setFetchingRoute(true)
      const response = await api.get(`/routes/${id}`)
      const route = response.data
      
      setSelectedSalesperson(route.salesperson_id.toString())
      setSelectedArea(route.area_id.toString())
      setRouteDate(route.date)
      setRouteName(route.name || '')
      
      // Set selected schools from route items
      if (route.items && route.items.length > 0) {
        const schoolIds = route.items.map(item => item.school_id)
        setSelectedSchools(schoolIds)
      }
      
      // Fetch schools for the area
      await fetchSchools(route.area_id)
    } catch (err) {
      console.error('Failed to fetch route:', err)
      alert('Failed to fetch route: ' + (err.response?.data?.error || err.message))
      navigate('/routes')
    } finally {
      setFetchingRoute(false)
    }
  }

  const fetchSchools = async (areaId) => {
    try {
      // Use no_pagination=true to get all schools for route creation
      const response = await api.get(`/schools?area_id=${areaId}&no_pagination=true`)
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(response.data)) {
        setSchools(response.data)
      } else {
        setSchools(response.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err)
      alert('Failed to fetch schools: ' + (err.response?.data?.error || err.message))
    }
  }

  const toggleSchool = (schoolId) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    )
  }

  const handleAutoAssign = async (e) => {
    e.preventDefault()
    
    if (!selectedArea || selectedSalespersons.length === 0 || selectedSchools.length === 0) {
      alert('Please select area, at least one salesperson, and at least one school')
      return
    }

    if (maxSchoolsPerRoute < 1) {
      alert('Max schools per route must be at least 1')
      return
    }

    const confirmMessage = `This will create ${Math.ceil(selectedSchools.length / maxSchoolsPerRoute)} route(s) and distribute ${selectedSchools.length} school(s) across ${selectedSalespersons.length} salesperson(s).\n\nMax schools per route: ${maxSchoolsPerRoute}\n\nContinue?`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/routes?auto_assign=true', {
        area_id: selectedArea,
        date: routeDate,
        salesperson_ids: selectedSalespersons,
        school_ids: selectedSchools,
        max_schools_per_route: maxSchoolsPerRoute,
        route_name_prefix: routeName || 'Auto Route',
        exclude_visited: excludeVisited
      })
      
      alert(response.data.message || `Successfully created ${response.data.total_routes} route(s)`)
      navigate('/routes')
    } catch (err) {
      alert('Failed to auto-assign routes: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (autoAssignMode) {
      handleAutoAssign(e)
      return
    }
    
    if (!selectedArea || !selectedSalesperson || selectedSchools.length === 0) {
      alert('Please select area, salesperson, and at least one school')
      return
    }

    // Check if any selected schools have already been visited
    const alreadyVisited = selectedSchools.filter(schoolId => visitedSchools[schoolId]?.visited)
    if (alreadyVisited.length > 0 && !isEditing) {
      const visitedNames = alreadyVisited.map(id => {
        const school = schools.find(s => s.id === id)
        return school?.name || `School #${id}`
      }).join(', ')
      
      const proceed = window.confirm(
        `Warning: ${alreadyVisited.length} school(s) have already been visited on ${new Date(routeDate).toLocaleDateString()}:\n\n${visitedNames}\n\nDo you want to create the route anyway?`
      )
      if (!proceed) {
        return
      }
    }

    setLoading(true)

    try {
      if (isEditing) {
        // Update route
        await api.put(`/routes/${id}`, {
          salesperson_id: selectedSalesperson,
          area_id: selectedArea,
          date: routeDate,
          name: routeName,
          school_ids: selectedSchools
        })
        alert('Route updated successfully!')
      } else {
        // Create route
        await api.post('/routes', {
          salesperson_id: selectedSalesperson,
          area_id: selectedArea,
          date: routeDate,
          name: routeName,
          school_ids: selectedSchools
        })
        alert('Route created successfully!')
      }
      navigate('/routes')
    } catch (err) {
      alert(`Failed to ${isEditing ? 'update' : 'create'} route: ` + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (fetchingRoute) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading">Loading route details...</div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="create-route">
        <h1>{isEditing ? 'Edit Route' : 'Create New Route'}</h1>

        <form onSubmit={handleSubmit} className="route-form">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={autoAssignMode}
                onChange={(e) => {
                  setAutoAssignMode(e.target.checked)
                  if (e.target.checked) {
                    setSelectedSalesperson('')
                  } else {
                    setSelectedSalespersons([])
                  }
                }}
                style={{ marginRight: '8px' }}
              />
              Auto-Assign Mode (Distribute across multiple routes)
            </label>
            {autoAssignMode && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                background: '#e3f2fd', 
                border: '1px solid #2196f3', 
                borderRadius: '5px',
                fontSize: '13px'
              }}>
                <strong>ℹ️ Auto-Assign:</strong> Schools will be automatically distributed across multiple routes and salespersons based on the max schools per route setting.
              </div>
            )}
          </div>

          <div className="form-row">
            {autoAssignMode ? (
              <div className="form-group" style={{ flex: 1 }}>
                <label>Select Salespersons * (Multiple)</label>
                <div style={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '10px',
                  background: 'white'
                }}>
                  {salespersons.map(sp => (
                    <label key={sp.id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedSalespersons.includes(sp.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSalespersons([...selectedSalespersons, sp.id.toString()])
                          } else {
                            setSelectedSalespersons(selectedSalespersons.filter(id => id !== sp.id.toString()))
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      {sp.name}
                    </label>
                  ))}
                </div>
                {selectedSalespersons.length === 0 && (
                  <small style={{ color: '#d32f2f', display: 'block', marginTop: '5px' }}>
                    Please select at least one salesperson
                  </small>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>Salesperson *</label>
                <select
                  value={selectedSalesperson}
                  onChange={(e) => setSelectedSalesperson(e.target.value)}
                  required
                >
                  <option value="">Select Salesperson</option>
                  {salespersons.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Area *</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                required
              >
                <option value="">Select Area</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                required
              />
              {checkingVisits && (
                <small style={{ color: '#3498db', display: 'block', marginTop: '5px' }}>
                  Checking for existing visits...
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Route Name {autoAssignMode ? '(Prefix)' : '(Optional)'}</label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder={autoAssignMode ? "e.g., Auto Route (will be numbered)" : "e.g., Morning Route - Chandra Layout"}
              />
            </div>
            {autoAssignMode && (
              <>
                <div className="form-group">
                  <label>Max Schools per Route *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxSchoolsPerRoute}
                    onChange={(e) => setMaxSchoolsPerRoute(Math.max(1, parseInt(e.target.value) || 20))}
                    required
                    style={{ width: '100%' }}
                  />
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    Schools will be distributed evenly across routes (max {maxSchoolsPerRoute} per route)
                  </small>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={excludeVisited}
                      onChange={(e) => setExcludeVisited(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    Exclude Already Visited Schools
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label>Select Schools/Colleges * ({selectedSchools.length} selected)</label>
              {selectedArea && schools.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSchools(schools.map(s => s.id))}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Select All ({schools.length})
                  </button>
                  {Object.keys(visitedSchools).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const unvisited = schools.filter(s => !visitedSchools[s.id]?.visited).map(s => s.id)
                        setSelectedSchools(unvisited)
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 10px', background: '#27ae60' }}
                    >
                      Select Unvisited Only
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSchools([])}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
            {selectedArea ? (
              <div className="schools-list">
                {existingRoutes.length > 0 && !isEditing && (
                  <div style={{ 
                    padding: '12px', 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '5px', 
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    <strong>⚠️ Warning:</strong> {existingRoutes.length} route(s) already exist for this area on {new Date(routeDate).toLocaleDateString()}:
                    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                      {existingRoutes.map(route => (
                        <li key={route.id}>
                          {route.name || `Route #${route.id}`} - {route.salesperson_name} ({route.visited_count || 0}/{route.total_items || 0} visited)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {schools.length > 0 ? (
                  <>
                    {schools.map(school => {
                      const isVisited = visitedSchools[school.id]?.visited
                      return (
                        <label 
                          key={school.id} 
                          className="school-checkbox"
                          style={isVisited ? { 
                            background: '#fff3cd', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginBottom: '5px',
                            border: '1px solid #ffc107'
                          } : {}}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSchools.includes(school.id)}
                            onChange={() => toggleSchool(school.id)}
                          />
                          <span>
                            <strong>{school.name}</strong> ({school.type})
                            {school.address && <span className="school-address"> - {school.address}</span>}
                            {isVisited && (
                              <span style={{ 
                                display: 'block', 
                                fontSize: '12px', 
                                color: '#e74c3c', 
                                marginTop: '4px',
                                fontWeight: '500'
                              }}>
                                ⚠️ Already visited on {new Date(visitedSchools[school.id].visitedAt).toLocaleDateString()} 
                                ({visitedSchools[school.id].routeName})
                              </span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                    {selectedSchools.length === 0 && (
                      <p style={{ color: '#d32f2f', marginTop: '10px' }}>
                        ⚠️ Please select at least one school/college to create a route
                      </p>
                    )}
                    {Object.keys(visitedSchools).length > 0 && (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '10px', 
                        background: '#e8f5e9', 
                        border: '1px solid #4caf50', 
                        borderRadius: '5px',
                        fontSize: '13px'
                      }}>
                        <strong>ℹ️ Info:</strong> {Object.keys(visitedSchools).length} school(s) in this area have already been visited on {new Date(routeDate).toLocaleDateString()}. 
                        They are highlighted in yellow above. You can still include them in the route if needed.
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="no-schools">No schools found in this area. Add schools first.</p>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/schools'}
                      className="btn-primary"
                      style={{ marginTop: '10px' }}
                    >
                      Go to Schools Management
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="select-area-hint">Please select an area first</p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/routes')} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={
                loading || 
                selectedSchools.length === 0 || 
                (autoAssignMode ? selectedSalespersons.length === 0 : !selectedSalesperson)
              } 
              className="btn-primary"
            >
              {loading 
                ? (isEditing ? 'Updating...' : autoAssignMode ? 'Auto-Assigning...' : 'Creating...') 
                : (isEditing ? 'Update Route' : autoAssignMode ? `Auto-Assign ${Math.ceil(selectedSchools.length / maxSchoolsPerRoute)} Route(s)` : 'Create Route')
              }
            </button>
          </div>
          {autoAssignMode && selectedSchools.length > 0 && selectedSalespersons.length > 0 && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: '#e8f5e9', 
              border: '1px solid #4caf50', 
              borderRadius: '5px',
              fontSize: '13px'
            }}>
              <strong>📊 Auto-Assign Preview:</strong>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>Total Schools: {selectedSchools.length}</li>
                <li>Salespersons: {selectedSalespersons.length}</li>
                <li>Max per Route: {maxSchoolsPerRoute}</li>
                <li>Estimated Routes: {Math.ceil(selectedSchools.length / maxSchoolsPerRoute)}</li>
                <li>Schools per Salesperson: ~{Math.ceil(selectedSchools.length / selectedSalespersons.length)}</li>
              </ul>
            </div>
          )}
        </form>
      </div>
    </Layout>
  )
}

export default CreateRoute

