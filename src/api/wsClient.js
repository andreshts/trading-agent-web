import { useEffect, useRef, useState } from 'react';

const RECONNECT_INITIAL_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const PING_INTERVAL_MS = 25000;

function buildWsUrl(apiBase, apiKey) {
  let baseUrl;
  try {
    baseUrl = new URL(apiBase, window.location.href);
  } catch {
    baseUrl = new URL('http://localhost:8000');
  }
  const protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = baseUrl.pathname.replace(/\/$/, '') + '/ws';
  const url = new URL(`${protocol}//${baseUrl.host}${path}`);
  if (apiKey) url.searchParams.set('api_key', apiKey);
  return url.toString();
}

/**
 * Connects to the backend realtime WebSocket and dispatches each incoming
 * message to ``onEvent``. Handles automatic reconnection with exponential
 * backoff and keepalive pings. Returns the live connection status so the UI
 * can show whether real-time updates are flowing.
 */
export function useLiveStream(apiBase, apiKey, onEvent) {
  const [status, setStatus] = useState('connecting');
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let pingTimer = null;
    let attempt = 0;
    let cancelled = false;

    function clearTimers() {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (pingTimer) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
    }

    function connect() {
      if (cancelled) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      let ws;
      try {
        ws = new WebSocket(buildWsUrl(apiBase, apiKey));
      } catch {
        scheduleReconnect();
        return;
      }
      socket = ws;

      ws.onopen = () => {
        attempt = 0;
        setStatus('open');
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch {
              /* ignore */
            }
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        let parsed;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
        if (parsed && typeof parsed === 'object' && parsed.type) {
          try {
            handlerRef.current?.(parsed);
          } catch (err) {
            // Never let a handler error tear down the connection.
            // eslint-disable-next-line no-console
            console.error('live event handler error', err);
          }
        }
      };

      ws.onerror = () => {
        // The browser will fire onclose right after; we react there.
      };

      ws.onclose = () => {
        clearTimers();
        socket = null;
        if (cancelled) return;
        setStatus('reconnecting');
        scheduleReconnect();
      };
    }

    function scheduleReconnect() {
      const delay = Math.min(
        RECONNECT_MAX_DELAY_MS,
        RECONNECT_INITIAL_DELAY_MS * 2 ** Math.min(attempt, 5),
      );
      attempt += 1;
      reconnectTimer = window.setTimeout(connect, delay);
    }

    connect();

    return () => {
      cancelled = true;
      clearTimers();
      if (socket) {
        try {
          socket.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, [apiBase, apiKey]);

  return { status };
}
