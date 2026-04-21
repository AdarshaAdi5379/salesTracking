import React, { useState, useEffect } from 'react'
import Layout from './Layout'
import api from '../utils/api'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    totalVisits: 0,
    completedVisits: 0
  })
  const [recentRoutes, setRecentRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's routes
      const routesRes = await api.get(`/routes?date=${today}`)
      const routes = routesRes.data

      // Get today's report
      const reportRes = await api.get(`/reports?type=daily&date=${today}`)
      const report = reportRes.data

      setStats({
        totalRoutes: routes.length,
        activeRoutes: routes.filter(r => r.status === 'active').length,
        totalVisits: report.summary?.total_visits || 0,
        completedVisits: report.summary?.visited || 0
      })

      setRecentRoutes(routes.slice(0, 5))
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading">Loading dashboard...</div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="dashboard">
        <h1>Dashboard</h1>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Routes Today</h3>
            <p className="stat-number">{stats.totalRoutes}</p>
          </div>
          <div className="stat-card">
            <h3>Active Routes</h3>
            <p className="stat-number">{stats.activeRoutes}</p>
          </div>
          <div className="stat-card">
            <h3>Total Visits</h3>
            <p className="stat-number">{stats.totalVisits}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Visits</h3>
            <p className="stat-number">{stats.completedVisits}</p>
          </div>
        </div>

        <div className="recent-routes">
          <h2>Recent Routes</h2>
          {recentRoutes.length > 0 ? (
            <table className="routes-table">
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>Salesperson</th>
                  <th>Area</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Visits</th>
                </tr>
              </thead>
              <tbody>
                {recentRoutes.map(route => (
                  <tr key={route.id}>
                    <td>{route.name || 'Unnamed Route'}</td>
                    <td>{route.salesperson_name}</td>
                    <td>{route.area_name}</td>
                    <td>{new Date(route.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${route.status}`}>
                        {route.status}
                      </span>
                    </td>
                    <td>{route.visited_count || 0} / {route.total_items || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No routes found for today</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard

