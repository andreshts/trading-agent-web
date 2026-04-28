// Map raw audit events into a compact, human-readable summary so the operator
// can scan the runner's behavior at a glance instead of reading JSON blobs.
// Each entry returns { icon, label, detail, tone, category }.
//
// tone: '', 'good', 'bad', 'warn', 'muted'
// category: 'trade' | 'ia' | 'runner' | 'issue' | 'system'  (used by filter)

const ACTION_TONE = { BUY: 'good', SELL: 'bad', HOLD: 'muted' };

function fmtPrice(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function fmtMoney(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const sign = num >= 0 ? '+' : '';
  return `${sign}$${num.toFixed(2)}`;
}

function trimReason(text, max = 90) {
  if (!text) return '';
  const compact = String(text).replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

export function summarizeAuditEvent(event) {
  const type = event?.event_type;
  const p = event?.payload || {};

  switch (type) {
    case 'paper_trade':
    case 'binance_order_placed': {
      const side = p.action || p.side;
      const qty = p.quantity ?? p.qty;
      const price = fmtPrice(p.entry_price ?? p.price);
      return {
        icon: '✓',
        label: `${side} ejecutado`,
        detail: [qty && `qty ${qty}`, price && `@ ${price}`].filter(Boolean).join(' '),
        tone: side === 'SELL' ? 'bad' : 'good',
        category: 'trade',
      };
    }

    case 'paper_position_closed':
    case 'binance_user_stream_position_closed': {
      const pnl = p.realized_pnl;
      const tone = pnl == null ? '' : pnl >= 0 ? 'good' : 'bad';
      return {
        icon: pnl == null ? '⏹' : pnl >= 0 ? '✓' : '✗',
        label: 'Posición cerrada',
        detail: [p.symbol, p.exit_reason, fmtMoney(pnl)].filter(Boolean).join(' · '),
        tone,
        category: 'trade',
      };
    }

    case 'risk_decision': {
      const sig = p.signal || {};
      const dec = p.decision || {};
      const approved = dec.approved === true;
      if (approved) {
        return {
          icon: '✓',
          label: `${sig.action} aprobada`,
          detail: trimReason(dec.reason || 'Operación aprobada'),
          tone: 'good',
          category: 'ia',
        };
      }
      // HOLD-as-decision is the most common case — keep it muted.
      const isHold = sig.action === 'HOLD';
      return {
        icon: isHold ? '·' : '✗',
        label: isHold
          ? `IA dijo HOLD`
          : `${sig.action || 'Señal'} rechazada`,
        detail: trimReason(dec.reason || 'Sin razón'),
        tone: isHold ? 'muted' : 'bad',
        category: 'ia',
      };
    }

    case 'ai_signal': {
      const action = p.action || 'HOLD';
      const conf = p.confidence != null ? `conf ${Number(p.confidence).toFixed(2)}` : null;
      return {
        icon: 'ℹ',
        label: `Señal IA: ${action}`,
        detail: [conf, trimReason(p.reason, 60)].filter(Boolean).join(' · '),
        tone: ACTION_TONE[action] || '',
        category: 'ia',
      };
    }

    case 'ai_prompt':
      return {
        icon: '…',
        label: 'Prompt IA enviado',
        detail: `${p.symbol || ''} ${p.timeframe || ''}`.trim(),
        tone: 'muted',
        category: 'ia',
      };

    case 'autonomous_runner_tick': {
      const reason = p.reason || 'sin razón';
      return {
        icon: '⏭',
        label: 'Tick saltado',
        detail: `${p.symbol || ''} — ${reason}`.trim(),
        tone: 'muted',
        category: 'runner',
      };
    }

    case 'autonomous_runner_started':
      return {
        icon: '▶',
        label: 'Runner iniciado',
        detail: (p.symbols || []).join(', '),
        tone: 'good',
        category: 'runner',
      };

    case 'autonomous_runner_stopped':
      return {
        icon: '⏹',
        label: 'Runner detenido',
        detail: '',
        tone: '',
        category: 'runner',
      };

    case 'autonomous_runner_error':
      return {
        icon: '⚠',
        label: `Error en runner (#${p.consecutive_errors ?? '?'})`,
        detail: trimReason(p.error || ''),
        tone: 'warn',
        category: 'issue',
      };

    case 'autonomous_runner_circuit_breaker_tripped':
      return {
        icon: '⛔',
        label: 'Circuit breaker disparado',
        detail: trimReason(p.reason || `${p.consecutive_errors} errores consecutivos`),
        tone: 'bad',
        category: 'issue',
      };

    case 'kill_switch_activated':
      return {
        icon: '⛔',
        label: 'Kill switch activado',
        detail: trimReason(p.reason || ''),
        tone: 'bad',
        category: 'issue',
      };

    case 'kill_switch_deactivated':
      return {
        icon: '▶',
        label: 'Kill switch desactivado',
        detail: '',
        tone: 'good',
        category: 'system',
      };

    case 'risk_config_updated': {
      const changes = p.changes || {};
      const fields = Object.keys(changes);
      const detail = fields
        .slice(0, 4)
        .map(k => `${k}=${changes[k]}`)
        .join(', ');
      return {
        icon: '⚙',
        label: 'Configuración de riesgo actualizada',
        detail: fields.length > 4 ? `${detail}…` : detail,
        tone: '',
        category: 'system',
      };
    }

    case 'risk_config_reset':
      return {
        icon: '↺',
        label: 'Configuración de riesgo restablecida',
        detail: 'Valores volvieron a los del .env',
        tone: '',
        category: 'system',
      };

    default:
      return {
        icon: '·',
        label: type || 'Evento',
        detail: '',
        tone: 'muted',
        category: 'system',
      };
  }
}

export const AUDIT_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'trade', label: 'Trades' },
  { key: 'ia', label: 'IA / Riesgo' },
  { key: 'runner', label: 'Runner' },
  { key: 'issue', label: 'Alertas' },
];

export function filterAuditEvents(events, filterKey) {
  if (!filterKey || filterKey === 'all') return events;
  return events.filter(event => summarizeAuditEvent(event).category === filterKey);
}
