import React from 'react';
import Field from './ui/Field.jsx';

function RunnerSummary({ runnerStatus }) {
  const symbols = (runnerStatus?.symbols || []).join(', ') || '—';
  const timeframe = runnerStatus?.timeframe || '—';
  const marketType = runnerStatus?.market_type || 'spot';
  const cadence = runnerStatus?.align_to_candle_close
    ? `cierre de vela ${timeframe}`
    : `cada ${runnerStatus?.interval_seconds || '?'} s`;
  const opening = runnerStatus?.open_new_position ? 'Permitida' : 'Bloqueada';
  return (
    <div className="runner-summary">
      <div>
        <span>Símbolos</span>
        <strong>{symbols}</strong>
      </div>
      <div>
        <span>Mercado</span>
        <strong>{marketType.toUpperCase()}</strong>
      </div>
      <div>
        <span>Temporalidad</span>
        <strong>{timeframe}</strong>
      </div>
      <div>
        <span>Cadencia</span>
        <strong>{cadence}</strong>
      </div>
      <div>
        <span>Apertura</span>
        <strong>{opening}</strong>
      </div>
    </div>
  );
}

export default function AutomaticPanel({
  signalRequest,
  onSignalChange,
  autonomousInterval,
  onAutonomousIntervalChange,
  runnerStatus,
  loading,
  debugMode,
  onGenerateSignal,
  onRunAgent,
  onRunTick,
  onStartAutonomous,
  onStopAutonomous,
}) {
  const running = Boolean(runnerStatus?.running);
  const showConfigForm = !running || debugMode;
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Operación automática</h2>
        <span className="text-secondary">{running ? 'Activo' : 'Detenido'}</span>
      </div>

      {running ? <RunnerSummary runnerStatus={runnerStatus} /> : null}

      {showConfigForm ? (
        <div className="row g-3">
          <div className="col-md-3">
            <Field label="Símbolo">
              <input
                className="form-control"
                value={signalRequest.symbol}
                onChange={e => onSignalChange('symbol', e.target.value)}
              />
            </Field>
          </div>
          <div className="col-md-3">
            <Field label="Mercado">
              <select
                className="form-select"
                value={signalRequest.market_type}
                onChange={e => onSignalChange('market_type', e.target.value)}
              >
                <option value="spot">Spot</option>
                <option value="futures">Futures</option>
                <option value="margin">Margin</option>
              </select>
            </Field>
          </div>
          <div className="col-md-3">
            <Field label="Temporalidad">
              <input
                className="form-control"
                value={signalRequest.timeframe}
                onChange={e => onSignalChange('timeframe', e.target.value)}
              />
            </Field>
          </div>
          <div className="col-md-3">
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
            <Field label="Criterio de análisis">
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
            <Field label="Intervalo automático seg.">
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
      ) : null}

      <div className="button-row">
        <button
          className="btn btn-success"
          onClick={onStartAutonomous}
          disabled={loading || running}
        >
          Iniciar automático
        </button>
        <button
          className="btn btn-outline-danger"
          onClick={onStopAutonomous}
          disabled={loading || !running}
        >
          Detener automático
        </button>
        {debugMode ? (
          <>
            <span className="button-group-divider" aria-hidden="true" />
            <button className="btn btn-outline-primary btn-sm" onClick={onGenerateSignal} disabled={loading}>
              Analizar
            </button>
            <button className="btn btn-outline-dark btn-sm" onClick={onRunAgent} disabled={loading}>
              Operar ahora
            </button>
            <button className="btn btn-outline-dark btn-sm" onClick={onRunTick} disabled={loading}>
              Evaluar ahora
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
