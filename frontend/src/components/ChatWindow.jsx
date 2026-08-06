import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import LoadingDots from './LoadingDots';

const SUGGESTIONS = [
  "What is the return policy?",
  "How much does shipping cost?",
  "My hub won't connect to Wi-Fi",
  "What SmartHome Hub models are available?",
  "How do I track my order?",
  "What does a red LED mean?",
];

export default function ChatWindow({ messages, isLoading, onSuggestionClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <h2>How can I help you today?</h2>
          <p>
            I'm TechNova's AI support agent. Ask me about products, shipping,
            returns, or troubleshooting — I'll find the answer with sources.
          </p>
          <div className="empty-state-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => onSuggestionClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} />
      ))}
      {isLoading && (
        <div className="message assistant">
          <div className="message-avatar">TN</div>
          <div className="message-content">
            <LoadingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
