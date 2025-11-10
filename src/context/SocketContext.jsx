import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'

const SocketContext = createContext()

export const useSocket = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      newSocket.on('connect', () => {
        console.log('✅ Connected to socket server')
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
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}
