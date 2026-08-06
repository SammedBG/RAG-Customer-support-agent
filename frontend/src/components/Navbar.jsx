import React from 'react';

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <nav className="navbar">
      <a href="#home" className="brand-logo" onClick={() => onTabChange('home')}>
        <div className="logo-icon">👁</div>
        <span>Neura</span>
      </a>

      <ul className="nav-links">
        <li>
          <a
            href="#home"
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => onTabChange('home')}
          >
            Home
          </a>
        </li>
        <li>
          <a
            href="#features"
            className={activeTab === 'features' ? 'active' : ''}
            onClick={() => onTabChange('features')}
          >
            Features
          </a>
        </li>
        <li>
          <a
            href="#live-agent"
            className={activeTab === 'agent' ? 'active' : ''}
            onClick={() => onTabChange('agent')}
          >
            Live Agent
          </a>
        </li>
        <li>
          <a
            href="#pricing"
            className={activeTab === 'pricing' ? 'active' : ''}
            onClick={() => onTabChange('pricing')}
          >
            Pricing
          </a>
        </li>
      </ul>

      <div className="nav-actions">
        <button
          className="btn-primary"
          onClick={() => onTabChange('agent')}
        >
          Try Assistant ⚡
        </button>
      </div>
    </nav>
  );
}
