import React from 'react';
import JsonBlock from './ui/JsonBlock.jsx';

export default function OutputPanel({ selectedOutput, onSelectedOutputChange, data }) {
  return (
    <section className="panel output-panel">
      <div className="panel-heading">
        <h2>Respuesta</h2>
        <select
          className="form-select w-auto"
          value={selectedOutput}
          onChange={e => onSelectedOutputChange(e.target.value)}
        >
          <option value="agent">Operacion</option>
          <option value="tick">Tick</option>
          <option value="signal">Senal</option>
          <option value="risk">Riesgo</option>
          <option value="execution">Ejecucion</option>
        </select>
      </div>
      <JsonBlock data={data} />
    </section>
  );
}
