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
            background: 'rgba(0,0,0,0.5)',
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
              <div className="sidebar-subtitle">Support Agent</div>
            </div>
          </div>
          <button className="new-chat-btn" onClick={onNewChat}>
            <span>＋</span>
            New Conversation
          </button>
        </div>

        <div className="sidebar-conversations">
          {conversations.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
                onClick={() => onSelect(conv.id)}
                title={conv.title}
              >
                💬 {conv.title}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          Powered by LangGraph + Qdrant
        </div>
      </aside>
    </>
  );
}
