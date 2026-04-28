import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'trading-agent-equity-history';
const MAX_SAMPLES = 240; // ~ a few hours of activity at runner cadence
const MIN_SAMPLE_GAP_MS = 5_000; // ignore noisy duplicate updates

function loadInitial() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(s => s && Number.isFinite(s.value) && Number.isFinite(s.ts))
      .slice(-MAX_SAMPLES);
  } catch {
    return [];
  }
}

function persist(samples) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  } catch {
    // localStorage unavailable; degrade gracefully — the sparkline still
    // works for the lifetime of the tab.
  }
}

export function useEquityHistory(equity) {
  const [samples, setSamples] = useState(loadInitial);
  const lastRef = useRef(samples[samples.length - 1] || null);

  useEffect(() => {
    if (!Number.isFinite(equity)) return;
    const now = Date.now();
    const last = lastRef.current;
    if (last && now - last.ts < MIN_SAMPLE_GAP_MS && last.value === equity) {
      return;
    }
    setSamples(prev => {
      const next = [...prev, { ts: now, value: equity }].slice(-MAX_SAMPLES);
      lastRef.current = next[next.length - 1];
      persist(next);
      return next;
    });
  }, [equity]);

  function reset() {
    lastRef.current = null;
    setSamples([]);
    persist([]);
  }

  return { samples, reset };
}
