import React, { useState, useEffect } from 'react'
import Layout from './Layout'
import api from '../utils/api'
import './Reports.css'

function Reports({ user, onLogout }) {
  const [reportType, setReportType] = useState('daily')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [salespersonId, setSalespersonId] = useState('')
  const [salespersons, setSalespersons] = useState([])
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user.role === 'admin') {
      fetchSalespersons()
    }
  }, [user])

  useEffect(() => {
    if (reportType === 'daily') {
      fetchDailyReport()
    }
  }, [reportType, date])

  const fetchSalespersons = async () => {
    try {
      const response = await api.get('/users?role=salesperson')
      setSalespersons(response.data)
    } catch (err) {
      console.error('Failed to fetch salespersons:', err)
    }
  }

  const fetchDailyReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: 'daily',
        date: date
      })
      if (user.role === 'admin' && salespersonId) {
        params.append('salesperson_id', salespersonId)
      }
      const response = await api.get(`/reports?${params}`)
      setReportData(response.data)
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalespersonReport = async () => {
    if (!salespersonId) {
      alert('Please select a salesperson')
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: 'salesperson',
        salesperson_id: salespersonId
      })
      if (startDate && endDate) {
        params.append('start_date', startDate)
        params.append('end_date', endDate)
      } else if (date) {
        params.append('date', date)
      }
      const response = await api.get(`/reports?${params}`)
      setReportData(response.data)
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUncovered = async () => {
    setLoading(true)
    try {
      const response = await api.get('/reports?type=uncovered')
      setReportData(response.data)
    } catch (err) {
      console.error('Failed to fetch uncovered schools:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    if (reportType === 'daily') {
      fetchDailyReport()
    } else if (reportType === 'salesperson') {
      fetchSalespersonReport()
    } else if (reportType === 'uncovered') {
      fetchUncovered()
    }
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="reports">
        <h1>Reports</h1>

        <div className="report-filters">
          <div className="form-group">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="daily">Daily Report</option>
              {user.role === 'admin' && (
                <>
                  <option value="salesperson">Salesperson Performance</option>
                  <option value="uncovered">Uncovered Schools</option>
                </>
              )}
            </select>
          </div>

          {reportType === 'daily' && (
            <>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              {user.role === 'admin' && (
                <div className="form-group">
                  <label>Salesperson (Optional)</label>
                  <select value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)}>
                    <option value="">All Salespersons</option>
                    {salespersons.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {reportType === 'salesperson' && (
            <>
              <div className="form-group">
                <label>Salesperson *</label>
                <select value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)} required>
                  <option value="">Select Salesperson</option>
                  {salespersons.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date Range (Optional)</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
              {!startDate && (
                <div className="form-group">
                  <label>Or Single Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <button onClick={handleGenerateReport} className="btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>

        {reportData && (
          <div className="report-results">
            {reportType === 'daily' && reportData.summary && (
              <>
                <div className="summary-cards">
                  <div className="summary-card">
                    <h3>Total Routes</h3>
                    <p>{reportData.summary.total_routes}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Total Visits</h3>
                    <p>{reportData.summary.total_visits}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Visited</h3>
                    <p className="visited">{reportData.summary.visited}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Not Visited</h3>
                    <p className="not-visited">{reportData.summary.not_visited}</p>
                  </div>
                  <div className="summary-card">
                    <h3>Follow-up</h3>
                    <p className="follow-up">{reportData.summary.follow_up}</p>
                  </div>
                  {reportData.summary.total_visits > 0 && (
                    <div className="summary-card" style={{ 
                      background: reportData.summary.not_visited > 0 ? '#fff3cd' : '#d4edda',
                      border: `2px solid ${reportData.summary.not_visited > 0 ? '#ffc107' : '#28a745'}`
                    }}>
                      <h3>Coverage Rate</h3>
                      <p style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: reportData.summary.not_visited > 0 ? '#856404' : '#155724'
                      }}>
                        {Math.round((reportData.summary.visited / reportData.summary.total_visits) * 100)}%
                      </p>
                    </div>
                  )}
                </div>
                {reportData.summary.not_visited > 0 && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '5px' 
                  }}>
                    <strong>⚠️ Coverage Alert:</strong> {reportData.summary.not_visited} school(s) were not visited on this date. 
                    Consider moving them to the next day's route from the Routes Management page.
                  </div>
                )}
              </>
            )}

            {reportData.visits && reportData.visits.length > 0 && (
              <div className="visits-table-container">
                <h2>Visit Details</h2>
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const table = document.querySelector('.visits-table tbody')
                      if (table) {
                        Array.from(table.children).forEach(row => {
                          const status = row.querySelector('.status-badge')?.textContent?.trim()
                          if (status && !status.includes('visited')) {
                            row.style.display = ''
                          } else {
                            row.style.display = 'none'
                          }
                        })
                      }
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Show Only Uncovered
                  </button>
                  <button
                    onClick={() => {
                      const table = document.querySelector('.visits-table tbody')
                      if (table) {
                        Array.from(table.children).forEach(row => {
                          row.style.display = ''
                        })
                      }
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Show All
                  </button>
                </div>
                <table className="visits-table">
                  <thead>
                    <tr>
                      <th>School</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Using Competitor</th>
                      <th>Visited At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.visits.map(visit => (
                      <tr 
                        key={visit.id}
                        style={{
                          background: visit.status === 'not_visited' || !visit.status ? '#fff3cd' : 
                                     visit.status === 'visited' ? '#d4edda' : 'transparent'
                        }}
                      >
                        <td>{visit.school_name}</td>
                        <td>{visit.type}</td>
                        <td>
                          <span className={`status-badge status-${visit.status}`}>
                            {visit.status?.replace('_', ' ') || 'Not Visited'}
                          </span>
                        </td>
                        <td>{visit.notes || '-'}</td>
                        <td>
                          {visit.using_competitor ? (
                            <span style={{ color: '#e74c3c', fontWeight: '500' }}>
                              Yes {visit.competitor_name && `(${visit.competitor_name})`}
                            </span>
                          ) : (
                            <span style={{ color: '#27ae60' }}>No</span>
                          )}
                        </td>
                        <td>{visit.visited_at ? new Date(visit.visited_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {Array.isArray(reportData) && reportData.length > 0 && (
              <div className="performance-table-container">
                <h2>Performance Report</h2>
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Routes</th>
                      <th>Total Visits</th>
                      <th>Visited</th>
                      <th>Follow-up</th>
                      <th>Distance (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map(row => (
                      <tr key={row.date}>
                        <td>{new Date(row.date).toLocaleDateString()}</td>
                        <td>{row.total_routes}</td>
                        <td>{row.total_visits}</td>
                        <td>{row.visited_count}</td>
                        <td>{row.follow_up_count}</td>
                        <td>{row.total_distance || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {Array.isArray(reportData) && reportData.length === 0 && (
              <p className="no-data">No data found</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Reports

