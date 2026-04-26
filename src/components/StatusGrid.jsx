import React from 'react';
import MetricCard from './ui/MetricCard.jsx';
import Badge from './ui/Badge.jsx';
import { formatMoney } from '../utils/format.js';
import { executionLabel } from '../utils/labels.js';

export default function StatusGrid({ health, status, account, executionMode, runnerStatus }) {
  const executionIsLive = executionMode === 'binance_live';
  const executionIsExchange = executionMode !== 'paper';
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
        value={formatMoney(account?.equity)}
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
        title="Autonomo"
        value={<Badge active={Boolean(runnerStatus?.running)} onLabel="Corriendo" offLabel="Detenido" />}
        note={runnerStatus?.last_tick_at ? new Date(runnerStatus.last_tick_at).toLocaleTimeString() : 'Sin ticks'}
        tone={runnerStatus?.running ? 'good' : ''}
      />
    </section>
  );
}
