import React from 'react';

export default function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeId,
  onNewChat,
  onSelect,
}) {
  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">TN</div>
            <div>
              <div className="sidebar-title">TechNova</div>
              <div className="sidebar-subtitle">Enterprise Support</div>
            </div>
          </div>
          <button className="new-chat-btn" onClick={onNewChat}>
            <span>+</span> New Chat
          </button>
        </div>

        <div className="sidebar-conversations">
          {conversations.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No previous chats
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
                onClick={() => onSelect(conv.id)}
                title={conv.title}
              >
                <span>💬</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</span>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <span>Qdrant Hybrid DB</span>
          <span style={{ color: 'var(--text-muted)' }}>v1.0</span>
        </div>
      </aside>
    </>
  );
}
