import { useEffect, useState } from 'react';

export function useDashboardData(api, runAction) {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [limits, setLimits] = useState(null);
  const [positions, setPositions] = useState([]);
  const [positionFilter, setPositionFilter] = useState('');
  const [audit, setAudit] = useState([]);
  const [runnerStatus, setRunnerStatus] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [liveError, setLiveError] = useState('');

  async function loadDashboard(filter = positionFilter) {
    const [healthData, statusData, limitsData, positionsData, auditData, runnerData] = await Promise.all([
      api.request('/health'),
      api.request('/system/status'),
      api.request('/risk/limits'),
      api.request(`/trades/positions?limit=100${filter ? `&status=${filter}` : ''}`),
      api.request('/system/audit?limit=50'),
      api.request('/agent/autonomous/status'),
    ]);
    setHealth(healthData);
    setStatus(statusData);
    setLimits(limitsData);
    setPositions(positionsData);
    setAudit(auditData);
    setRunnerStatus(runnerData);
    setLastUpdatedAt(new Date());
  }

  async function refreshAll(filter = positionFilter, options = {}) {
    if (options.silent) {
      try {
        await loadDashboard(filter);
        setLiveError('');
      } catch (err) {
        setLiveError(err.message || 'No se pudo actualizar en vivo');
      }
      return null;
    }

    return await runAction(async () => {
      await loadDashboard(filter);
      setLiveError('');
    });
  }

  const hasOpenPositions = positions.some(position => position.status === 'OPEN');
  const liveRefreshActive = Boolean(runnerStatus?.running || hasOpenPositions);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    if (!liveRefreshActive) return undefined;

    const intervalId = window.setInterval(() => {
      refreshAll(positionFilter, { silent: true });
    }, 2000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, liveRefreshActive, positionFilter]);

  return {
    health,
    status,
    limits,
    positions,
    positionFilter,
    setPositionFilter,
    audit,
    runnerStatus,
    setRunnerStatus,
    lastUpdatedAt,
    liveError,
    liveRefreshActive,
    refreshAll,
  };
}
