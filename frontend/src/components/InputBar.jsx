import React, { useState, useRef, useEffect } from 'react';

export default function InputBar({ onSend, isLoading }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-bar-wrapper">
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Ask about products, shipping, returns, or troubleshooting..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          id="chat-input"
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          id="send-button"
        >
          ➤
        </button>
      </div>
      <div className="input-hint">
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  );
}
