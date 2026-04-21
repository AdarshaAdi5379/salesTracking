import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import TodayRoute from './components/TodayRoute'
import VisitDetails from './components/VisitDetails'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === 'salesperson') {
        setUser(parsedUser)
      }
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
          element={user ? <Navigate to="/route" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <Navigate to="/route" /> : <Navigate to="/login" />} 
        />
        {user && (
          <>
            <Route 
              path="/route" 
              element={<TodayRoute user={user} onLogout={handleLogout} />} 
            />
            <Route 
              path="/visit/:routeItemId" 
              element={<VisitDetails user={user} onLogout={handleLogout} />} 
            />
          </>
        )}
        <Route path="*" element={<Navigate to={user ? "/route" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App

