import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './VisitDetails.css'

function VisitDetails({ user, onLogout }) {
  const { routeItemId } = useParams()
  const navigate = useNavigate()
  const [routeItem, setRouteItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const previousPreviewUrlRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [cameraStream, setCameraStream] = useState(null)
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
    competitor_name: '',
    deal_closed: false,
    deal_value: '',
    deal_issues: ''
  })
  const [currentLocation, setCurrentLocation] = useState(null)

  useEffect(() => {
    fetchRouteItem()
    getCurrentLocation()
  }, [routeItemId])

  useEffect(() => {
    return () => {
      stopCamera()
      if (previousPreviewUrlRef.current) {
        URL.revokeObjectURL(previousPreviewUrlRef.current)
        previousPreviewUrlRef.current = null
      }
    }
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
            competitor_name: '',
            deal_closed: !!item.deal_closed,
            deal_value: item.deal_value ?? '',
            deal_issues: item.deal_issues ?? ''
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch route item:', err)
    } finally {
      setLoading(false)
    }
  }

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop()
        }
      }
    } finally {
      streamRef.current = null
      setCameraStream(null)
      setCameraActive(false)
      setCameraReady(false)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    const stream = cameraStream
    if (!cameraActive || !video || !stream) return
    if (video.srcObject !== stream) video.srcObject = stream

    const onLoaded = () => {
      if (video.videoWidth && video.videoHeight) setCameraReady(true)
    }
    video.addEventListener('loadedmetadata', onLoaded)

    const startedAt = Date.now()
    const poll = window.setInterval(() => {
      if (video.videoWidth && video.videoHeight) {
        setCameraReady(true)
        window.clearInterval(poll)
        return
      }
      // Some browsers can show a stream while reporting 0x0 for a bit; unblock after a short grace period.
      if (Date.now() - startedAt > 5000) {
        setCameraReady(true)
        window.clearInterval(poll)
      }
    }, 200)
    ;(async () => {
      try {
        await video.play()
        onLoaded()
      } catch (err) {
        console.error('Video play failed:', err)
      }
    })()

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      window.clearInterval(poll)
    }
  }, [cameraActive, cameraStream])

  const startCamera = async () => {
    setCameraError(null)
    setCameraReady(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported in this browser.')
      return
    }

    try {
      setCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      })
      streamRef.current = stream
      setCameraStream(stream)
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Camera permission denied or camera unavailable.')
      stopCamera()
    }
  }

  const setPhotoFromBlob = (blob) => {
    if (blob.size > 5 * 1024 * 1024) {
      alert('Photo size must be less than 5MB')
      return
    }

    const fileType = blob.type || 'image/jpeg'
    const file = new File([blob], `visit_${Date.now()}.jpg`, { type: fileType })
    const previewUrl = URL.createObjectURL(blob)

    if (previousPreviewUrlRef.current) {
      URL.revokeObjectURL(previousPreviewUrlRef.current)
    }
    previousPreviewUrlRef.current = previewUrl

    setFormData((prev) => ({
      ...prev,
      photo: file,
      photoPreview: previewUrl
    }))
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const stream = cameraStream || streamRef.current
    const track = stream?.getVideoTracks?.()?.[0]
    const settings = track?.getSettings?.() || {}

    const width = video.videoWidth || settings.width || 1280
    const height = video.videoHeight || settings.height || 720
    if (!width || !height) {
      setCameraError('Camera not ready yet. Try again.')
      return
    }

    let blob = null
    try {
      // Prefer ImageCapture when available; avoids relying on video element metadata.
      if (track && typeof window !== 'undefined' && 'ImageCapture' in window) {
        const imageCapture = new window.ImageCapture(track)
        if (typeof imageCapture.takePhoto === 'function') {
          blob = await imageCapture.takePhoto()
        } else if (typeof imageCapture.grabFrame === 'function') {
          const bitmap = await imageCapture.grabFrame()
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(bitmap, 0, 0)
          blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.85)
          )
        }
      }
    } catch (err) {
      console.error('ImageCapture failed, falling back to canvas:', err)
    }

    if (!blob) {
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, width, height)
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      )
    }

    if (!blob) {
      setCameraError('Failed to capture photo.')
      return
    }

    setPhotoFromBlob(blob)
    stopCamera()
  }

  const removePhoto = () => {
    if (previousPreviewUrlRef.current) {
      URL.revokeObjectURL(previousPreviewUrlRef.current)
      previousPreviewUrlRef.current = null
    }
    setFormData((prev) => ({
      ...prev,
      photo: null,
      photoPreview: null
    }))
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
        competitor_name: formData.using_competitor ? formData.competitor_name : null,
        deal_closed: formData.deal_closed,
        deal_value: formData.deal_closed && formData.deal_value !== '' ? Number(formData.deal_value) : null,
        deal_issues: formData.deal_closed ? (formData.deal_issues || null) : null
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
                checked={formData.deal_closed}
                onChange={(e) => setFormData({ ...formData, deal_closed: e.target.checked, deal_value: e.target.checked ? formData.deal_value : '', deal_issues: e.target.checked ? formData.deal_issues : '' })}
                style={{ marginRight: '8px' }}
              />
              Deal Closed
            </label>
            {formData.deal_closed && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Approximate Deal Value</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={formData.deal_value}
                    onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                    placeholder="Enter amount (approx)"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Any Issues</label>
                  <textarea
                    value={formData.deal_issues}
                    onChange={(e) => setFormData({ ...formData, deal_issues: e.target.value })}
                    rows="3"
                    placeholder="Describe any issues (optional)..."
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                  />
                </div>
              </div>
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
            {cameraError && <div className="camera-error">{cameraError}</div>}

            {cameraActive && (
              <div className="camera-box">
                <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-actions">
                  <button type="button" className="btn-camera" onClick={capturePhoto}>
                    Capture
                  </button>
                  <button type="button" className="btn-camera-secondary" onClick={stopCamera}>
                    Cancel
                  </button>
                </div>
                {!cameraReady && <div className="camera-hint">Starting camera…</div>}
              </div>
            )}

            {!cameraActive && (
              <div className="camera-actions">
                <button type="button" className="btn-camera" onClick={startCamera}>
                  {formData.photoPreview ? 'Retake Photo' : 'Open Camera'}
                </button>
                {formData.photoPreview && (
                  <button type="button" className="btn-camera-secondary" onClick={removePhoto}>
                    Remove
                  </button>
                )}
              </div>
            )}
            <small>Max size: 5MB (captured as JPEG)</small>
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
