import { useState } from 'react'
import './Header.css'

function Header({ user, onLogout, theme, toggleTheme, activeView, setActiveView }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return
    }

    try {
      const token = localStorage.getItem('lpuLiveToken')
      const response = await fetch('${import.meta.env.PROD ? '' : 'http://localhost:5000'}/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          setShowChangePassword(false)
          setPasswordSuccess('')
        }, 2000)
      } else {
        setPasswordError(data.error)
      }
    } catch (error) {
      setPasswordError('Connection error. Please try again.')
    }
  }

  const menuItems = [
    { id: 'university-groups', label: 'University Groups', icon: '🏛️' },
    { id: 'personal-groups', label: 'Personal Groups', icon: '👥' },
    { id: 'personal-chats', label: 'Personal Chats', icon: '💬' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'report-bug', label: 'Report a Bug', icon: '🐛' },
  ]

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <span className="logo-text">LPU Live</span>
        </div>
      </div>

      <nav className="header-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="header-right">
        <button 
          className="header-icon-btn"
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
        >
          🔔
          <span className="notification-badge">3</span>
        </button>

        <button 
          className="header-icon-btn"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button 
          className="header-icon-btn"
          onClick={() => {
            setShowSettings(!showSettings)
            setShowNotifications(false)
          }}
          title="Settings"
        >
          ⚙️
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-reg">{user.registrationNumber}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            🚪
          </button>
        </div>
      </div>

      {showNotifications && (
        <div className="dropdown notifications-dropdown">
          <div className="dropdown-header">Notifications</div>
          <div className="notification-item">
            <div className="notification-icon">💬</div>
            <div className="notification-content">
              <div className="notification-title">New message</div>
              <div className="notification-text">You have 3 unread messages</div>
            </div>
          </div>
          <div className="notification-item">
            <div className="notification-icon">📢</div>
            <div className="notification-content">
              <div className="notification-title">New Announcement</div>
              <div className="notification-text">Exam schedule released</div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="dropdown settings-dropdown">
          <div className="dropdown-header">Settings</div>
          <button 
            className="settings-option"
            onClick={() => {
              setShowChangePassword(true)
              setShowSettings(false)
            }}
          >
            🔒 Change Password
          </button>
          <button className="settings-option">
            👤 Profile Settings
          </button>
          <button className="settings-option">
            🔔 Notification Preferences
          </button>
          <button className="settings-option">
            🔐 Privacy Settings
          </button>
        </div>
      )}

      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button 
                className="modal-close"
                onClick={() => setShowChangePassword(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {passwordError && (
                <div className="password-error">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="password-success">{passwordSuccess}</div>
              )}
              <button type="submit" className="submit-password-btn">
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
