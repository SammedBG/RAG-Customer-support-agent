import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import LoadingDots from './LoadingDots';

const SUGGESTIONS = [
  "What is the return policy for TechNova products?",
  "How much does overnight shipping cost?",
  "My SmartHome Hub won't connect to Wi-Fi",
  "What are the different SmartHome Hub models and prices?",
  "How do I track my order?",
  "What does a solid red LED mean on my hub?",
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
          <div className="empty-state-icon">🛡️</div>
          <h2>Enterprise Support Assistant</h2>
          <p>
            Ask questions about TechNova products, policies, hardware troubleshooting, or shipping.
            Answers are grounded in official documentation with verified source citations.
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
