import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { useChat } from './hooks/useChat';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    messages,
    conversations,
    activeConversation,
    isLoading,
    sendMessage,
    startNewChat,
    switchConversation,
  } = useChat();

  const handleSuggestionClick = useCallback(
    (text) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConversation}
        onNewChat={startNewChat}
        onSelect={switchConversation}
      />
      <div className="main-area">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
        />
        <InputBar
          onSend={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
