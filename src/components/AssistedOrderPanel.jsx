import React from 'react';
import Field from './ui/Field.jsx';
import { formatMoney } from '../utils/format.js';
import { executionLabel, signalFieldLabel } from '../utils/labels.js';

export default function AssistedOrderPanel({
  manualSignal,
  onManualSignalChange,
  quantity,
  onQuantityChange,
  limits,
  status,
  executionMode,
  assistedSignalReady,
  loading,
  onValidateRisk,
  onExecuteTrade,
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Orden asistida</h2>
        <span className="text-secondary">Usa la ultima señal analizada</span>
      </div>
      {!assistedSignalReady ? (
        <div className="inline-note">
          Primero ejecuta Analizar u Operar ahora. Esta seccion no envia nada hasta tener una señal completa.
        </div>
      ) : null}
      <div className="limits-strip">
        <span>Max diario {formatMoney(limits?.max_daily_loss)}</span>
        <span>Max semanal {formatMoney(limits?.max_weekly_loss)}</span>
        <span>Trades/dia {limits?.max_trades_per_day ?? '-'}</span>
        <span>Conf. min {limits?.min_confidence ?? '-'}</span>
        <span>Max orden {formatMoney(status?.max_notional_per_order)}</span>
      </div>
      <div className="row g-3">
        <div className="col-md-3">
          <Field label="Simbolo">
            <input
              className="form-control"
              value={manualSignal.symbol}
              onChange={e => onManualSignalChange('symbol', e.target.value)}
            />
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="Accion">
            <select
              className="form-select"
              value={manualSignal.action}
              onChange={e => onManualSignalChange('action', e.target.value)}
            >
              <option>BUY</option>
              <option>SELL</option>
              <option>HOLD</option>
            </select>
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="Confianza">
            <input
              className="form-control"
              type="number"
              step="0.01"
              value={manualSignal.confidence ?? ''}
              onChange={e => onManualSignalChange('confidence', e.target.value)}
            />
          </Field>
        </div>
        <div className="col-md-3">
          <Field label="Cantidad">
            <input
              className="form-control"
              type="number"
              step="0.0001"
              value={quantity}
              onChange={e => onQuantityChange(e.target.value)}
              placeholder="Auto"
            />
          </Field>
        </div>
        {['entry_price', 'stop_loss', 'take_profit', 'risk_amount'].map(field => (
          <div className="col-md-3" key={field}>
            <Field label={signalFieldLabel(field)}>
              <input
                className="form-control"
                type="number"
                value={manualSignal[field] ?? ''}
                onChange={e => onManualSignalChange(field, e.target.value)}
              />
            </Field>
          </div>
        ))}
        <div className="col-12">
          <Field label="Razon">
            <input
              className="form-control"
              value={manualSignal.reason}
              onChange={e => onManualSignalChange('reason', e.target.value)}
            />
          </Field>
        </div>
      </div>
      <div className="button-row">
        <button className="btn btn-outline-primary" onClick={onValidateRisk} disabled={loading || !assistedSignalReady}>
          Validar riesgo
        </button>
        <button className="btn btn-success" onClick={onExecuteTrade} disabled={loading || !assistedSignalReady}>
          Enviar orden {executionLabel(executionMode)}
        </button>
      </div>
    </section>
  );
}
