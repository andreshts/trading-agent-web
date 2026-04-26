import React from 'react';
import { executionLabel } from '../utils/labels.js';

export default function ModeBanner({ executionMode }) {
  const executionIsLive = executionMode === 'binance_live';
  const executionIsExchange = executionMode !== 'paper';
  return (
    <section className={`mode-banner ${executionIsLive ? 'live' : executionIsExchange ? 'testnet' : ''}`}>
      <strong>{executionLabel(executionMode)}</strong>
      <span>
        {executionMode === 'paper'
          ? 'Modo local: no envia ordenes al exchange.'
          : executionMode === 'binance_testnet'
            ? 'Opera con Binance Spot Testnet. Aperturas y cierres usan ordenes de mercado.'
            : 'Modo live: las ordenes pueden mover dinero real.'}
      </span>
    </section>
  );
}
