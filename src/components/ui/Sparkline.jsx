import React from 'react';

// Inline SVG sparkline. Receives an array of {ts, value} samples (oldest first).
// Picks colors from the trend (last vs first) to give a quick read of equity
// drift. Renders nothing when there are fewer than 2 samples.

export default function Sparkline({ samples, width = 110, height = 32, padding = 2 }) {
  if (!samples || samples.length < 2) return null;

  const values = samples.map(s => s.value).filter(v => Number.isFinite(v));
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padding * 2) / (values.length - 1);

  const points = values.map((value, idx) => {
    const x = padding + idx * step;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const trend = values[values.length - 1] - values[0];
  const stroke = trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : '#64748b';
  const fill = trend > 0 ? 'rgba(22,163,74,0.12)' : trend < 0 ? 'rgba(220,38,38,0.12)' : 'rgba(100,116,139,0.12)';
  const areaPath = `M${points[0]} L${points.join(' L')} L${(width - padding).toFixed(2)},${(height - padding).toFixed(2)} L${padding},${(height - padding).toFixed(2)} Z`;

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label="Tendencia de equity"
      style={{ display: 'block' }}
    >
      <path d={areaPath} fill={fill} />
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
