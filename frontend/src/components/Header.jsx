import React from 'react';

export default function Header({ onMenuToggle }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle sidebar">
          ☰
        </button>
        <h1 className="header-title">TechNova Support</h1>
      </div>
      <div className="header-right">
        <div className="header-status">
          <span className="status-dot" />
          <span>AI Agent Online</span>
        </div>
      </div>
    </header>
  );
}
