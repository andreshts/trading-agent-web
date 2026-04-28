import React from 'react';
import { formatUpdatedAt } from '../utils/format.js';
import { executionLabel } from '../utils/labels.js';

export default function Topbar({
  executionMode,
  apiBase,
  onApiBaseChange,
  apiKey,
  onApiKeyChange,
  onRefresh,
  loading,
  liveRefreshActive,
  liveConnectionStatus,
  lastUpdatedAt,
  debugMode,
  onDebugModeChange,
}) {
  const liveLabel = (() => {
    if (liveConnectionStatus === 'open') return 'Live WS';
    if (liveConnectionStatus === 'reconnecting') return 'Reconectando…';
    if (liveConnectionStatus === 'connecting') return 'Conectando…';
    return liveRefreshActive ? 'Polling 2s' : 'Manual';
  })();
  const liveClass = liveConnectionStatus === 'open' || liveRefreshActive ? 'active' : '';
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
        <input
          className="form-control"
          type="password"
          value={apiKey}
          onChange={event => onApiKeyChange(event.target.value)}
          placeholder="API key"
          aria-label="API key"
        />
        <button className="btn btn-dark" onClick={onRefresh} disabled={loading}>
          Refrescar
        </button>
        <label className={`debug-toggle ${debugMode ? 'active' : ''}`} title="Mostrar paneles manuales y respuesta cruda">
          <input
            type="checkbox"
            checked={Boolean(debugMode)}
            onChange={event => onDebugModeChange(event.target.checked)}
          />
          <span>Debug</span>
        </label>
        <div className={`live-status ${liveClass}`}>
          <span>{liveLabel}</span>
          <small>{formatUpdatedAt(lastUpdatedAt)}</small>
        </div>
      </div>
    </header>
  );
}
