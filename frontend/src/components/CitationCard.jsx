import React, { useState } from 'react';

export default function CitationCard({ citation }) {
  const [expanded, setExpanded] = useState(false);
  const { source, chunk_text, relevance_score } = citation;

  const scoreLevel =
    relevance_score >= 0.8 ? 'high' :
    relevance_score >= 0.5 ? 'medium' : 'low';

  const scorePercentage = (relevance_score * 100).toFixed(0);

  return (
    <div
      className={`citation-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="citation-card-header">
        <span className="citation-source">{source}</span>
        <span className={`citation-score ${scoreLevel}`}>
          Match {scorePercentage}%
        </span>
      </div>
      <div className="citation-text">
        {chunk_text || 'No preview available'}
      </div>
    </div>
  );
}
