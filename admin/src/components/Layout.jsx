import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout({ children, user, onLogout }) {
  const location = useLocation()

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Edubricz Sales Tracking</h2>
          <p className="user-info">{user.name} ({user.role})</p>
        </div>
        <ul className="nav-menu">
          <li>
            <Link 
              to="/dashboard" 
              className={location.pathname === '/dashboard' ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/routes" 
              className={location.pathname.startsWith('/routes') ? 'active' : ''}
            >
              Routes
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={location.pathname === '/reports' ? 'active' : ''}
            >
              Reports
            </Link>
          </li>
          <li>
            <Link 
              to="/coverage-map" 
              className={location.pathname === '/coverage-map' ? 'active' : ''}
            >
              Coverage Map
            </Link>
          </li>
          {user.role === 'admin' && (
            <>
              <li>
                <Link 
                  to="/users" 
                  className={location.pathname === '/users' ? 'active' : ''}
                >
                  Users
                </Link>
              </li>
              <li>
                <Link 
                  to="/schools" 
                  className={location.pathname === '/schools' ? 'active' : ''}
                >
                  Schools/Colleges
                </Link>
              </li>
            </>
          )}
        </ul>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout

