import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import Footer from './Footer'
import './ChatApp.css'

function ChatApp({ user, onLogout, theme, toggleTheme }) {
  const [activeView, setActiveView] = useState('personal-chats')
  const [activeChat, setActiveChat] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)

  const handleChatSelect = (chat) => {
    setActiveChat(chat)
    // Hide sidebar on mobile when chat is selected
    if (window.innerWidth <= 768) {
      setShowSidebar(false)
    }
  }

  const handleStartPersonalChat = (userData) => {
    setActiveChat({
      type: 'personal',
      ...userData
    })
    // Hide sidebar on mobile when chat starts
    if (window.innerWidth <= 768) {
      setShowSidebar(false)
    }
  }

  const handleBackToChats = () => {
    setShowSidebar(true)
    setActiveChat(null)
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
          setActiveView={setActiveView}
          showSidebar={showSidebar}
        />
        
        <ChatWindow 
          activeChat={activeChat}
          currentUser={user}
          onBack={handleBackToChats}
          showSidebar={showSidebar}
        />
      </div>
      
      <Footer />
    </div>
  )
}

export default ChatApp
