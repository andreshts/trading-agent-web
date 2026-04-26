export function executionLabel(mode) {
  if (mode === 'binance_testnet') return 'Binance Testnet';
  if (mode === 'binance_live') return 'Binance Live';
  return 'Paper';
}

export function defaultContextFor(symbol) {
  return `Analiza ${symbol.toUpperCase()} usando las velas e indicadores calculados por el backend. Propón BUY solo si hay una ventaja clara y define stop_loss y take_profit coherentes con el precio actual. Si no hay información suficiente, responde HOLD.`;
}

export function signalFieldLabel(field) {
  const labels = {
    entry_price: 'Entrada',
    stop_loss: 'Stop loss',
    take_profit: 'Take profit',
    risk_amount: 'Riesgo',
  };
  return labels[field] || field;
}
