import React from 'react';
import { formatUpdatedAt } from '../utils/format.js';
import { executionLabel } from '../utils/labels.js';

export default function Topbar({
  executionMode,
  apiBase,
  onApiBaseChange,
  onRefresh,
  loading,
  liveRefreshActive,
  lastUpdatedAt,
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{executionLabel(executionMode)}</p>
        <h1>Trading Agent</h1>
      </div>
      <div className="api-control">
        <input
          className="form-control"
          value={apiBase}
          onChange={event => onApiBaseChange(event.target.value)}
          aria-label="URL base del API"
        />
        <button className="btn btn-dark" onClick={onRefresh} disabled={loading}>
          Refrescar
        </button>
        <div className={`live-status ${liveRefreshActive ? 'active' : ''}`}>
          <span>{liveRefreshActive ? 'Live 2s' : 'Manual'}</span>
          <small>{formatUpdatedAt(lastUpdatedAt)}</small>
        </div>
      </div>
    </header>
  );
}
