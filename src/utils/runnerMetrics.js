// Derive a quick "what has the runner been doing" summary from the audit
// stream the frontend already holds. We cap at the available window (~50
// recent events) — this is for the dashboard glance, not historical truth.

export function computeRunnerMetrics(audit) {
  let executed = 0;
  let rejected = 0;
  let holds = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of audit) {
    switch (event?.event_type) {
      case 'paper_trade':
      case 'binance_order_placed':
        executed += 1;
        break;
      case 'risk_decision': {
        const sig = event.payload?.signal || {};
        const dec = event.payload?.decision || {};
        if (dec.approved) {
          // Already counted on paper_trade; avoid double counting here.
          break;
        }
        if (sig.action === 'HOLD') holds += 1;
        else rejected += 1;
        break;
      }
      case 'autonomous_runner_tick':
        skipped += 1;
        break;
      case 'autonomous_runner_error':
        errors += 1;
        break;
      default:
        break;
    }
  }

  const total = executed + rejected + holds + skipped;
  return { executed, rejected, holds, skipped, errors, total };
}

export function findLastDecision(audit) {
  for (const event of audit) {
    if (event?.event_type === 'risk_decision') {
      const sig = event.payload?.signal || {};
      const dec = event.payload?.decision || {};
      return {
        timestamp: event.timestamp,
        action: sig.action || '—',
        approved: Boolean(dec.approved),
        reason: dec.reason || '',
      };
    }
    if (event?.event_type === 'autonomous_runner_tick') {
      return {
        timestamp: event.timestamp,
        action: 'SKIP',
        approved: false,
        reason: event.payload?.reason || 'tick saltado',
      };
    }
  }
  return null;
}
