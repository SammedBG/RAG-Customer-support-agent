import React from 'react';

export default function Hero({ onLaunchAgent }) {
  return (
    <section className="hero-section" id="home">
      <div className="hero-pill">
        ✦ Neura RAG Engine v1.0
      </div>

      <h1 className="hero-title">
        Your Smartest AI Assistant <br />
        <span>Automate & Ground</span>
      </h1>

      <p className="hero-subtitle">
        Deploy autonomous customer support that answers complex technical questions,
        cites verifiable documentation sources, and prevents hallucinations.
      </p>

      <div className="hero-ctas">
        <button className="btn-primary" onClick={onLaunchAgent}>
          Launch Live Assistant 🚀
        </button>
        <a href="#features" className="btn-secondary">
          Explore Features
        </a>
      </div>
    </section>
  );
}
