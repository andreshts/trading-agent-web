import React from 'react';

// Surface anything the operator must notice without scrolling: tripped circuit
// breaker, error streak, kill switch active, or runner stopped while trading
// is supposedly enabled. Stays out of the way (returns null) when healthy.

export default function RunnerHealthBanner({ runnerStatus, status }) {
  const breaker = runnerStatus?.circuit_breaker_tripped;
  const errors = runnerStatus?.consecutive_errors || 0;
  const killActive = status?.kill_switch?.active;
  const tradingEnabled = status?.trading_enabled;
  const runnerRunning = runnerStatus?.running;

  const alerts = [];
  if (breaker) {
    alerts.push({
      tone: 'bad',
      icon: '⛔',
      title: 'Circuit breaker disparado',
      detail:
        runnerStatus?.circuit_breaker_reason ||
        'El runner se detuvo tras varios errores consecutivos. Revisa la causa antes de reiniciar.',
    });
  }
  if (killActive) {
    alerts.push({
      tone: 'bad',
      icon: '⛔',
      title: 'Kill switch activo',
      detail: status?.kill_switch?.reason || 'Trading bloqueado. Desactívalo cuando estés listo.',
    });
  }
  if (errors > 0 && !breaker) {
    alerts.push({
      tone: 'warn',
      icon: '⚠',
      title: `${errors} ${errors === 1 ? 'error consecutivo' : 'errores consecutivos'}`,
      detail: runnerStatus?.last_error || 'El runner está reintentando con backoff.',
    });
  }
  if (!tradingEnabled && !killActive) {
    alerts.push({
      tone: 'warn',
      icon: '⏸',
      title: 'Trading deshabilitado',
      detail: 'No se ejecutarán nuevas órdenes hasta que vuelvas a habilitarlo.',
    });
  }
  if (!runnerRunning && tradingEnabled && !killActive && !breaker) {
    alerts.push({
      tone: 'info',
      icon: 'ℹ',
      title: 'Runner detenido',
      detail: 'Inicia el modo automático para que opere sin intervención.',
    });
  }

  if (!alerts.length) return null;

  return (
    <div className="health-banner-stack">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`health-banner tone-${alert.tone}`} role="status">
          <span className="health-banner-icon" aria-hidden="true">
            {alert.icon}
          </span>
          <div>
            <strong>{alert.title}</strong>
            <span>{alert.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
