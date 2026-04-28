import React from 'react';
import { executionLabel } from '../utils/labels.js';

export default function ModeBanner({ executionMode, marketType = 'spot' }) {
  const executionIsLive = executionMode === 'binance_live';
  const executionIsExchange = executionMode !== 'paper';
  const market = marketType.toUpperCase();
  return (
    <section className={`mode-banner ${executionIsLive ? 'live' : executionIsExchange ? 'testnet' : ''}`}>
      <strong>{executionLabel(executionMode)} · {market}</strong>
      <span>
        {executionMode === 'paper'
          ? 'Modo local: simula Spot, Futures o Margin sin enviar ordenes al exchange.'
          : executionMode === 'binance_testnet'
            ? `Opera con Binance ${market} Testnet cuando el mercado lo soporta.`
            : `Modo live ${market}: las ordenes pueden mover dinero real.`}
      </span>
    </section>
  );
}
