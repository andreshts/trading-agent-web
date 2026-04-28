import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveStream } from '../api/wsClient.js';

const POLLING_FALLBACK_MS = 2000;
const REFRESH_DEBOUNCE_MS = 200;

export function useDashboardData(api, runAction, apiBase, apiKey) {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [limits, setLimits] = useState(null);
  const [positions, setPositions] = useState([]);
  const [positionFilter, setPositionFilter] = useState('');
  const [audit, setAudit] = useState([]);
  const [runnerStatus, setRunnerStatus] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [liveError, setLiveError] = useState('');

  const positionFilterRef = useRef(positionFilter);
  positionFilterRef.current = positionFilter;
  const refreshTimers = useRef({});

  const fetchResource = useCallback(
    async (resource, filter = positionFilterRef.current) => {
      switch (resource) {
        case 'status': {
          const data = await api.request('/system/status');
          setStatus(data);
          return;
        }
        case 'positions': {
          const data = await api.request(
            `/trades/positions?limit=100${filter ? `&status=${filter}` : ''}`,
          );
          setPositions(data);
          return;
        }
        case 'runner': {
          const data = await api.request('/agent/autonomous/status');
          setRunnerStatus(data);
          return;
        }
        case 'audit': {
          const data = await api.request('/system/audit?limit=50');
          setAudit(data);
          return;
        }
        case 'health': {
          const data = await api.request('/health');
          setHealth(data);
          return;
        }
        case 'limits': {
          const data = await api.request('/risk/limits');
          setLimits(data);
          return;
        }
        default:
          return;
      }
    },
    [api],
  );

  const scheduleRefresh = useCallback(
    (resources) => {
      const list = Array.isArray(resources) ? resources : [resources];
      list.forEach((resource) => {
        if (refreshTimers.current[resource]) return;
        refreshTimers.current[resource] = window.setTimeout(async () => {
          refreshTimers.current[resource] = null;
          try {
            await fetchResource(resource);
            setLastUpdatedAt(new Date());
            setLiveError('');
          } catch (err) {
            setLiveError(err.message || `No se pudo actualizar ${resource}`);
          }
        }, REFRESH_DEBOUNCE_MS);
      });
    },
    [fetchResource],
  );

  async function loadDashboard(filter = positionFilterRef.current, options = {}) {
    const includeStatic = options.includeStatic ?? true;
    const includeAudit = options.includeAudit ?? true;
    const [healthData, statusData, limitsData, positionsData, auditData, runnerData] = await Promise.all([
      includeStatic ? api.request('/health') : Promise.resolve(health),
      api.request('/system/status'),
      includeStatic ? api.request('/risk/limits') : Promise.resolve(limits),
      api.request(`/trades/positions?limit=100${filter ? `&status=${filter}` : ''}`),
      includeAudit ? api.request('/system/audit?limit=50') : Promise.resolve(audit),
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

  async function refreshAll(filter = positionFilterRef.current, options = {}) {
    if (options.silent) {
      try {
        await loadDashboard(filter, { includeStatic: false, includeAudit: false });
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

  const handleLiveEvent = useCallback(
    (event) => {
      const { type, data } = event;
      switch (type) {
        case 'audit_event':
          if (data) {
            setAudit((prev) => [data, ...prev].slice(0, 50));
            setLastUpdatedAt(new Date());
          }
          break;
        case 'resources_changed':
          if (data?.resources?.length) scheduleRefresh(data.resources);
          break;
        case 'position_prices': {
          const prices = data?.prices || {};
          if (!Object.keys(prices).length) return;
          setPositions((prev) =>
            prev.map((position) => {
              if (position.status !== 'OPEN') return position;
              const price = prices[position.symbol];
              if (price == null) return position;
              const direction = position.action === 'BUY' ? 1 : -1;
              const unrealized = direction * (price - position.entry_price) * position.quantity;
              return { ...position, current_price: price, unrealized_pnl: unrealized };
            }),
          );
          setLastUpdatedAt(new Date());
          break;
        }
        case 'hello':
        case 'pong':
        case 'ping':
          setLastUpdatedAt(new Date());
          break;
        default:
          break;
      }
    },
    [scheduleRefresh],
  );

  const live = useLiveStream(apiBase, apiKey, handleLiveEvent);
  const liveConnected = live.status === 'open';

  const hasOpenPositions = positions.some((position) => position.status === 'OPEN');
  const liveRefreshActive = Boolean(runnerStatus?.running || hasOpenPositions);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // Polling fallback: only used when the WebSocket cannot connect, so the
  // dashboard still feels live even on networks that block WS upgrades.
  useEffect(() => {
    if (liveConnected) return undefined;
    if (!liveRefreshActive) return undefined;

    const intervalId = window.setInterval(() => {
      refreshAll(positionFilterRef.current, { silent: true });
    }, POLLING_FALLBACK_MS);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, liveConnected, liveRefreshActive, positionFilter]);

  useEffect(
    () => () => {
      Object.values(refreshTimers.current).forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    },
    [],
  );

  return useMemo(
    () => ({
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
      liveConnectionStatus: live.status,
      refreshAll,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [health, status, limits, positions, positionFilter, audit, runnerStatus, lastUpdatedAt, liveError, liveRefreshActive, live.status],
  );
}

