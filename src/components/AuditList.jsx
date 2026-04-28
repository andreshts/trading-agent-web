import React, { useMemo, useState } from 'react';
import JsonBlock from './ui/JsonBlock.jsx';
import { AUDIT_FILTERS, filterAuditEvents, summarizeAuditEvent } from '../utils/auditEvent.js';

function formatTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function AuditList({ audit }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(() => new Set());

  const filtered = useMemo(() => filterAuditEvents(audit, filter), [audit, filter]);

  function toggleExpand(key) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <h2>Auditoria</h2>
        <span className="text-secondary">
          {filtered.length} de {audit.length} eventos
        </span>
      </div>

      <div className="audit-filters" role="tablist">
        {AUDIT_FILTERS.map(option => (
          <button
            type="button"
            key={option.key}
            role="tab"
            aria-selected={filter === option.key}
            className={`audit-chip ${filter === option.key ? 'active' : ''}`}
            onClick={() => setFilter(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="audit-list">
        {filtered.map((event, index) => {
          const summary = summarizeAuditEvent(event);
          const key = `${event.timestamp}-${index}`;
          const isOpen = expanded.has(key);
          return (
            <div key={key} className={`audit-row tone-${summary.tone || 'plain'}`}>
              <button
                type="button"
                className="audit-row-summary"
                onClick={() => toggleExpand(key)}
                aria-expanded={isOpen}
              >
                <span className="audit-icon" aria-hidden="true">
                  {summary.icon}
                </span>
                <span className="audit-label">{summary.label}</span>
                {summary.detail ? (
                  <span className="audit-detail">{summary.detail}</span>
                ) : null}
                <time className="audit-time">{formatTime(event.timestamp)}</time>
              </button>
              {isOpen ? (
                <div className="audit-row-body">
                  <small className="audit-event-type">{event.event_type}</small>
                  <JsonBlock data={event.payload} />
                </div>
              ) : null}
            </div>
          );
        })}
        {!filtered.length ? (
          <div className="empty-state">
            {audit.length
              ? 'Ningún evento coincide con el filtro.'
              : 'No hay eventos auditados.'}
          </div>
        ) : null}
      </div>
    </section>
  );
}
