import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--lime-400)', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              👁
            </div>
            <h3 style={{ margin: 0 }}>Neura</h3>
          </div>
          <div className="footer-email">Hello@Neura.Com</div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#live-agent">Live Agent</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Technology</h5>
            <ul>
              <li><a href="#hybrid">Hybrid Retrieval</a></li>
              <li><a href="#qdrant">Qdrant Vector DB</a></li>
              <li><a href="#langgraph">LangGraph Agent</a></li>
              <li><a href="#ragas">RAGAS Benchmark</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#security">Security Compliance</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div>© 2026 Neura Inc. All Rights Reserved.</div>
        <div style={{ color: 'var(--lime-400)', fontWeight: '600' }}>Powered by LangGraph & Qdrant</div>
      </div>
    </footer>
  );
}
