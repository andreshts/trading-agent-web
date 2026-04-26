import React from 'react';
import Field from './ui/Field.jsx';

export default function SystemPanel({ killReason, onKillReasonChange, executionMode, loading, onSystemPost }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Sistema</h2>
        <span className="text-secondary">/system</span>
      </div>
      <Field label="Motivo kill switch">
        <input className="form-control" value={killReason} onChange={e => onKillReasonChange(e.target.value)} />
      </Field>
      <div className="button-row">
        <button
          className="btn btn-danger"
          onClick={() => onSystemPost('/system/kill-switch/activate', { reason: killReason })}
          disabled={loading}
        >
          Activar kill switch
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() => onSystemPost('/system/kill-switch/deactivate')}
          disabled={loading}
        >
          Desactivar kill switch
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => onSystemPost('/system/trading/disable')}
          disabled={loading}
        >
          Pausar trading
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => onSystemPost('/system/trading/enable')}
          disabled={loading}
        >
          Habilitar trading
        </button>
        {executionMode === 'paper' ? (
          <button
            className="btn btn-outline-dark"
            onClick={() => onSystemPost('/system/simulation/reset')}
            disabled={loading}
          >
            Reset local
          </button>
        ) : null}
      </div>
    </section>
  );
}
