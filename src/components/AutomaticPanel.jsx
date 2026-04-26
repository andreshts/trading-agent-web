import React from 'react';
import Field from './ui/Field.jsx';

export default function AutomaticPanel({
  signalRequest,
  onSignalChange,
  autonomousInterval,
  onAutonomousIntervalChange,
  runnerStatus,
  loading,
  onGenerateSignal,
  onRunAgent,
  onRunTick,
  onStartAutonomous,
  onStopAutonomous,
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Operacion automatica</h2>
        <span className="text-secondary">{runnerStatus?.running ? 'Activo' : 'Detenido'}</span>
      </div>
      <div className="row g-3">
        <div className="col-md-4">
          <Field label="Simbolo">
            <input
              className="form-control"
              value={signalRequest.symbol}
              onChange={e => onSignalChange('symbol', e.target.value)}
            />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Temporalidad">
            <input
              className="form-control"
              value={signalRequest.timeframe}
              onChange={e => onSignalChange('timeframe', e.target.value)}
            />
          </Field>
        </div>
        <div className="col-md-4">
          <Field label="Precio opcional">
            <input
              className="form-control"
              value={signalRequest.current_price}
              onChange={e => onSignalChange('current_price', e.target.value)}
              placeholder="Usar mercado"
            />
          </Field>
        </div>
        <div className="col-12">
          <Field label="Criterio de analisis">
            <textarea
              className="form-control"
              rows="4"
              value={signalRequest.market_context}
              onChange={e => onSignalChange('market_context', e.target.value)}
            />
          </Field>
        </div>
        <div className="col-12">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={signalRequest.open_new_position}
              onChange={e => onSignalChange('open_new_position', e.target.checked)}
              id="openNewPosition"
            />
            <label className="form-check-label" htmlFor="openNewPosition">
              Permitir apertura automática si no hay posición abierta
            </label>
          </div>
        </div>
        <div className="col-md-4">
          <Field label="Intervalo automatico seg.">
            <input
              className="form-control"
              type="number"
              min="5"
              value={autonomousInterval}
              onChange={e => onAutonomousIntervalChange(e.target.value)}
            />
          </Field>
        </div>
      </div>
      <div className="button-row">
        <button className="btn btn-outline-primary" onClick={onGenerateSignal} disabled={loading}>
          Analizar
        </button>
        <button className="btn btn-primary" onClick={onRunAgent} disabled={loading}>
          Operar ahora
        </button>
        <button className="btn btn-outline-dark" onClick={onRunTick} disabled={loading}>
          Evaluar ahora
        </button>
        <button className="btn btn-success" onClick={onStartAutonomous} disabled={loading || runnerStatus?.running}>
          Iniciar automático
        </button>
        <button
          className="btn btn-outline-danger"
          onClick={onStopAutonomous}
          disabled={loading || !runnerStatus?.running}
        >
          Detener automático
        </button>
      </div>
    </section>
  );
}
