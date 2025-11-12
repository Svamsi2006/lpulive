import { useState } from 'react'
import AdminPinModal from './AdminPinModal'
import { ADMIN_CONFIG, isAdmin } from '../config/admin'
import { API_ENDPOINTS } from '../config/api'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdminPin, setShowAdminPin] = useState(false)
  const [pendingUserData, setPendingUserData] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token
        localStorage.setItem('lpuLiveToken', data.token)
        
        // Check if user is admin
        if (isAdmin(username)) {
          // Show PIN verification modal for admin
          setPendingUserData(data.user)
          setShowAdminPin(true)
          setLoading(false)
        } else {
          // Regular user - login directly
          onLogin(data.user)
        }
      } else {
        setError(`⚠ ${data.error}`)
      }
    } catch (error) {
      setError('⚠ Connection error. Please make sure the server is running.')
    } finally {
      if (!isAdmin(username)) {
        setLoading(false)
      }
    }
  }

  const handleAdminPinVerify = (pin) => {
    if (pin === ADMIN_CONFIG.pin) {
      // PIN correct - grant admin access
      const adminUser = {
        ...pendingUserData,
        isAdmin: true
      }
      setShowAdminPin(false)
      onLogin(adminUser)
    } else {
      // PIN incorrect
      setError('⚠ Incorrect PIN. Admin access denied.')
      setShowAdminPin(false)
      setLoading(false)
      localStorage.removeItem('lpuLiveToken')
    }
  }

  const handleAdminPinCancel = () => {
    setShowAdminPin(false)
    setLoading(false)
    localStorage.removeItem('lpuLiveToken')
    setError('Admin verification cancelled')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            🤯
          </div>
          <h1>LPU Live</h1>
          <p>Real-Time University Chat Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username (Registration Number)</label>
            <input
              id="username"
              type="text"
              placeholder="e.g., 12309977"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="password is your reg number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>First time login? Your password is the same as your registration number</p>
          <p className="hint">You can change it later in settings</p>
        </div>
      </div>

      <AdminPinModal 
        isOpen={showAdminPin}
        onVerify={handleAdminPinVerify}
        onCancel={handleAdminPinCancel}
        adminName={ADMIN_CONFIG.name}
      />
    </div>
  )
}

export default Login
