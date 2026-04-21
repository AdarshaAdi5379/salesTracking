import React, { useState, useEffect } from 'react'
import Layout from './Layout'
import api from '../utils/api'
import './Schools.css'

function Schools({ user, onLogout }) {
  const [schools, setSchools] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false
  })
  const [showForm, setShowForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingSchool, setEditingSchool] = useState(null)
  const [filterArea, setFilterArea] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkData, setBulkData] = useState('')
  const [bulkArea, setBulkArea] = useState('')
  const [bulkType, setBulkType] = useState('school')
  const [showGoogleImport, setShowGoogleImport] = useState(false)
  const [googleSearchQuery, setGoogleSearchQuery] = useState('')
  const [googleSearchLocation, setGoogleSearchLocation] = useState('')
  const [googleSearchType, setGoogleSearchType] = useState('school')
  const [googleResults, setGoogleResults] = useState([])
  const [selectedGoogleResults, setSelectedGoogleResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showAddArea, setShowAddArea] = useState(false)
  const [newArea, setNewArea] = useState({ name: '', city: '', state: '' })
  const [addingArea, setAddingArea] = useState(false)
  const [formData, setFormData] = useState({
    area_id: '',
    name: '',
    type: 'school',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    contact_person: '',
    additional_fields: {}
  })
  const [additionalFields, setAdditionalFields] = useState([])

  useEffect(() => {
    fetchAreas()
    fetchSchools(1)
  }, [])

  useEffect(() => {
    if (currentPage === 1) {
      fetchSchools(1)
    } else {
      setCurrentPage(1) // Reset to first page when filter changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterArea, searchQuery])

  useEffect(() => {
    fetchSchools(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage])

  const fetchAreas = async () => {
    try {
      const response = await api.get('/areas')
      setAreas(response.data)
    } catch (err) {
      console.error('Failed to fetch areas:', err)
    }
  }

  const handleAddArea = async (e) => {
    e.preventDefault()
    
    if (!newArea.name.trim()) {
      alert('Area name is required')
      return
    }

    setAddingArea(true)
    try {
      const response = await api.post('/areas', newArea)
      alert('Area created successfully!')
      setShowAddArea(false)
      setNewArea({ name: '', city: '', state: '' })
      await fetchAreas()
      // Auto-select the newly created area in the active form
      const newAreaId = response.data.id.toString()
      setBulkArea(newAreaId)
      // Also update formData if the regular form is open
      if (showForm && !formData.area_id) {
        setFormData({ ...formData, area_id: newAreaId })
      }
    } catch (err) {
      alert('Failed to create area: ' + (err.response?.data?.error || err.message))
    } finally {
      setAddingArea(false)
    }
  }

  const fetchSchools = async (page = currentPage) => {
    try {
      setLoading(true)
      let url = `/schools?page=${page}&limit=${itemsPerPage}`
      if (filterArea) {
        url += `&area_id=${filterArea}`
      }
      if (searchQuery && searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`
      }
      const response = await api.get(url)
      
      // Handle both old format (array) and new format (object with data and pagination)
      if (Array.isArray(response.data)) {
        setSchools(response.data)
        setPagination({
          total: response.data.length,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrev: false
        })
      } else {
        setSchools(response.data.data || [])
        setPagination(response.data.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: page,
          hasNext: false,
          hasPrev: false
        })
        setCurrentPage(response.data.pagination?.current_page || page)
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert additional fields array to object
      const additionalFieldsObj = {}
      additionalFields.forEach(field => {
        if (field.key && field.key.trim()) {
          additionalFieldsObj[field.key.trim()] = field.value || ''
        }
      })

      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        additional_fields: Object.keys(additionalFieldsObj).length > 0 ? additionalFieldsObj : null
      }
      if (editingSchool) {
        await api.put(`/schools/${editingSchool.id}`, data)
      } else {
        await api.post('/schools', data)
      }
      setShowForm(false)
      setEditingSchool(null)
      setFormData({ area_id: '', name: '', type: 'school', address: '', latitude: '', longitude: '', phone: '', email: '', contact_person: '', additional_fields: {} })
      setAdditionalFields([])
      fetchSchools(currentPage)
    } catch (err) {
      alert('Failed to save school: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleEdit = (school) => {
    setEditingSchool(school)
    setFormData({
      area_id: school.area_id,
      name: school.name,
      type: school.type,
      address: school.address || '',
      latitude: school.latitude || '',
      longitude: school.longitude || '',
      phone: school.phone || '',
      email: school.email || '',
      contact_person: school.contact_person || '',
      additional_fields: school.additional_fields || {}
    })
    
    // Convert additional_fields object to array for editing
    const fieldsArray = []
    if (school.additional_fields) {
      try {
        const fields = typeof school.additional_fields === 'string' 
          ? JSON.parse(school.additional_fields) 
          : school.additional_fields
        Object.keys(fields).forEach(key => {
          fieldsArray.push({ key, value: fields[key] })
        })
      } catch (e) {
        console.error('Error parsing additional_fields:', e)
      }
    }
    setAdditionalFields(fieldsArray)
    setShowForm(true)
  }

  const addAdditionalField = () => {
    setAdditionalFields([...additionalFields, { key: '', value: '' }])
  }

  const removeAdditionalField = (index) => {
    setAdditionalFields(additionalFields.filter((_, i) => i !== index))
  }

  const updateAdditionalField = (index, field, value) => {
    const updated = [...additionalFields]
    updated[index] = { ...updated[index], [field]: value }
    setAdditionalFields(updated)
  }

  const handleDelete = async (schoolId) => {
    if (!window.confirm('Are you sure you want to delete this school?')) {
      return
    }
    try {
      await api.delete(`/schools/${schoolId}`)
      fetchSchools()
    } catch (err) {
      alert('Failed to delete school: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleGoogleSearch = async (e) => {
    e.preventDefault()
    
    if (!googleSearchQuery && !googleSearchLocation) {
      alert('Please enter a search query or location')
      return
    }

    setSearching(true)
    try {
      const response = await api.post('/places', {
        query: googleSearchQuery,
        location: googleSearchLocation,
        type: googleSearchType
      })
      
      setGoogleResults(response.data.results || [])
      setSelectedGoogleResults([])
    } catch (err) {
      alert('Failed to search Google Places: ' + (err.response?.data?.error || err.message))
    } finally {
      setSearching(false)
    }
  }

  const toggleGoogleResult = (index) => {
    setSelectedGoogleResults(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleGoogleImport = async () => {
    if (selectedGoogleResults.length === 0) {
      alert('Please select at least one school/college to import')
      return
    }

    if (!bulkArea) {
      alert('Please select an area first')
      return
    }

    setImporting(true)
    try {
      const schoolsToImport = selectedGoogleResults.map(index => {
        const result = googleResults[index]
        return {
          area_id: parseInt(bulkArea),
          name: result.name,
          type: googleSearchType,
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
          phone: result.phone || '',
          email: '',
          contact_person: ''
        }
      })

      const response = await api.post('/schools', { schools: schoolsToImport })
      alert(response.data.message || `Successfully imported ${response.data.success_count} schools`)
      setShowGoogleImport(false)
      setGoogleResults([])
      setSelectedGoogleResults([])
      fetchSchools()
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      const details = err.response?.data?.errors ? '\n\nErrors:\n' + err.response.data.errors.join('\n') : ''
      alert('Import failed: ' + errorMsg + details)
    } finally {
      setImporting(false)
    }
  }

  const handleBulkImport = async (e) => {
    e.preventDefault()
    
    if (!bulkArea || !bulkData.trim()) {
      alert('Please select an area and enter school data')
      return
    }

    // Parse bulk data - one school per line, format: Name|Address|Phone|Email|Contact Person|Latitude|Longitude
    const lines = bulkData.trim().split('\n').filter(line => line.trim())
    const schools = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split('|').map(p => p.trim())
      if (parts.length < 1 || !parts[0]) {
        continue // Skip empty lines
      }

      schools.push({
        area_id: parseInt(bulkArea),
        name: parts[0] || '',
        type: bulkType,
        address: parts[1] || '',
        phone: parts[2] || '',
        email: parts[3] || '',
        contact_person: parts[4] || '',
        latitude: parts[5] ? parseFloat(parts[5]) : null,
        longitude: parts[6] ? parseFloat(parts[6]) : null
      })
    }

    if (schools.length === 0) {
      alert('No valid schools found in the data')
      return
    }

    try {
      const response = await api.post('/schools', { schools })
      alert(response.data.message || `Successfully imported ${response.data.success_count} schools`)
      setShowBulkImport(false)
      setBulkData('')
      fetchSchools()
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      const details = err.response?.data?.errors ? '\n\nErrors:\n' + err.response.data.errors.join('\n') : ''
      alert('Bulk import failed: ' + errorMsg + details)
    }
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading">Loading schools...</div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="schools">
        <div className="page-header">
          <h1>Schools & Colleges Management</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { 
              setShowForm(true); 
              setEditingSchool(null); 
              setFormData({ area_id: '', name: '', type: 'school', address: '', latitude: '', longitude: '', phone: '', email: '', contact_person: '', additional_fields: {} }); 
              setAdditionalFields([]) 
            }} className="btn-primary">
              Add New School/College
            </button>
            <button onClick={() => { setShowBulkImport(true); setBulkData(''); setBulkArea(''); setBulkType('school') }} className="btn-primary" style={{ background: '#28a745' }}>
              Bulk Import
            </button>
            <button onClick={() => { setShowGoogleImport(true); setGoogleSearchQuery(''); setGoogleSearchLocation(''); setGoogleSearchType('school'); setGoogleResults([]); setSelectedGoogleResults([]) }} className="btn-primary" style={{ background: '#4285f4' }}>
              Import from Google
            </button>
          </div>
        </div>

        <div className="filter-section" style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
          <label style={{ flex: '1', minWidth: '200px' }}>
            Filter by Area:
            <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
              <option value="">All Areas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </label>
          <label style={{ flex: '1', minWidth: '200px' }}>
            Search by Location/Name:
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., vijaynagar, school name"
              style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </label>
        </div>

        {showGoogleImport && (
          <div className="school-form-container" style={{ marginBottom: '20px' }}>
            <div className="school-form">
              <h2>Import from Google Places</h2>
              <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                Search for schools/colleges using Google Places API. Results will include name, address, coordinates, and contact information.
              </p>
              
              <form onSubmit={handleGoogleSearch}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Search Query (Optional)</label>
                    <input
                      type="text"
                      value={googleSearchQuery}
                      onChange={(e) => setGoogleSearchQuery(e.target.value)}
                      placeholder="e.g., St. Mary's, ABC School"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      value={googleSearchLocation}
                      onChange={(e) => setGoogleSearchLocation(e.target.value)}
                      placeholder="e.g., Bangalore, Karnataka"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      value={googleSearchType}
                      onChange={(e) => setGoogleSearchType(e.target.value)}
                      required
                    >
                      <option value="school">School</option>
                      <option value="college">College</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => { setShowGoogleImport(false); setGoogleResults([]) }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={searching} className="btn-primary">
                    {searching ? 'Searching...' : 'Search Google Places'}
                  </button>
                </div>
              </form>

              {googleResults.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Search Results ({googleResults.length} found)</h3>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedGoogleResults(googleResults.map((_, i) => i))}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px', marginRight: '10px' }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGoogleResults([])}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label>Select Area for Import *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddArea(true)}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        + Add New Area
                      </button>
                    </div>
                    {showAddArea ? (
                      <div style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px', marginBottom: '10px' }}>
                        <h4 style={{ marginTop: '0', marginBottom: '10px' }}>Add New Area</h4>
                        <form onSubmit={handleAddArea}>
                          <div className="form-row">
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                              <label>Area Name *</label>
                              <input
                                type="text"
                                value={newArea.name}
                                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                                placeholder="e.g., Chandra Layout"
                                required
                                style={{ width: '100%', padding: '8px' }}
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                              <label>City</label>
                              <input
                                type="text"
                                value={newArea.city}
                                onChange={(e) => setNewArea({ ...newArea, city: e.target.value })}
                                placeholder="e.g., Bangalore"
                                style={{ width: '100%', padding: '8px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                              <label>State</label>
                              <input
                                type="text"
                                value={newArea.state}
                                onChange={(e) => setNewArea({ ...newArea, state: e.target.value })}
                                placeholder="e.g., Karnataka"
                                style={{ width: '100%', padding: '8px' }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="submit"
                              disabled={addingArea}
                              className="btn-primary"
                              style={{ fontSize: '12px', padding: '5px 15px' }}
                            >
                              {addingArea ? 'Creating...' : 'Create Area'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddArea(false); setNewArea({ name: '', city: '', state: '' }) }}
                              className="btn-secondary"
                              style={{ fontSize: '12px', padding: '5px 15px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <select
                        value={bulkArea}
                        onChange={(e) => setBulkArea(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                      >
                        <option value="">Select Area</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
                    {googleResults.map((result, index) => (
                      <label key={index} style={{ display: 'block', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedGoogleResults.includes(index)}
                          onChange={() => toggleGoogleResult(index)}
                          style={{ marginRight: '10px' }}
                        />
                        <div>
                          <strong>{result.name}</strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            {result.address && <div>📍 {result.address}</div>}
                            {result.phone && <div>📞 {result.phone}</div>}
                            {result.website && <div>🌐 {result.website}</div>}
                            {result.latitude && result.longitude && (
                              <div>📍 Coordinates: {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}</div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="form-actions" style={{ marginTop: '15px' }}>
                    {(!bulkArea || selectedGoogleResults.length === 0) && (
                      <div style={{ marginBottom: '10px', padding: '10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '5px', fontSize: '14px' }}>
                        {!bulkArea && <div>⚠️ Please select an area first</div>}
                        {bulkArea && selectedGoogleResults.length === 0 && <div>⚠️ Please select at least one school/college to import</div>}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleGoogleImport}
                      disabled={importing || selectedGoogleResults.length === 0 || !bulkArea}
                      className="btn-primary"
                      style={{
                        opacity: (importing || selectedGoogleResults.length === 0 || !bulkArea) ? 0.6 : 1,
                        cursor: (importing || selectedGoogleResults.length === 0 || !bulkArea) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {importing ? 'Importing...' : `Import Selected (${selectedGoogleResults.length})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showBulkImport && (
          <div className="school-form-container" style={{ marginBottom: '20px' }}>
            <form onSubmit={handleBulkImport} className="school-form">
              <h2>Bulk Import Schools/Colleges</h2>
              <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                Enter one school per line. Format: Name|Address|Phone|Email|Contact Person|Latitude|Longitude<br/>
                Example: ABC School|123 Main St|1234567890|abc@example.com|John Doe|12.9716|77.5946
              </p>
              
              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label>Area *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddArea(true)}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      + Add New Area
                    </button>
                  </div>
                  {showAddArea ? (
                    <div style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px', marginBottom: '10px' }}>
                      <h4 style={{ marginTop: '0', marginBottom: '10px' }}>Add New Area</h4>
                      <form onSubmit={handleAddArea}>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label>Area Name *</label>
                            <input
                              type="text"
                              value={newArea.name}
                              onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                              placeholder="e.g., Chandra Layout"
                              required
                              style={{ width: '100%', padding: '8px' }}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label>City</label>
                            <input
                              type="text"
                              value={newArea.city}
                              onChange={(e) => setNewArea({ ...newArea, city: e.target.value })}
                              placeholder="e.g., Bangalore"
                              style={{ width: '100%', padding: '8px' }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label>State</label>
                            <input
                              type="text"
                              value={newArea.state}
                              onChange={(e) => setNewArea({ ...newArea, state: e.target.value })}
                              placeholder="e.g., Karnataka"
                              style={{ width: '100%', padding: '8px' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="submit"
                            disabled={addingArea}
                            className="btn-primary"
                            style={{ fontSize: '12px', padding: '5px 15px' }}
                          >
                            {addingArea ? 'Creating...' : 'Create Area'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddArea(false); setNewArea({ name: '', city: '', state: '' }) }}
                            className="btn-secondary"
                            style={{ fontSize: '12px', padding: '5px 15px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <select
                      value={bulkArea}
                      onChange={(e) => setBulkArea(e.target.value)}
                      required
                    >
                      <option value="">Select Area</option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value)}
                    required
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>School Data (one per line) *</label>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  rows="10"
                  placeholder="ABC School|123 Main St|1234567890|abc@example.com|John Doe|12.9716|77.5946&#10;XYZ College|456 Park Ave|0987654321|xyz@example.com|Jane Smith|12.9352|77.6245"
                  required
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setShowBulkImport(false); setBulkData('') }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Import Schools
                </button>
              </div>
            </form>
          </div>
        )}

        {showForm && (
          <div className="school-form-container">
            <form onSubmit={handleSubmit} className="school-form">
              <h2>{editingSchool ? 'Edit School/College' : 'Add New School/College'}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Area *</label>
                  <select
                    value={formData.area_id}
                    onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                    required
                  >
                    <option value="">Select Area</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label>Additional Fields</label>
                  <button
                    type="button"
                    onClick={addAdditionalField}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 15px' }}
                  >
                    + Add Field
                  </button>
                </div>
                {additionalFields.length > 0 && (
                  <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '10px', background: '#f8f9fa' }}>
                    {additionalFields.map((field, index) => (
                      <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Field Name"
                          value={field.key}
                          onChange={(e) => updateAdditionalField(index, 'key', e.target.value)}
                          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          placeholder="Field Value"
                          value={field.value}
                          onChange={(e) => updateAdditionalField(index, 'value', e.target.value)}
                          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalField(index)}
                          style={{ padding: '8px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {additionalFields.length === 0 && (
                  <p style={{ color: '#7f8c8d', fontSize: '14px', fontStyle: 'italic' }}>
                    No additional fields. Click "Add Field" to add custom fields.
                  </p>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { 
                  setShowForm(false); 
                  setEditingSchool(null); 
                  setFormData({ area_id: '', name: '', type: 'school', address: '', latitude: '', longitude: '', phone: '', email: '', contact_person: '', additional_fields: {} }); 
                  setAdditionalFields([]) 
                }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSchool ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="schools-table-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <strong>Total: {pagination.total} schools</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '14px' }}>Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
                style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {schools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              No schools found
            </div>
          ) : (
            <>
              <table className="schools-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Area</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => (
                    <tr key={school.id}>
                      <td>{school.name}</td>
                      <td>
                        <span className={`type-badge type-${school.type}`}>
                          {school.type}
                        </span>
                      </td>
                      <td>{school.area_name || '-'}</td>
                      <td>{school.address || '-'}</td>
                      <td>
                        {school.phone && <div>📞 {school.phone}</div>}
                        {school.contact_person && <div>👤 {school.contact_person}</div>}
                        {school.additional_fields && (() => {
                          try {
                            const fields = typeof school.additional_fields === 'string' 
                              ? JSON.parse(school.additional_fields) 
                              : school.additional_fields
                            return Object.keys(fields).map(key => (
                              <div key={key} style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                                <strong>{key}:</strong> {fields[key]}
                              </div>
                            ))
                          } catch (e) {
                            return null
                          }
                        })()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleEdit(school)} className="btn-edit">Edit</button>
                          <button onClick={() => handleDelete(school.id)} className="btn-delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={!pagination.hasPrev}
                    className="pagination-btn"
                  >
                    «« First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="pagination-btn"
                  >
                    « Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="pagination-btn"
                  >
                    Next »
                  </button>
                  <button
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    disabled={!pagination.hasNext}
                    className="pagination-btn"
                  >
                    Last »»
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Schools

