import React from 'react';

export default function Badge({ active, onLabel = 'Activo', offLabel = 'Inactivo' }) {
  return (
    <span className={`badge rounded-pill ${active ? 'text-bg-success' : 'text-bg-secondary'}`}>
      {active ? onLabel : offLabel}
    </span>
  );
}
