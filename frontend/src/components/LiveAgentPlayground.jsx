import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';

const PROMPT_CHIPS = [
  "What is the return policy for TechNova products?",
  "How much does overnight shipping cost?",
  "My SmartHome Hub won't connect to Wi-Fi",
  "What are the different SmartHome Hub models and prices?",
];

export default function LiveAgentPlayground() {
  const {
    messages,
    conversations,
    activeConversation,
    isLoading,
    sendMessage,
    startNewChat,
    switchConversation,
  } = useChat();

  const [input, setInput] = useState('');
  const [openCitationIdx, setOpenCitationIdx] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleChipClick = (queryText) => {
    sendMessage(queryText);
  };

  return (
    <section className="agent-workspace" id="live-agent">
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <span className="section-tag">✦ Interactive Playground</span>
        <h2 className="section-title">Test Neura AI Live</h2>
      </div>

      <div className="agent-container">
        {/* Left Sidebar inside Playground */}
        <aside className="agent-sidebar">
          <div className="agent-sidebar-header">
            <span className="agent-sidebar-title">Conversations</span>
            <button className="btn-new-chat" onClick={startNewChat} title="New Chat">
              +
            </button>
          </div>

          <div className="agent-history-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`history-item ${conv.id === activeConversation ? 'active' : ''}`}
                onClick={() => switchConversation(conv.id)}
              >
                💬 {conv.title}
              </div>
            ))}
          </div>

          <div className="agent-sidebar-footer">
            <span className="kb-badge"></span>
            <span>Qdrant Store Active</span>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="agent-chat-main">
          <header className="agent-chat-header">
            <div className="agent-chat-title">
              <span>Neura AI Agent</span>
              <span className="agent-badge-pill">Grounded RAG</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Model: GPT-4o-mini
            </div>
          </header>

          <div className="agent-chat-messages">
            {messages.length === 0 && !isLoading ? (
              <div className="neura-empty-state">
                <div className="neura-empty-icon">🤖</div>
                <h3>Ask Neura Anything</h3>
                <p>
                  Query company policies, technical troubleshooting guides, or shipping details.
                  Neura returns accurate, cited responses.
                </p>
                <div className="prompt-suggestions">
                  {PROMPT_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      className="prompt-chip"
                      onClick={() => handleChipClick(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`neura-message ${msg.role}`}>
                  <div className="neura-avatar">
                    {msg.role === 'user' ? 'U' : 'N'}
                  </div>
                  <div>
                    <div className="neura-body">
                      {msg.content}

                      {/* Citations Box */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="neura-citation-box">
                          <div
                            className="neura-citation-toggle"
                            onClick={() =>
                              setOpenCitationIdx(openCitationIdx === idx ? null : idx)
                            }
                          >
                            <span>📎 {msg.citations.length} Verified Source{msg.citations.length > 1 ? 's' : ''}</span>
                            <span>{openCitationIdx === idx ? '▲' : '▼'}</span>
                          </div>

                          {openCitationIdx === idx && (
                            <div style={{ marginTop: '8px' }}>
                              {msg.citations.map((c, cIdx) => (
                                <div key={cIdx} className="neura-citation-card">
                                  <div className="neura-citation-title">
                                    <span>{c.source}</span>
                                    <span className="neura-citation-score">
                                      {(c.relevance_score * 100).toFixed(0)}% Match
                                    </span>
                                  </div>
                                  <div className="neura-citation-snippet">
                                    {c.chunk_text}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="neura-meta">
                      {msg.role === 'assistant' && msg.confidence !== undefined && (
                        <span>Confidence: {(msg.confidence * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="neura-message assistant">
                <div className="neura-avatar">N</div>
                <div className="neura-body">
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>●</span>
                    <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="agent-input-box">
            <form className="agent-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="agent-input-field"
                placeholder="Ask about products, shipping, returns, or hardware..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn-send"
                disabled={!input.trim() || isLoading}
              >
                ➔
              </button>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
}
