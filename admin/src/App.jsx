import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import RoutesManagement from './components/RoutesManagement'
import CreateRoute from './components/CreateRoute'
import Reports from './components/Reports'
import Users from './components/Users'
import Schools from './components/Schools'
import CoverageMap from './components/CoverageMap'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
        {user && (
          <>
            <Route 
              path="/dashboard" 
              element={<Dashboard user={user} onLogout={handleLogout} />} 
            />
            <Route 
              path="/routes" 
              element={<RoutesManagement user={user} onLogout={handleLogout} />} 
            />
            <Route 
              path="/routes/create" 
              element={<CreateRoute user={user} onLogout={handleLogout} />} 
            />
            <Route 
              path="/routes/edit/:id" 
              element={<CreateRoute user={user} onLogout={handleLogout} />} 
            />
            <Route 
              path="/reports" 
              element={<Reports user={user} onLogout={handleLogout} />} 
            />
            <Route 
              path="/coverage-map" 
              element={<CoverageMap user={user} onLogout={handleLogout} />} 
            />
            {user.role === 'admin' && (
              <>
                <Route 
                  path="/users" 
                  element={<Users user={user} onLogout={handleLogout} />} 
                />
                <Route 
                  path="/schools" 
                  element={<Schools user={user} onLogout={handleLogout} />} 
                />
              </>
            )}
          </>
        )}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App

