import React from 'react';

export default function MetricCard({ title, value, note, tone = '' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
