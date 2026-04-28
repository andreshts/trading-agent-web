import React, { useEffect, useState } from 'react';
import Field from './ui/Field.jsx';

// Tunable risk knobs that can be changed without restarting the server.
// Changes are validated by the backend (Pydantic re-runs all validators) and
// persisted to runtime_overrides.json so they survive restarts.
const FIELD_GROUPS = [
  {
    title: 'Por operación',
    fields: [
      { key: 'max_risk_per_trade_percent', label: 'Riesgo máximo por trade (%)', step: 0.1, min: 0.01 },
      { key: 'min_confidence', label: 'Confianza mínima IA', step: 0.05, min: 0, max: 1 },
      { key: 'max_signal_price_deviation_percent', label: 'Desviación máxima vs mercado (%)', step: 0.05, min: 0 },
    ],
  },
  {
    title: 'Costes',
    fields: [
      { key: 'taker_fee_percent', label: 'Comisión taker (%)', step: 0.01, min: 0 },
      { key: 'slippage_assumption_percent', label: 'Slippage asumido (%)', step: 0.01, min: 0 },
      { key: 'min_reward_to_risk_ratio', label: 'R:R mínimo neto', step: 0.1, min: 0 },
    ],
  },
  {
    title: 'Límites de cuenta',
    fields: [
      { key: 'max_daily_loss', label: 'Pérdida diaria máx ($)', step: 1, min: 0 },
      { key: 'max_weekly_loss', label: 'Pérdida semanal máx ($)', step: 1, min: 0 },
      { key: 'max_trades_per_day', label: 'Trades máx por día', step: 1, min: 0 },
      { key: 'default_order_quantity', label: 'Cantidad por defecto', step: 0.0001, min: 0.0001 },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap(group => group.fields);

function emptyDraft(snapshot) {
  if (!snapshot) return {};
  const draft = {};
  for (const field of ALL_FIELDS) {
    draft[field.key] = String(snapshot[field.key] ?? '');
  }
  return draft;
}

function diffOnlyChanged(snapshot, draft) {
  const out = {};
  for (const field of ALL_FIELDS) {
    const original = snapshot[field.key];
    const raw = draft[field.key];
    if (raw === '' || raw === null || raw === undefined) continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) continue;
    if (num !== original) out[field.key] = num;
  }
  return out;
}

export default function RiskConfigPanel({ api, onAfterChange }) {
  const [snapshot, setSnapshot] = useState(null);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const data = await api.request('/system/risk-config');
      setSnapshot(data);
      setDraft(emptyDraft(data));
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar la configuración.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  async function save() {
    if (!snapshot) return;
    const changes = diffOnlyChanged(snapshot, draft);
    if (!Object.keys(changes).length) {
      setInfo('Sin cambios que guardar.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await api.request('/system/risk-config', {
        method: 'POST',
        body: JSON.stringify(changes),
      });
      setSnapshot(data);
      setDraft(emptyDraft(data));
      setInfo(`Guardado: ${Object.keys(changes).join(', ')}`);
      if (onAfterChange) await onAfterChange();
    } catch (err) {
      setError(err.message || 'Error guardando la configuración.');
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await api.request('/system/risk-config/reset', { method: 'POST' });
      setSnapshot(data);
      setDraft(emptyDraft(data));
      setInfo('Restablecido a los valores del .env.');
      if (onAfterChange) await onAfterChange();
    } catch (err) {
      setError(err.message || 'Error restableciendo.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key, value) {
    setDraft(prev => ({ ...prev, [key]: value }));
    setInfo('');
  }

  const dirtyKeys = snapshot ? Object.keys(diffOnlyChanged(snapshot, draft)) : [];
  const hasChanges = dirtyKeys.length > 0;

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Configuración de riesgo</h2>
        <span className="text-secondary">{hasChanges ? `${dirtyKeys.length} con cambios` : 'En vivo, sin reinicio'}</span>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {info ? <div className="inline-note">{info}</div> : null}

      {!snapshot ? (
        <div className="empty-state">Cargando…</div>
      ) : (
        <div className="risk-config-groups">
          {FIELD_GROUPS.map(group => (
            <div key={group.title} className="risk-config-group">
              <h3>{group.title}</h3>
              <div className="risk-config-grid">
                {group.fields.map(field => {
                  const isDirty = dirtyKeys.includes(field.key);
                  return (
                    <Field key={field.key} label={field.label}>
                      <input
                        className={`form-control ${isDirty ? 'dirty-input' : ''}`}
                        type="number"
                        step={field.step}
                        min={field.min}
                        max={field.max}
                        value={draft[field.key] ?? ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                      />
                    </Field>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="button-row">
        <button className="btn btn-primary" onClick={save} disabled={loading || !hasChanges}>
          Guardar cambios
        </button>
        <button className="btn btn-outline-secondary" onClick={() => setDraft(emptyDraft(snapshot))} disabled={loading || !hasChanges}>
          Descartar
        </button>
        <span className="button-group-divider" aria-hidden="true" />
        <button className="btn btn-outline-dark btn-sm" onClick={reset} disabled={loading}>
          Restablecer al .env
        </button>
      </div>
    </section>
  );
}
