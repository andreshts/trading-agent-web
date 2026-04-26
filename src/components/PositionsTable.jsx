import React from 'react';
import Badge from './ui/Badge.jsx';
import { formatMoney, formatNumber } from '../utils/format.js';
import { executionLabel } from '../utils/labels.js';

export default function PositionsTable({
  positions,
  positionFilter,
  onPositionFilterChange,
  openUnrealizedPnl,
  closeInputs,
  onCloseInputChange,
  onClosePosition,
  loading,
}) {
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <h2>Posiciones</h2>
        <div className="positions-toolbar">
          <span className={openUnrealizedPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
            Flotante {formatMoney(openUnrealizedPnl)}
          </span>
          <select
            className="form-select"
            value={positionFilter}
            onChange={event => onPositionFilterChange(event.target.value)}
          >
            <option value="">Todas</option>
            <option value="OPEN">Abiertas</option>
            <option value="CLOSED">Cerradas</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Simbolo</th>
              <th>Accion</th>
              <th>Estado</th>
              <th>Modo</th>
              <th>Orden</th>
              <th>Cantidad</th>
              <th>Entrada</th>
              <th>Actual</th>
              <th>SL / TP</th>
              <th>PnL flotante</th>
              <th>PnL realizado</th>
              <th>Cierre</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(position => (
              <tr key={position.id}>
                <td>{position.id}</td>
                <td>{position.symbol}</td>
                <td>{position.action}</td>
                <td>
                  <Badge active={position.status === 'OPEN'} onLabel="OPEN" offLabel="CLOSED" />
                </td>
                <td>{executionLabel(position.execution_mode)}</td>
                <td>{position.exchange_order_id || '-'}</td>
                <td>{formatNumber(position.quantity)}</td>
                <td>{formatNumber(position.entry_price, 2)}</td>
                <td>{formatNumber(position.current_price, 2)}</td>
                <td>
                  {formatNumber(position.stop_loss, 2)} / {formatNumber(position.take_profit, 2)}
                </td>
                <td className={position.unrealized_pnl >= 0 ? 'text-success' : 'text-danger'}>
                  {formatMoney(position.unrealized_pnl)}
                </td>
                <td className={position.realized_pnl >= 0 ? 'text-success' : 'text-danger'}>
                  {formatMoney(position.realized_pnl)}
                </td>
                <td>
                  {position.status === 'OPEN' ? (
                    <div className="close-row">
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        placeholder="Mercado"
                        value={closeInputs[position.id]?.exit_price || ''}
                        onChange={e => onCloseInputChange(position.id, 'exit_price', e.target.value)}
                      />
                      <input
                        className="form-control form-control-sm"
                        placeholder="Motivo"
                        value={closeInputs[position.id]?.exit_reason || ''}
                        onChange={e => onCloseInputChange(position.id, 'exit_reason', e.target.value)}
                      />
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => onClosePosition(position.id)}
                        disabled={loading}
                      >
                        Cerrar mercado
                      </button>
                    </div>
                  ) : (
                    position.exit_reason || '-'
                  )}
                </td>
              </tr>
            ))}
            {!positions.length ? (
              <tr>
                <td colSpan="13" className="empty-state">
                  No hay posiciones para este filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
