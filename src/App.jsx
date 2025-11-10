import { useState, useEffect } from 'react'
import Login from './components/Login'
import ChatApp from './components/ChatApp'
import { SocketProvider } from './context/SocketContext'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('lpuLiveUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('lpuLiveTheme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('lpuLiveUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('lpuLiveUser')
    localStorage.removeItem('lpuLiveToken')
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('lpuLiveTheme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="app">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <SocketProvider user={user}>
          <ChatApp 
            user={user} 
            onLogout={handleLogout} 
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </SocketProvider>
      )}
    </div>
  )
}

export default App
