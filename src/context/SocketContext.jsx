import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'
import API_BASE_URL from '../config/api'

const SocketContext = createContext()

export const useSocket = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [usePolling, setUsePolling] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (user) {
      // Check if we're in production (Vercel)
      const isProduction = import.meta.env.PROD
      
      if (isProduction) {
        // Use polling mode in production
        console.log('🔄 Using polling mode for Vercel deployment')
        setUsePolling(true)
        setIsConnected(true)
        return
      }

      // Use Socket.IO in development
      const newSocket = io(API_BASE_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      newSocket.on('connect', () => {
        console.log('✅ Connected to socket server')
        setIsConnected(true)
        newSocket.emit('user-online', user.registrationNumber)
      })

      newSocket.on('user-status', ({ username, status }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev)
          if (status === 'online') {
            updated.add(username)
          } else {
            updated.delete(username)
          }
          return updated
        })
      })

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from socket server')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        // Fallback to polling
        console.log('⚠️ Falling back to polling mode')
        setUsePolling(true)
        setIsConnected(true)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineUsers, 
      usePolling, 
      isConnected 
    }}>
      {children}
    </SocketContext.Provider>
  )
}
