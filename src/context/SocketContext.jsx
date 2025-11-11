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
      // Always try to use Socket.IO first (works in development and some production setups)
      const socketUrl = API_BASE_URL || 'http://localhost:5000'
      console.log('� Connecting to socket server:', socketUrl)
      
      const newSocket = io(socketUrl, {
        transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 10000
      })

      newSocket.on('connect', () => {
        console.log('✅ Connected to socket server via', newSocket.io.engine.transport.name)
        setIsConnected(true)
        setUsePolling(false)
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
        console.error('Socket connection error:', error.message)
        setIsConnected(false)
      })

      newSocket.io.engine.on('upgrade', (transport) => {
        console.log('🚀 Upgraded to', transport.name)
      })

      setSocket(newSocket)

      return () => {
        console.log('🔌 Closing socket connection')
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
