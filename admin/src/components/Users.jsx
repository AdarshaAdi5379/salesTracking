import React, { useState, useEffect } from 'react'
import Layout from './Layout'
import api from '../utils/api'
import './Users.css'

function Users({ user, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'salesperson',
    phone: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData)
      } else {
        await api.post('/users', formData)
      }
      setShowForm(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'salesperson', phone: '' })
      fetchUsers()
    } catch (err) {
      alert('Failed to save user: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleEdit = (userData) => {
    setEditingUser(userData)
    setFormData({
      name: userData.name,
      email: userData.email,
      password: '',
      role: userData.role,
      phone: userData.phone || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }
    try {
      await api.delete(`/users/${userId}`)
      fetchUsers()
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading">Loading users...</div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="users">
        <div className="page-header">
          <h1>Users Management</h1>
          <button onClick={() => { setShowForm(true); setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'salesperson', phone: '' }) }} className="btn-primary">
            Add New User
          </button>
        </div>

        {showForm && (
          <div className="user-form-container">
            <form onSubmit={handleSubmit} className="user-form">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
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
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="salesperson">Salesperson</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null) }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(u)} className="btn-edit">Edit</button>
                      {u.id !== user.id && (
                        <button onClick={() => handleDelete(u.id)} className="btn-delete">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default Users

