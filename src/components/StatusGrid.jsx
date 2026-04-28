import React from 'react';
import MetricCard from './ui/MetricCard.jsx';
import Badge from './ui/Badge.jsx';
import Sparkline from './ui/Sparkline.jsx';
import { formatMoney } from '../utils/format.js';
import { executionLabel } from '../utils/labels.js';
import { computeRunnerMetrics, findLastDecision } from '../utils/runnerMetrics.js';

function formatTime(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return null;
  }
}

export default function StatusGrid({
  health,
  status,
  account,
  executionMode,
  runnerStatus,
  audit = [],
  equitySamples = [],
}) {
  const executionIsLive = executionMode === 'binance_live';
  const executionIsExchange = executionMode !== 'paper';
  const metrics = computeRunnerMetrics(audit);
  const lastDecision = findLastDecision(audit);
  const consecutiveErrors = runnerStatus?.consecutive_errors || 0;
  const breakerTripped = Boolean(runnerStatus?.circuit_breaker_tripped);

  const runnerNote = (() => {
    if (breakerTripped) return 'Circuit breaker disparado';
    if (consecutiveErrors > 0) return `${consecutiveErrors} errores consecutivos`;
    const lastTick = formatTime(runnerStatus?.last_tick_at);
    return lastTick ? `Último tick ${lastTick}` : 'Sin ticks';
  })();
  const runnerTone = breakerTripped ? 'bad' : consecutiveErrors > 0 ? 'warn' : runnerStatus?.running ? 'good' : '';

  const lastDecisionNote = lastDecision
    ? `${lastDecision.approved ? '✓' : '·'} ${lastDecision.reason.slice(0, 48)}${
        lastDecision.reason.length > 48 ? '…' : ''
      }`
    : 'Sin decisiones aún';
  const lastDecisionTone = !lastDecision
    ? 'muted'
    : lastDecision.approved
    ? 'good'
    : lastDecision.action === 'HOLD' || lastDecision.action === 'SKIP'
    ? ''
    : 'warn';

  return (
    <section className="status-grid">
      <MetricCard
        title="API"
        value={health?.status === 'ok' ? 'Online' : 'Sin conexion'}
        note={status?.app_env || 'development'}
        tone={health?.status === 'ok' ? 'good' : 'warn'}
      />
      <MetricCard
        title="Trading"
        value={<Badge active={Boolean(status?.trading_enabled)} onLabel="Habilitado" offLabel="Bloqueado" />}
        note={`Real ${status?.real_trading_enabled ? 'on' : 'off'}`}
      />
      <MetricCard
        title="Ejecucion"
        value={executionLabel(executionMode)}
        note={executionIsExchange ? `Exchange ${status?.exchange_configured ? 'configurado' : 'sin keys'}` : 'Local'}
        tone={executionIsLive ? 'bad' : executionIsExchange ? 'warn' : ''}
      />
      <MetricCard
        title="Equity"
        value={
          <span className="metric-with-spark">
            <span>{formatMoney(account?.equity)}</span>
            {equitySamples.length >= 2 ? <Sparkline samples={equitySamples} /> : null}
          </span>
        }
        note={`PnL ${formatMoney(account?.realized_pnl)}`}
      />
      <MetricCard
        title="Posiciones"
        value={account?.open_positions ?? 0}
        note={`${account?.trades_today ?? 0} trades hoy`}
      />
      <MetricCard
        title="Kill switch"
        value={<Badge active={Boolean(status?.kill_switch?.active)} onLabel="Activo" offLabel="Libre" />}
        note={status?.kill_switch?.reason || `${status?.audit_events ?? 0} eventos auditados`}
        tone={status?.kill_switch?.active ? 'bad' : ''}
      />
      <MetricCard
        title="Autónomo"
        value={<Badge active={Boolean(runnerStatus?.running)} onLabel="Corriendo" offLabel="Detenido" />}
        note={runnerNote}
        tone={runnerTone}
      />
      <MetricCard
        title="Actividad runner"
        value={`${metrics.total} ticks`}
        note={
          metrics.total
            ? `✓ ${metrics.executed} · ✗ ${metrics.rejected} · · ${metrics.holds} · ⏭ ${metrics.skipped}`
            : 'Sin actividad reciente'
        }
        tone={metrics.errors > 0 ? 'warn' : ''}
      />
      <MetricCard
        title="Última decisión"
        value={lastDecision ? lastDecision.action : '—'}
        note={lastDecisionNote}
        tone={lastDecisionTone}
      />
    </section>
  );
}
