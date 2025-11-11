import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import GroupModal from './GroupModal'
import { getApiUrl } from '../utils/api'
import './Sidebar.css'

function Sidebar({ activeView, activeChat, onChatSelect, onStartPersonalChat, searchQuery, setSearchQuery, currentUser, setActiveView, showSidebar }) {
  const [regNumberInput, setRegNumberInput] = useState('')
  const [searchError, setSearchError] = useState('')
  const [recentChats, setRecentChats] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [announcementText, setAnnouncementText] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const { socket, onlineUsers } = useSocket()

  // Load recent chats
  useEffect(() => {
    if (activeView === 'personal-chats') {
      loadRecentChats()
    } else if (activeView === 'personal-groups') {
      loadGroups()
    } else if (activeView === 'university-groups') {
      loadUniversityGroups()
    } else if (activeView === 'announcements') {
      loadAnnouncements()
    }
  }, [activeView])

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      socket.on('receive-message', (message) => {
        loadRecentChats()
      })

      return () => {
        socket.off('receive-message')
      }
    }
  }, [socket])

  const loadRecentChats = async () => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      
      if (!token) {
        console.log('No token found')
        return
      }
      
      const response = await fetch(getApiUrl('/api/chats'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const chats = await response.json()
        setRecentChats(chats)
      } else if (response.status === 401 || response.status === 403) {
        console.log('Token expired or invalid')
        // Token expired, could trigger logout here
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      
      if (!token) {
        console.log('No token found')
        return
      }
      
      const response = await fetch(getApiUrl('/api/groups'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const groupsData = await response.json()
        setGroups(groupsData)
      } else if (response.status === 401 || response.status === 403) {
        console.log('Token expired or invalid')
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const handleCreateGroup = async (groupName, members) => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      
      if (!token) {
        throw new Error('No token found')
      }

      console.log('📝 Creating group:', { groupName, members, activeView })
      
      // Determine endpoint based on current view
      const isUniversityGroup = activeView === 'university-groups';
      const endpoint = isUniversityGroup 
        ? getApiUrl('/api/groups/university/create')
        : getApiUrl('/api/groups/create');
      
      console.log('🌐 Endpoint:', endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          groupName,
          members
        })
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const groupData = await response.json()
        console.log('✅ Group created:', groupData)
        // Reload appropriate groups
        if (isUniversityGroup) {
          loadUniversityGroups();
        } else {
          loadGroups();
        }
        return groupData
      } else {
        const error = await response.json()
        console.error('❌ Server error:', error)
        throw new Error(error.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('❌ Create group error:', error)
      throw error
    }
  }

  // Load university groups (admin-created groups)
  const loadUniversityGroups = async () => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      
      if (!token) {
        console.log('No token found')
        return
      }
      
      const response = await fetch(getApiUrl('/api/groups/university'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const groupsData = await response.json()
        setGroups(groupsData) // Reuse groups state for university groups
      }
    } catch (error) {
      console.error('Error loading university groups:', error)
    }
  }

  const loadAnnouncements = async () => {
    try {
      const token = localStorage.getItem('lpuLiveToken')
      
      if (!token) {
        console.log('No token found')
        return
      }
      
      const response = await fetch(getApiUrl('/api/announcements'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error loading announcements:', error)
    }
  }

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return
    
    setIsPosting(true)
    try {
      const token = localStorage.getItem('lpuLiveToken')
      const response = await fetch(getApiUrl('/api/announcements'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: announcementText })
      })
      
      if (response.ok) {
        setAnnouncementText('')
        loadAnnouncements()
      }
    } catch (error) {
      console.error('Error posting announcement:', error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleStartChat = async () => {
    setSearchError('')
    setLoading(true)
    
    // Prevent starting chat with yourself
    if (regNumberInput === currentUser.registrationNumber) {
      setSearchError('⚠ You cannot start a chat with yourself.')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('lpuLiveToken')
      
      if (!token) {
        setSearchError('⚠ Session expired. Please login again.')
        setLoading(false)
        return
      }
      
      // Get user data
      const userResponse = await fetch(getApiUrl(`/api/users/${regNumberInput}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        
        // Get current user from token
        const currentUser = JSON.parse(atob(token.split('.')[1])).username
        
        // Create or get chat with TWO participants
        const chatResponse = await fetch(getApiUrl('/api/chats/create'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            participants: [currentUser, regNumberInput]
          })
        })

        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          onStartPersonalChat({
            ...userData,
            chatId: chatData.chatId
          })
          setRegNumberInput('')
          loadRecentChats()
        } else {
          const chatError = await chatResponse.json()
          setSearchError(`⚠ ${chatError.error}`)
        }
      } else {
        const data = await userResponse.json()
        setSearchError(`⚠ ${data.error}`)
      }
    } catch (error) {
      console.error('Start chat error:', error)
      setSearchError('⚠ Connection error. Please make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleStartChat()
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const h = hours % 12 || 12
      const m = minutes < 10 ? `0${minutes}` : minutes
      return `${h}:${m} ${ampm}`
    }
    return 'Yesterday'
  }

  const renderUniversityGroups = () => (
    <div className="sidebar-content">
      {currentUser.isAdmin && (
        <div className="create-group-section">
          <button 
            className="create-group-btn admin-create-btn"
            onClick={() => setIsGroupModalOpen(true)}
          >
            <span className="btn-icon">🏛️</span>
            Create University Group
          </button>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search university groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="group-list">
        {groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏛️</div>
            <p>No university groups yet</p>
            {currentUser.isAdmin ? (
              <span>Create a university group to get started</span>
            ) : (
              <span>Groups will appear here when created by admin</span>
            )}
          </div>
        ) : (
          groups.map(group => (
            <div
              key={group.groupId}
              className={`group-item ${activeChat?.groupId === group.groupId ? 'active' : ''}`}
              onClick={() => onChatSelect({ 
                type: 'university-group', 
                groupId: group.groupId,
                groupName: group.groupName,
                members: group.members,
                memberDetails: group.memberDetails,
                createdBy: group.createdBy,
                isGroup: true,
                isUniversityGroup: true
              })}
            >
              <div className="group-icon">🏛️</div>
              <div className="group-info">
                <div className="group-name">{group.groupName}</div>
                <div className="group-last-message">
                  {group.lastSender && group.lastMessage 
                    ? `${group.memberDetails.find(m => m.regNumber === group.lastSender)?.name || 'Someone'}: ${group.lastMessage}`
                    : 'No messages yet'}
                </div>
              </div>
              <div className="group-meta">
                <div className="group-timestamp">
                  {group.lastTimestamp ? formatTime(group.lastTimestamp) : ''}
                </div>
                <div className="member-count">{group.members.length} members</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderPersonalGroups = () => (
    <div className="sidebar-content">
      <div className="create-group-section">
        <button 
          className="create-group-btn"
          onClick={() => setIsGroupModalOpen(true)}
        >
          <span className="btn-icon">➕</span>
          Create New Group
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search personal groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="group-list">
        {groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No groups yet</p>
            <span>Create a group to start chatting with multiple people</span>
          </div>
        ) : (
          groups.map(group => (
            <div
              key={group.groupId}
              className={`group-item ${activeChat?.groupId === group.groupId ? 'active' : ''}`}
              onClick={() => onChatSelect({ 
                type: 'personal-group', 
                groupId: group.groupId,
                groupName: group.groupName,
                members: group.members,
                memberDetails: group.memberDetails,
                createdBy: group.createdBy,
                isGroup: true
              })}
            >
              <div className="group-icon">👥</div>
              <div className="group-info">
                <div className="group-name">{group.groupName}</div>
                <div className="group-last-message">
                  {group.lastSender && group.lastMessage 
                    ? `${group.memberDetails.find(m => m.regNumber === group.lastSender)?.name || 'Someone'}: ${group.lastMessage}`
                    : 'No messages yet'}
                </div>
              </div>
              <div className="group-meta">
                <div className="group-timestamp">
                  {group.lastTimestamp ? formatTime(group.lastTimestamp) : ''}
                </div>
                <div className="member-count">{group.members.length} members</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderPersonalChats = () => (
    <div className="sidebar-content">
      <div className="personal-chat-search">
        <div className="input-group">
          <label>Enter Registration Number</label>
          <div className="input-with-button">
            <input
              type="text"
              placeholder="e.g., 12309977"
              value={regNumberInput}
              onChange={(e) => setRegNumberInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={handleStartChat} className="start-chat-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Start Chat'}
            </button>
          </div>
          {searchError && <div className="error-text">{searchError}</div>}
        </div>
      </div>

      <div className="divider">
        <span>Recent Chats</span>
      </div>

      <div className="group-list">
        {recentChats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No recent chats</p>
            <span>Enter a registration number to start chatting</span>
          </div>
        ) : (
          recentChats.map(chat => {
            const isOnline = onlineUsers.has(chat.participant)
            const isActive = activeChat?.chatId === chat.chatId
            
            return (
              <div
                key={chat.chatId}
                className={`group-item ${isActive ? 'active' : ''}`}
                onClick={() => onChatSelect({
                  type: 'personal',
                  chatId: chat.chatId,
                  ...chat.participantData
                })}
              >
                <div className="group-icon-wrapper">
                  <div className="group-icon">
                    {chat.participantData?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {isOnline && <div className="online-indicator"></div>}
                </div>
                <div className="group-info">
                  <div className="group-name">{chat.participantData?.name || 'Unknown'}</div>
                  <div className="group-last-message">
                    {chat.lastMessage?.text || 'No messages yet'}
                  </div>
                </div>
                <div className="group-meta">
                  <div className="group-timestamp">
                    {formatTime(chat.lastMessage?.timestamp)}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="unread-badge">{chat.unreadCount}</div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  const renderAnnouncements = () => {
    // Load announcements from state
    return (
      <div className="sidebar-content">
        {currentUser.isAdmin && (
          <div className="post-announcement-section">
            <h3>📢 Post New Announcement</h3>
            <textarea 
              placeholder="Type your announcement here..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="announcement-textarea"
              rows="4"
            />
            <button 
              className="post-announcement-btn"
              onClick={handlePostAnnouncement}
              disabled={isPosting || !announcementText.trim()}
            >
              {isPosting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        )}

        <div className="announcements-list">
          {announcements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📢</div>
              <p>No announcements yet</p>
              {currentUser.isAdmin && <span>Post the first announcement</span>}
            </div>
          ) : (
            announcements.map(announcement => (
              <div key={announcement.id} className="announcement-item">
                <div className="announcement-icon">�</div>
                <div className="announcement-content">
                  <div className="announcement-title">{announcement.text}</div>
                  <div className="announcement-date">
                    {new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="announcement-author">
                    By: {announcement.authorName}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderReportBug = () => (
    <div className="sidebar-content">
      <div className="report-bug-form">
        <h3>Report a Bug</h3>
        <textarea placeholder="Describe the issue you're facing..."></textarea>
        <button className="submit-bug-btn">Submit Report</button>
      </div>
    </div>
  )

  return (
    <aside className={`sidebar ${!showSidebar ? 'sidebar-hidden' : ''}`}>
      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeView === 'personal-chats' ? 'active' : ''}`}
          onClick={() => setActiveView('personal-chats')}
        >
          💬 Chats
        </button>
        <button 
          className={`tab-btn ${activeView === 'university-groups' ? 'active' : ''}`}
          onClick={() => setActiveView('university-groups')}
        >
          🏛️ Groups
        </button>
        <button 
          className={`tab-btn ${activeView === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveView('announcements')}
        >
          📢 Announcements
        </button>
      </div>
      
      {activeView === 'university-groups' && renderUniversityGroups()}
      {activeView === 'personal-groups' && renderPersonalGroups()}
      {activeView === 'personal-chats' && renderPersonalChats()}
      {activeView === 'announcements' && renderAnnouncements()}
      {activeView === 'report-bug' && renderReportBug()}
      
      <GroupModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        currentUser={currentUser.registrationNumber}
      />
    </aside>
  )
}

export default Sidebar
