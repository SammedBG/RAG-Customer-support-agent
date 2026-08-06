import React from 'react';

export default function Metrics() {
  return (
    <section className="metrics-grid">
      <div className="metric-card">
        <div className="metric-val">99.4<span>%</span></div>
        <div className="metric-lbl">Citation Groundedness</div>
      </div>
      <div className="metric-card">
        <div className="metric-val">1.2<span>s</span></div>
        <div className="metric-lbl">Avg Response Speed</div>
      </div>
      <div className="metric-card">
        <div className="metric-val">94.8<span>%</span></div>
        <div className="metric-lbl">First Contact Resolution</div>
      </div>
      <div className="metric-card">
        <div className="metric-val">0<span>%</span></div>
        <div className="metric-lbl">Hallucination Leakage</div>
      </div>
    </section>
  );
}
