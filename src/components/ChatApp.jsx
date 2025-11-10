import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import './ChatApp.css'

function ChatApp({ user, onLogout, theme, toggleTheme }) {
  const [activeView, setActiveView] = useState('university-groups')
  const [activeChat, setActiveChat] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleChatSelect = (chat) => {
    setActiveChat(chat)
  }

  const handleStartPersonalChat = (userData) => {
    setActiveChat({
      type: 'personal',
      ...userData
    })
  }

  return (
    <div className="chat-app">
      <Header 
        user={user} 
        onLogout={onLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      <div className="chat-app-body">
        <Sidebar 
          activeView={activeView}
          activeChat={activeChat}
          onChatSelect={handleChatSelect}
          onStartPersonalChat={handleStartPersonalChat}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={user}
        />
        
        <ChatWindow 
          activeChat={activeChat}
          currentUser={user}
        />
      </div>
    </div>
  )
}

export default ChatApp
