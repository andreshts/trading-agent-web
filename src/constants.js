export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const DEFAULT_API_KEY = import.meta.env.VITE_API_KEY || '';

export const initialSignalRequest = {
  symbol: 'BTCUSDT',
  timeframe: '15M',
  market_type: 'spot',
  market_context:
    'Analiza BTCUSDT usando las velas e indicadores calculados por el backend. Propón BUY o SELL solo si hay una ventaja clara y define stop_loss y take_profit coherentes con el precio actual. Si no hay información suficiente, responde HOLD.',
  current_price: '',
  open_new_position: true,
};

export const initialTradeSignal = {
  symbol: 'BTCUSDT',
  action: 'BUY',
  market_type: 'spot',
  intent: 'open',
  position_side: 'long',
  confidence: '',
  entry_price: '',
  stop_loss: '',
  take_profit: '',
  risk_amount: '',
  reason: '',
};
