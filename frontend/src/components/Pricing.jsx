import React from 'react';

export default function Pricing() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-header">
        <span className="section-tag" style={{ color: 'var(--lime-400)' }}>✦ Pricing</span>
        <h2 className="section-title" style={{ color: '#ffffff' }}>Choose Your Plan</h2>
      </div>

      <div className="pricing-grid">
        {/* Starter Plan */}
        <div className="pricing-card">
          <div className="pricing-name">Starter</div>
          <div className="pricing-price">$0 <span>/ month</span></div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            For developers and small teams starting with AI support.
          </p>
          <ul className="pricing-features">
            <li>Up to 1,000 queries / month</li>
            <li>Single document collection</li>
            <li>Basic hybrid search (dense + BM25)</li>
            <li>Standard source citations</li>
          </ul>
          <button className="btn-pricing">Get Started</button>
        </div>

        {/* Pro Plan (Featured) */}
        <div className="pricing-card featured">
          <div className="pricing-name" style={{ color: 'var(--lime-400)' }}>Pro</div>
          <div className="pricing-price">$19.00 <span>/ month</span></div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            For growing businesses requiring high accuracy & custom KB.
          </p>
          <ul className="pricing-features">
            <li>50,000 queries / month</li>
            <li>Unlimited document collections</li>
            <li>LangGraph state machine retry loops</li>
            <li>Hallucination verification guard</li>
            <li>RAGAS evaluation metrics</li>
          </ul>
          <button className="btn-pricing">Upgrade to Pro</button>
        </div>

        {/* Enterprise Plan */}
        <div className="pricing-card">
          <div className="pricing-name">Enterprise</div>
          <div className="pricing-price">Custom <span>Pricing</span></div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            For large enterprises needing SLA, dedicated Qdrant cluster & audit logs.
          </p>
          <ul className="pricing-features">
            <li>Unlimited queries & documents</li>
            <li>Dedicated Qdrant vector cluster</li>
            <li>SOC2 & HIPAA compliant audit logging</li>
            <li>Custom LLM fine-tuning</li>
            <li>24/7 dedicated support SLA</li>
          </ul>
          <button className="btn-pricing" style={{ background: '#ffffff', color: '#000000' }}>
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}
