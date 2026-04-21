import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './VisitDetails.css'

function VisitDetails({ user, onLogout }) {
  const { routeItemId } = useParams()
  const navigate = useNavigate()
  const [routeItem, setRouteItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    status: 'visited',
    notes: '',
    photo: null,
    photoPreview: null,
    updateContact: false,
    phone: '',
    email: '',
    contact_person: '',
    using_competitor: false,
    competitor_name: ''
  })
  const [currentLocation, setCurrentLocation] = useState(null)

  useEffect(() => {
    fetchRouteItem()
    getCurrentLocation()
  }, [routeItemId])

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

  const fetchRouteItem = async () => {
    try {
      // Get route to find the item
      const today = new Date().toISOString().split('T')[0]
      const routesResponse = await api.get(`/routes?date=${today}`)
      const routes = routesResponse.data.filter(r => r.status === 'active')
      
      if (routes.length > 0) {
        const routeResponse = await api.get(`/routes/${routes[0].id}`)
        const item = routeResponse.data.items.find(i => i.id === parseInt(routeItemId))
        
        if (item) {
          setRouteItem(item)
          setFormData({
            status: item.visit_status || 'visited',
            notes: item.notes || '',
            photo: null,
            photoPreview: item.photo_url || null,
            updateContact: false,
            phone: item.phone || '',
            email: item.email || '',
            contact_person: item.contact_person || '',
            using_competitor: false,
            competitor_name: ''
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch route item:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB')
        return
      }
      setFormData({
        ...formData,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let photoUrl = formData.photoPreview

      // Upload photo if new one is selected
      if (formData.photo) {
        const formDataUpload = new FormData()
        formDataUpload.append('photo', formData.photo)
        
        const uploadResponse = await api.post('/upload', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        photoUrl = uploadResponse.data.photo_url
      }

      // Save visit
      const visitData = {
        route_item_id: parseInt(routeItemId),
        status: formData.status,
        notes: formData.notes,
        photo_url: photoUrl,
        latitude: currentLocation?.lat || null,
        longitude: currentLocation?.lng || null,
        using_competitor: formData.using_competitor,
        competitor_name: formData.using_competitor ? formData.competitor_name : null
      }

      // Include contact updates if updateContact is true
      if (formData.updateContact) {
        visitData.update_school_contact = {
          phone: formData.phone || null,
          email: formData.email || null,
          contact_person: formData.contact_person || null
        }
        visitData.school_id = routeItem.school_id
      }

      await api.post('/visits', visitData)

      alert('Visit updated successfully!')
      navigate('/route')
    } catch (err) {
      alert('Failed to update visit: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="loading">Loading visit details...</div>
      </div>
    )
  }

  if (!routeItem) {
    return (
      <div className="mobile-container">
        <div className="header">
          <button onClick={() => navigate('/route')} className="back-btn">← Back</button>
          <h1>Visit Details</h1>
          <div style={{ width: '60px' }}></div>
        </div>
        <div className="empty-state">
          <p>Visit not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <div className="header">
        <button onClick={() => navigate('/route')} className="back-btn">← Back</button>
        <h1>Update Visit</h1>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="visit-details">
        <div className="school-info">
          <h2>{routeItem.school_name}</h2>
          <p className="school-type">{routeItem.type}</p>
          {routeItem.address && <p className="school-address">{routeItem.address}</p>}
          {routeItem.phone && <p className="school-contact">📞 {routeItem.phone}</p>}
          {routeItem.contact_person && <p className="school-contact">👤 {routeItem.contact_person}</p>}
        </div>

        <form onSubmit={handleSubmit} className="visit-form">
          <div className="form-group">
            <label>Visit Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="visited">✅ Visited</option>
              <option value="not_visited">❌ Not Visited</option>
              <option value="follow_up">🔁 Follow-up</option>
              <option value="meeting_scheduled">📅 Meeting Scheduled</option>
              <option value="invalid_location">⚠️ Invalid Location</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="4"
              placeholder="Add any notes about this visit..."
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.using_competitor}
                onChange={(e) => setFormData({ ...formData, using_competitor: e.target.checked, competitor_name: e.target.checked ? formData.competitor_name : '' })}
                style={{ marginRight: '8px' }}
              />
              Already using another product/service?
            </label>
            {formData.using_competitor && (
              <input
                type="text"
                value={formData.competitor_name}
                onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                placeholder="Enter competitor/product name..."
                style={{ marginTop: '8px', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            )}
          </div>

          <div className="form-group" style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.updateContact}
                onChange={(e) => setFormData({ ...formData, updateContact: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Update Contact Details
            </label>
            {formData.updateContact && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={routeItem.phone || 'Enter phone number'}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={routeItem.email || 'Enter email address'}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder={routeItem.contact_person || 'Enter contact person name'}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Photo</label>
            {formData.photoPreview && (
              <div className="photo-preview">
                <img src={formData.photoPreview} alt="Preview" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="file-input"
            />
            <small>Max size: 5MB (JPEG, PNG, GIF, WebP)</small>
          </div>

          {currentLocation && (
            <div className="location-info">
              <p>📍 GPS Location captured</p>
              <small>Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}</small>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/route')} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-submit">
              {saving ? 'Saving...' : 'Save Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VisitDetails

