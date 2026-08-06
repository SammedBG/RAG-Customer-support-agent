import React, { useState } from 'react';

const FAQS = [
  {
    q: "How does Neura prevent AI hallucinations?",
    a: "Neura uses a multi-stage LangGraph state machine. After generating a response, a dedicated Hallucination Verification Guard grades whether every claim in the response is strictly supported by the retrieved document chunks. If a claim isn't grounded, the agent automatically retries or triggers a safe fallback."
  },
  {
    q: "How does hybrid search work?",
    a: "Hybrid search combines dense vector embeddings (OpenAI text-embedding-3-small) for semantic understanding with BM25 sparse vectors for exact keyword matching. Results are merged server-side on Qdrant using Reciprocal Rank Fusion (RRF)."
  },
  {
    q: "Can I connect custom data sources?",
    a: "Yes! Neura supports Markdown, PDF, HTML, JSON, and raw text files. The ingestion pipeline handles deduplication, parent-child chunking, and dual embedding generation automatically."
  },
  {
    q: "Is customer data secured and audited?",
    a: "All incoming requests pass through JWT/API key authentication, token-bucket rate limiting, input sanitization, and prompt injection defense. Every query generates a structured JSONL audit entry for compliance."
  }
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="faq-section" id="faq">
      <div className="section-header">
        <span className="section-tag">✦ FAQ</span>
        <h2 className="section-title">What Makes Our AI Agent Smarter?</h2>
      </div>

      <div>
        {FAQS.map((faq, idx) => (
          <div key={idx} className="faq-item">
            <div
              className="faq-question"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            >
              <span>{faq.q}</span>
              <span>{openIdx === idx ? '−' : '+'}</span>
            </div>
            {openIdx === idx && (
              <div className="faq-answer">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
