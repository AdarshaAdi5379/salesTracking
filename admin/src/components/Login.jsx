import React, { useState } from 'react'
import api from '../utils/api'
import './Login.css'

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth', {
        action: 'login',
        email,
        password
      })

      if (response.data.success) {
        onLogin(response.data.user, response.data.token)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed'
      setError(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth', {
        action: 'register',
        name,
        email,
        password,
        role
      })

      if (response.data.success) {
        // Automatically login after registration
        const loginResponse = await api.post('/auth', {
          action: 'login',
          email,
          password
        })

        if (loginResponse.data.success) {
          onLogin(loginResponse.data.user, loginResponse.data.token)
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    if (isRegister) {
      handleRegister(e)
    } else {
      handleLogin(e)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Edubricz Sales Tracking</h1>
        <h2>{isRegister ? 'Create Account' : 'Admin Login'}</h2>
        
        <div className="auth-toggle">
          <button
            type="button"
            className={`toggle-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false)
              setError('')
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`toggle-btn ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true)
              setError('')
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={isRegister ? "your@email.com" : "admin@example.com"}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={isRegister ? "Minimum 6 characters" : "admin123"}
            />
          </div>
          
          {isRegister && (
            <>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                />
              </div>
              
              <div className="form-group">
                <label>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="salesperson">Salesperson</option>
                </select>
              </div>
            </>
          )}
          
          <button type="submit" disabled={loading}>
            {loading 
              ? (isRegister ? 'Creating account...' : 'Logging in...') 
              : (isRegister ? 'Create Account' : 'Login')
            }
          </button>
        </form>
        
        {!isRegister && (
          <p className="login-hint">Default: admin@example.com / admin123</p>
        )}
      </div>
    </div>
  )
}

export default Login

