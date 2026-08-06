import React, { useState } from 'react';
import CitationCard from './CitationCard';
import ConfidenceBadge from './ConfidenceBadge';
import { formatTime } from '../utils/formatters';

export default function MessageBubble({ message }) {
  const { role, content, citations, confidence, timestamp } = message;
  const isUser = role === 'user';

  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {isUser ? 'U' : 'TN'}
      </div>
      <div className="message-content">
        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />

        {!isUser && citations && citations.length > 0 && (
          <CitationSection citations={citations} />
        )}

        <div className="message-meta">
          <span>{formatTime(timestamp)}</span>
          {!isUser && confidence !== undefined && (
            <ConfidenceBadge confidence={confidence} />
          )}
        </div>
      </div>
    </div>
  );
}

function CitationSection({ citations }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="citations-section">
      <div
        className="citations-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`citations-toggle ${isOpen ? 'open' : ''}`}>▶</span>
        <span>{citations.length} Verified Source{citations.length !== 1 ? 's' : ''}</span>
      </div>
      {isOpen && (
        <div className="citations-list">
          {citations.map((citation, idx) => (
            <CitationCard key={idx} citation={citation} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text) {
  if (!text) return '';

  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/(?:^|\n)- (.*?)(?=\n|$)/g, '<li>$1</li>');

  html = `<p>${html}</p>`;
  html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}
