import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { getApiUrl } from '../utils/api'
import './ChatWindow.css'

function ChatWindow({ activeChat, currentUser, onBack, showSidebar }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [lastMessageId, setLastMessageId] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const { socket, onlineUsers, isConnected } = useSocket()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages when chat changes
  useEffect(() => {
    if (activeChat) {
      if (activeChat.isGroup && activeChat.groupId) {
        loadGroupMessages()
      } else if (activeChat.chatId) {
        loadMessages()
        markMessagesAsRead()
      }
    }
  }, [activeChat])

  // Polling fallback when socket is not connected
  useEffect(() => {
    if (activeChat && activeChat.chatId) {
      // Start polling for new messages every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        if (!isConnected) {
          console.log('🔄 Polling for new messages (socket disconnected)')
          loadMessages()
        }
      }, 2000)

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [activeChat, isConnected])

  // Socket listeners
  useEffect(() => {
    if (socket && activeChat) {
      const handleReceiveMessage = (newMessage) => {
        console.log('📨 Received message:', newMessage)
        // Check if message belongs to current chat
        if (newMessage.chatId === activeChat.chatId || 
            (newMessage.sender === activeChat.regNumber || newMessage.sender === activeChat.registrationNumber) ||
            (newMessage.receiver === currentUser.registrationNumber)) {
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(msg => msg._id === newMessage._id || msg.messageId === newMessage.messageId)
            if (exists) return prev
            return [...prev, newMessage]
          })
          markMessagesAsRead()
        }
      }

      socket.on('receive-message', handleReceiveMessage)

      socket.on('message-sent', (sentMessage) => {
        console.log('✅ Message sent confirmation:', sentMessage)
      })

      socket.on('message-read-receipt', ({ messageId, readAt }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, read: true, readAt } : msg
        ))
      })

      socket.on('user-typing', ({ from, isTyping }) => {
        if (from === activeChat.registrationNumber) {
          setIsTyping(isTyping)
          if (isTyping) {
            setTimeout(() => setIsTyping(false), 3000)
          }
        }
      })

      return () => {
        socket.off('receive-message', handleReceiveMessage)
        socket.off('message-sent')
        socket.off('message-read-receipt')
        socket.off('user-typing')
      }
    }
  }, [socket, activeChat, currentUser])

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      const response = await fetch(`${import.meta.env.PROD ? '' : 'http://localhost:5000'}/api/messages/${activeChat.chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prevMessages => {
          // Only update if we have new messages
          if (data.length !== prevMessages.length) {
            const lastMsg = data[data.length - 1]
            if (lastMsg && lastMsg._id !== lastMessageId) {
              setLastMessageId(lastMsg._id)
              return data
            }
          }
          return prevMessages
        })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadGroupMessages = async () => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      const response = await fetch(`${import.meta.env.PROD ? '' : 'http://localhost:5000'}/api/groups/${activeChat.groupId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading group messages:', error)
    }
  }

  const markMessagesAsRead = async () => {
    if (!activeChat?.chatId) return

    try {
      const token = localStorage.getItem('lpuLiveToken')
      await fetch(getApiUrl('/api/messages/read'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId: activeChat.chatId })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (message.trim() && activeChat) {
      const token = localStorage.getItem('lpuLiveToken')
      
      try {
        // Check if it's a group chat
        if (activeChat.isGroup && activeChat.groupId) {
          // Send group message
          const response = await fetch(`${import.meta.env.PROD ? '' : 'http://localhost:5000'}/api/groups/${activeChat.groupId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              text: message.trim()
            })
          })

          if (response.ok) {
            const newMessage = await response.json()
            setMessages(prev => [...prev, newMessage])
            setMessage('')
            
            // Emit via socket to all group members
            if (socket) {
              socket.emit('send-group-message', {
                ...newMessage,
                groupId: activeChat.groupId,
                members: activeChat.members
              })
            }
          } else {
            const errorData = await response.json()
            console.error('Failed to send group message:', errorData)
            alert(`Failed to send: ${errorData.error}`)
          }
        } else {
          // Send personal message
          const response = await fetch(getApiUrl('/api/messages'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              chatId: activeChat.chatId,
              receiver: activeChat.regNumber || activeChat.registrationNumber,
              text: message.trim()
            })
          })

          if (response.ok) {
            const newMessage = await response.json()
            setMessages(prev => [...prev, newMessage])
            setMessage('')
            
            // Emit via socket for real-time delivery
            if (socket) {
              socket.emit('send-message', {
                chatId: activeChat.chatId,
                to: activeChat.regNumber || activeChat.registrationNumber,
                message: newMessage
              })
            }
          } else {
            const errorData = await response.json()
            console.error('Failed to send message:', errorData)
            alert(`Failed to send: ${errorData.error}`)
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message. Check if server is running.')
      }
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (max 5MB for now)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    console.log('📎 Uploading file:', file.name, file.type);
    setUploading(true)
    const token = localStorage.getItem('lpuLiveToken')

    try {
      // Convert file to base64 for small files (images, PDFs)
      const reader = new FileReader()
      
      reader.onload = async () => {
        const base64Data = reader.result
        
        try {
          // Send message with base64 file data
          if (activeChat.isGroup && activeChat.groupId) {
            // Send to group
            const messageResponse = await fetch(`${import.meta.env.PROD ? '' : 'http://localhost:5000'}/api/groups/${activeChat.groupId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                text: '',
                fileData: base64Data,
                fileName: file.name,
                fileType: file.type
              })
            })

            if (messageResponse.ok) {
              const newMessage = await messageResponse.json()
              setMessages(prev => [...prev, newMessage])
              console.log('✅ Group file message sent');
              
              // Emit via socket to all group members
              if (socket) {
                socket.emit('send-group-message', {
                  ...newMessage,
                  groupId: activeChat.groupId,
                  members: activeChat.members
                })
              }
            } else {
              throw new Error('Failed to send group message')
            }
          } else {
            // Send to personal chat
            const messageResponse = await fetch(getApiUrl('/api/messages'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                chatId: activeChat.chatId,
                receiver: activeChat.regNumber || activeChat.registrationNumber,
                text: '',
                fileData: base64Data,
                fileName: file.name,
                fileType: file.type
              })
            })

            if (messageResponse.ok) {
              const newMessage = await messageResponse.json()
              setMessages(prev => [...prev, newMessage])
              console.log('✅ Personal file message sent');
              
              // Emit via socket for real-time delivery
              if (socket) {
                socket.emit('send-message', {
                  chatId: activeChat.chatId,
                  to: activeChat.regNumber || activeChat.registrationNumber,
                  message: newMessage
                })
              }
            } else {
              throw new Error('Failed to send message')
            }
          }
          
          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          setUploading(false)
        } catch (error) {
          console.error('❌ Error sending file:', error)
          alert('Failed to send file: ' + error.message)
          setUploading(false)
        }
      }
      
      reader.onerror = () => {
        console.error('❌ Error reading file')
        alert('Failed to read file')
        setUploading(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('❌ Error uploading file:', error)
      alert('Failed to upload file: ' + error.message)
      setUploading(false)
    }
  }

  const handleTyping = () => {
    if (socket && activeChat) {
      socket.emit('typing', {
        to: activeChat.registrationNumber,
        from: currentUser.registrationNumber,
        isTyping: true
      })
    }
  }

  const renderFilePreview = (msg) => {
    // Check for both fileUrl and fileData (base64)
    if (!msg.fileUrl && !msg.fileData) return null

    const fileType = msg.fileType?.split('/')[0]
    
    // Use fileData (base64) if available, otherwise use fileUrl
    const fileSource = msg.fileData || `${import.meta.env.PROD ? '' : 'http://localhost:5000'}${msg.fileUrl}`

    if (fileType === 'image') {
      return (
        <div className="file-preview">
          <img src={fileSource} alt={msg.fileName} />
        </div>
      )
    }

    if (fileType === 'application' && msg.fileType?.includes('pdf')) {
      return (
        <div className="file-attachment pdf-file">
          <div className="file-icon">�</div>
          <div className="file-info">
            <div className="file-name">{msg.fileName}</div>
            <a href={fileSource} target="_blank" rel="noopener noreferrer" className="file-download">
              Open PDF
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="file-attachment">
        <div className="file-icon">📎</div>
        <div className="file-info">
          <div className="file-name">{msg.fileName}</div>
          <a href={fileSource} download={msg.fileName} className="file-download">
            Download
          </a>
        </div>
      </div>
    )
  }

  const renderReadReceipt = (msg) => {
    if (msg.sender !== currentUser.registrationNumber) return null

    if (msg.read) {
      return <span className="read-receipt blue-tick">✓✓</span>
    } else if (msg.delivered) {
      return <span className="read-receipt white-tick">✓✓</span>
    }
    return <span className="read-receipt single-tick">✓</span>
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    return `${formattedHours}:${formattedMinutes} ${ampm}`
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const isOnline = activeChat && !activeChat.isGroup && onlineUsers.has(activeChat.registrationNumber)

  if (!activeChat) {
    return (
      <div className="chat-window">
        <div className="no-chat-selected">
          <div className="no-chat-icon">💬</div>
          <h2>Select a chat to start messaging</h2>
          <p>Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={onBack}>
            ←
          </button>
          <div className="chat-avatar-wrapper">
            <div className="chat-avatar">
              {activeChat.isGroup 
                ? '👥' 
                : (activeChat.name ? activeChat.name.charAt(0).toUpperCase() : '?')}
            </div>
            {isOnline && <div className="online-indicator-header"></div>}
          </div>
          <div className="chat-header-info">
            <div className="chat-name">
              {activeChat.isGroup ? activeChat.groupName : activeChat.name}
            </div>
            {activeChat.type === 'personal' && !activeChat.isGroup && (
              <div className="chat-details">
                <span className={isOnline ? 'online-status' : 'offline-status'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="separator">•</span>
                <span>{activeChat.registrationNumber}</span>
                <span className="separator">•</span>
                <span>{activeChat.branch}</span>
              </div>
            )}
            {activeChat.type === 'group' && !activeChat.isGroup && (
              <div className="chat-details">
                <span>University Group</span>
              </div>
            )}
            {activeChat.isGroup && (
              <div className="chat-details">
                <span>{activeChat.members?.length || 0} members</span>
                <span className="separator">•</span>
                <span className="group-members-preview">
                  {activeChat.memberDetails?.slice(0, 3).map(m => m.name.split(' ')[0]).join(', ')}
                  {activeChat.memberDetails?.length > 3 && ` +${activeChat.memberDetails.length - 3} more`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-action-btn" title="Settings">⚙️</button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="chat-body">
        {messages.map((msg) => {
          const isSelf = msg.sender === currentUser.registrationNumber
          // For group messages, get sender name
          const senderName = activeChat.isGroup 
            ? (msg.senderName || activeChat.memberDetails?.find(m => m.regNumber === msg.sender)?.name || 'Unknown')
            : activeChat.name
          
          return (
            <div
              key={msg.messageId || msg._id}
              className={`message ${isSelf ? 'message-self' : 'message-other'}`}
            >
              {!isSelf && (
                <div className="message-avatar">
                  {senderName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="message-content">
                {!isSelf && activeChat.isGroup && (
                  <div className="message-sender">{senderName}</div>
                )}
                {!isSelf && !activeChat.isGroup && (
                  <div className="message-sender">{activeChat.name}</div>
                )}
                <div className="message-bubble">
                  {msg.text && <div className="message-text">{msg.text}</div>}
                  {renderFilePreview(msg)}
                </div>
                <div className="message-timestamp">
                  {formatTime(msg.timestamp)} | {formatDate(msg.timestamp)}
                  {!activeChat.isGroup && renderReadReceipt(msg)}
                </div>
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div className="typing-indicator">
            <span>{activeChat.name} is typing</span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />
        <button 
          type="button" 
          className="attach-btn" 
          title="Attach File"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '⏳' : '📎'}
        </button>
        <button type="button" className="emoji-btn" title="Emoji">
          😊
        </button>
        <textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            handleTyping()
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(e)
            }
          }}
          rows={1}
        />
        <button type="submit" className="send-btn" title="Send" disabled={!message.trim()}>
          ✈️
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
