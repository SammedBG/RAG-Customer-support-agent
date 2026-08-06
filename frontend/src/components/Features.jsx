import React from 'react';

export default function Features() {
  return (
    <section className="features-section" id="features">
      <div className="section-header">
        <span className="section-tag">✦ Features</span>
        <h2 className="section-title">Built for Speed, Designed for Intelligence</h2>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h4>Hybrid Retrieval</h4>
          <p>
            Combines dense vector embeddings with BM25 sparse keyword search via Qdrant's Reciprocal Rank Fusion (RRF).
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h4>Verifiable Citations</h4>
          <p>
            Every output automatically links back to exact markdown source files and page numbers for auditability.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h4>Hallucination Guard</h4>
          <p>
            LangGraph state machine evaluates context alignment and triggers automatic fallback when data is missing.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h4>Enterprise Security</h4>
          <p>
            Built-in prompt injection defense, JWT auth, rate limiting, and structured JSONL audit trail logging.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h4>RAGAS & DeepEval</h4>
          <p>
            Automated quality regression gates measuring faithfulness, answer relevancy, and context precision.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🧩</div>
          <h4>Hierarchical Chunking</h4>
          <p>
            Parent-child document splitters retain broad context for LLM generation while using tight vectors for search.
          </p>
        </div>
      </div>
    </section>
  );
}
