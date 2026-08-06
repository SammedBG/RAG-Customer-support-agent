import React from 'react';

export default function ConfidenceBadge({ confidence }) {
  const level =
    confidence >= 0.7 ? 'high' :
    confidence >= 0.4 ? 'medium' : 'low';

  const label =
    confidence >= 0.7 ? 'High Confidence' :
    confidence >= 0.4 ? 'Medium Confidence' : 'Low Confidence';

  return (
    <span className={`confidence-badge ${level}`} title={`Confidence Score: ${(confidence * 100).toFixed(0)}%`}>
      {label}
    </span>
  );
}
