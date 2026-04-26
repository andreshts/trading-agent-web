import React from 'react';
import JsonBlock from './ui/JsonBlock.jsx';

export default function AuditList({ audit }) {
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <h2>Auditoria</h2>
        <span className="text-secondary">{audit.length} eventos recientes</span>
      </div>
      <div className="audit-list">
        {audit.map((event, index) => (
          <details key={`${event.timestamp}-${index}`}>
            <summary>
              <span>{event.event_type}</span>
              <time>{new Date(event.timestamp).toLocaleString()}</time>
            </summary>
            <JsonBlock data={event.payload} />
          </details>
        ))}
        {!audit.length ? <div className="empty-state">No hay eventos auditados.</div> : null}
      </div>
    </section>
  );
}
