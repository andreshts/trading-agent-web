import React from 'react';

export default function JsonBlock({ data }) {
  if (!data) return <div className="empty-state">Sin respuesta todavia.</div>;
  return <pre className="json-block">{JSON.stringify(data, null, 2)}</pre>;
}
