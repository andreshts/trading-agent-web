import { useState } from 'react';
import { initialTradeSignal } from '../constants.js';
import { toNumberOrNull } from '../utils/format.js';

const NUMERIC_FIELDS = new Set(['confidence', 'entry_price', 'stop_loss', 'take_profit', 'risk_amount']);

export function useManualSignal() {
  const [manualSignal, setManualSignal] = useState(initialTradeSignal);
  const [lastSignal, setLastSignal] = useState(null);
  const [quantity, setQuantity] = useState('');

  function updateManualSignal(field, value) {
    setManualSignal(current => ({
      ...current,
      [field]: NUMERIC_FIELDS.has(field) ? toNumberOrNull(value) : value,
    }));
  }

  function applySignal(signal) {
    setLastSignal(signal);
    setManualSignal({
      ...signal,
      confidence: signal.confidence ?? '',
      entry_price: signal.entry_price ?? '',
      stop_loss: signal.stop_loss ?? '',
      take_profit: signal.take_profit ?? '',
      risk_amount: signal.risk_amount ?? '',
      market_type: signal.market_type || 'spot',
      intent: signal.intent || 'open',
      position_side: signal.position_side || (signal.action === 'SELL' ? 'short' : 'long'),
      reason: signal.reason ?? '',
    });
  }

  const assistedSignalReady = Boolean(
    manualSignal.symbol &&
    manualSignal.action &&
    manualSignal.action !== 'HOLD' &&
    toNumberOrNull(manualSignal.confidence) !== null &&
    toNumberOrNull(manualSignal.entry_price) !== null &&
    toNumberOrNull(manualSignal.stop_loss) !== null &&
    toNumberOrNull(manualSignal.take_profit) !== null &&
    toNumberOrNull(manualSignal.risk_amount) !== null
  );

  return {
    manualSignal,
    updateManualSignal,
    applySignal,
    lastSignal,
    assistedSignalReady,
    quantity,
    setQuantity,
  };
}
