import React from 'react';

export default function Header({ onMenuToggle }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle navigation">
          ☰
        </button>
        <h1 className="header-title">TechNova Support Assistant</h1>
        <span className="header-badge">RAG Agent v1.0</span>
      </div>
      <div className="header-right">
        <div className="header-status">
          <span className="status-dot" />
          <span>Connected</span>
        </div>
      </div>
    </header>
  );
}
