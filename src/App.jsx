import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const initialSignalRequest = {
  symbol: "BTCUSDT",
  timeframe: "15M",
  market_context:
    "Analiza BTCUSDT usando las velas e indicadores calculados por el backend. Propón BUY solo si hay una ventaja clara y define stop_loss y take_profit coherentes con el precio actual. Si no hay información suficiente, responde HOLD.",
  current_price: "",
  open_new_position: true,
};

const initialTradeSignal = {
  symbol: "BTCUSDT",
  action: "BUY",
  confidence: "",
  entry_price: "",
  stop_loss: "",
  take_profit: "",
  risk_amount: "",
  reason: "",
};

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value, digits = 4) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits });
}

function formatUpdatedAt(value) {
  if (!value) return "Sin actualizar";
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function Badge({ active, onLabel = "Activo", offLabel = "Inactivo" }) {
  return (
    <span className={`badge rounded-pill ${active ? "text-bg-success" : "text-bg-secondary"}`}>
      {active ? onLabel : offLabel}
    </span>
  );
}

function JsonBlock({ data }) {
  if (!data) return <div className="empty-state">Sin respuesta todavia.</div>;
  return <pre className="json-block">{JSON.stringify(data, null, 2)}</pre>;
}

function Field({ label, children }) {
  return (
    <label className="form-label w-100">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ title, value, note, tone = "" }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function executionLabel(mode) {
  if (mode === "binance_testnet") return "Binance Testnet";
  if (mode === "binance_live") return "Binance Live";
  return "Paper";
}

function defaultContextFor(symbol) {
  return `Analiza ${symbol.toUpperCase()} usando las velas e indicadores calculados por el backend. Propón BUY solo si hay una ventaja clara y define stop_loss y take_profit coherentes con el precio actual. Si no hay información suficiente, responde HOLD.`;
}

function signalFieldLabel(field) {
  const labels = {
    entry_price: "Entrada",
    stop_loss: "Stop loss",
    take_profit: "Take profit",
    risk_amount: "Riesgo",
  };
  return labels[field] || field;
}

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [limits, setLimits] = useState(null);
  const [positions, setPositions] = useState([]);
  const [positionFilter, setPositionFilter] = useState("");
  const [audit, setAudit] = useState([]);
  const [runnerStatus, setRunnerStatus] = useState(null);
  const [signalRequest, setSignalRequest] = useState(initialSignalRequest);
  const [autonomousInterval, setAutonomousInterval] = useState("60");
  const [manualSignal, setManualSignal] = useState(initialTradeSignal);
  const [quantity, setQuantity] = useState("");
  const [killReason, setKillReason] = useState("Pausa desde la web");
  const [closeInputs, setCloseInputs] = useState({});
  const [lastSignal, setLastSignal] = useState(null);
  const [riskDecision, setRiskDecision] = useState(null);
  const [agentResult, setAgentResult] = useState(null);
  const [tickResult, setTickResult] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [selectedOutput, setSelectedOutput] = useState("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const account = status?.account;
  const executionMode = status?.execution_mode || "paper";
  const executionIsLive = executionMode === "binance_live";
  const executionIsExchange = executionMode !== "paper";
  const hasOpenPositions = positions.some((position) => position.status === "OPEN");
  const liveRefreshActive = Boolean(runnerStatus?.running || hasOpenPositions);
  const openUnrealizedPnl = positions.reduce(
    (total, position) => total + (position.unrealized_pnl || 0),
    0,
  );
  const assistedSignalReady = Boolean(
    manualSignal.symbol &&
      manualSignal.action &&
      manualSignal.action !== "HOLD" &&
      toNumberOrNull(manualSignal.confidence) !== null &&
      toNumberOrNull(manualSignal.entry_price) !== null &&
      toNumberOrNull(manualSignal.stop_loss) !== null &&
      toNumberOrNull(manualSignal.take_profit) !== null &&
      toNumberOrNull(manualSignal.risk_amount) !== null,
  );

  const api = useMemo(() => {
    async function request(path, options = {}) {
      const response = await fetch(`${apiBase}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const detail = data?.detail || response.statusText;
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }
      return data;
    }
    return { request };
  }, [apiBase]);

  async function runAction(action) {
    setLoading(true);
    setError("");
    try {
      return await action();
    } catch (err) {
      setError(err.message || "Error inesperado");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(filter = positionFilter) {
    const [healthData, statusData, limitsData, positionsData, auditData, runnerData] = await Promise.all([
      api.request("/health"),
      api.request("/system/status"),
      api.request("/risk/limits"),
      api.request(`/trades/positions?limit=100${filter ? `&status=${filter}` : ""}`),
      api.request("/system/audit?limit=50"),
      api.request("/agent/autonomous/status"),
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
        setLiveError("");
      } catch (err) {
        setLiveError(err.message || "No se pudo actualizar en vivo");
      }
      return null;
    }

    return await runAction(async () => {
      await loadDashboard(filter);
      setLiveError("");
    });
  }

  useEffect(() => {
    refreshAll();
  }, [api]);

  useEffect(() => {
    if (!liveRefreshActive) return undefined;

    const intervalId = window.setInterval(() => {
      refreshAll(positionFilter, { silent: true });
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [api, liveRefreshActive, positionFilter]);

  function updateSignalRequest(field, value) {
    setSignalRequest((current) => {
      if (field === "symbol") {
        const oldDefault = defaultContextFor(current.symbol);
        return {
          ...current,
          symbol: value,
          market_context:
            current.market_context === oldDefault ? defaultContextFor(value) : current.market_context,
        };
      }
      return { ...current, [field]: value };
    });
  }

  function updateManualSignal(field, value) {
    const numericFields = ["confidence", "entry_price", "stop_loss", "take_profit", "risk_amount"];
    setManualSignal((current) => ({
      ...current,
      [field]: numericFields.includes(field) ? toNumberOrNull(value) : value,
    }));
  }

  function buildSignalRequest() {
    return {
      symbol: signalRequest.symbol,
      timeframe: signalRequest.timeframe,
      market_context: signalRequest.market_context,
    };
  }

  function applySignal(signal) {
    setLastSignal(signal);
    setManualSignal({
      ...signal,
      confidence: signal.confidence ?? "",
      entry_price: signal.entry_price ?? "",
      stop_loss: signal.stop_loss ?? "",
      take_profit: signal.take_profit ?? "",
      risk_amount: signal.risk_amount ?? "",
      reason: signal.reason ?? "",
    });
  }

  async function generateSignal() {
    await runAction(async () => {
      const signal = await api.request("/agent/signal", {
        method: "POST",
        body: JSON.stringify(buildSignalRequest()),
      });
      applySignal(signal);
      setSelectedOutput("signal");
      await refreshAll();
    });
  }

  async function runAgent() {
    await runAction(async () => {
      const result = await api.request("/agent/run", {
        method: "POST",
        body: JSON.stringify(buildSignalRequest()),
      });
      setAgentResult(result);
      setRiskDecision(result.risk_decision);
      applySignal(result.signal);
      setSelectedOutput("agent");
      await refreshAll();
    });
  }

  async function runTick() {
    await runAction(async () => {
      const payload = {
        ...buildSignalRequest(),
        current_price: toNumberOrNull(signalRequest.current_price),
        open_new_position: Boolean(signalRequest.open_new_position),
      };
      const result = await api.request("/agent/autonomous/tick", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTickResult(result);
      if (result.run_result?.signal) applySignal(result.run_result.signal);
      if (result.run_result?.risk_decision) setRiskDecision(result.run_result.risk_decision);
      setSelectedOutput("tick");
      await refreshAll();
    });
  }

  async function startAutonomous() {
    await runAction(async () => {
      const result = await api.request("/agent/autonomous/start", {
        method: "POST",
        body: JSON.stringify({
          symbols: [signalRequest.symbol],
          timeframe: signalRequest.timeframe,
          market_context: signalRequest.market_context,
          interval_seconds: Number(autonomousInterval) || 60,
          open_new_position: Boolean(signalRequest.open_new_position),
        }),
      });
      setRunnerStatus(result);
      await refreshAll();
    });
  }

  async function stopAutonomous() {
    await runAction(async () => {
      const result = await api.request("/agent/autonomous/stop", {
        method: "POST",
      });
      setRunnerStatus(result);
      await refreshAll();
    });
  }

  async function validateRisk() {
    await runAction(async () => {
      const accountState = account || (await api.request("/system/account"));
      const decision = await api.request("/risk/validate", {
        method: "POST",
        body: JSON.stringify({ signal: manualSignal, account_state: accountState }),
      });
      setRiskDecision(decision);
      setSelectedOutput("risk");
      await refreshAll();
    });
  }

  async function executeTrade() {
    await runAction(async () => {
      const result = await api.request("/trades/execute", {
        method: "POST",
        body: JSON.stringify({
          signal: manualSignal,
          quantity: toNumberOrNull(quantity),
        }),
      });
      setExecutionResult(result);
      setSelectedOutput("execution");
      await refreshAll();
    });
  }

  async function closePosition(positionId) {
    const position = positions.find((item) => item.id === positionId);
    const closeData = closeInputs[positionId] || {};
    await runAction(async () => {
      const exitPrice = toNumberOrNull(closeData.exit_price) ?? position?.current_price;
      if (exitPrice === null || exitPrice === undefined) {
        throw new Error("No hay precio actual disponible para cerrar a mercado.");
      }
      await api.request(`/trades/positions/${positionId}/close`, {
        method: "POST",
        body: JSON.stringify({
          exit_price: exitPrice,
          exit_reason: closeData.exit_reason || "manual",
        }),
      });
      setCloseInputs((current) => {
        const next = { ...current };
        delete next[positionId];
        return next;
      });
      await refreshAll();
    });
  }

  async function systemPost(path, body) {
    await runAction(async () => {
      await api.request(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      await refreshAll();
    });
  }

  const selectedData = {
    signal: lastSignal,
    agent: agentResult,
    tick: tickResult,
    risk: riskDecision,
    execution: executionResult,
  }[selectedOutput];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{executionLabel(executionMode)}</p>
          <h1>Trading Agent</h1>
        </div>
        <div className="api-control">
          <input
            className="form-control"
            value={apiBase}
            onChange={(event) => setApiBase(event.target.value)}
            aria-label="URL base del API"
          />
          <button className="btn btn-dark" onClick={() => refreshAll()} disabled={loading}>
            Refrescar
          </button>
          <div className={`live-status ${liveRefreshActive ? "active" : ""}`}>
            <span>{liveRefreshActive ? "Live 2s" : "Manual"}</span>
            <small>{formatUpdatedAt(lastUpdatedAt)}</small>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {liveError ? <div className="alert alert-warning">{liveError}</div> : null}

      <section className={`mode-banner ${executionIsLive ? "live" : executionIsExchange ? "testnet" : ""}`}>
        <strong>{executionLabel(executionMode)}</strong>
        <span>
          {executionMode === "paper"
            ? "Modo local: no envia ordenes al exchange."
            : executionMode === "binance_testnet"
              ? "Opera con Binance Spot Testnet. Aperturas y cierres usan ordenes de mercado."
              : "Modo live: las ordenes pueden mover dinero real."}
        </span>
      </section>

      <section className="status-grid">
        <MetricCard
          title="API"
          value={health?.status === "ok" ? "Online" : "Sin conexion"}
          note={status?.app_env || "development"}
          tone={health?.status === "ok" ? "good" : "warn"}
        />
        <MetricCard
          title="Trading"
          value={<Badge active={Boolean(status?.trading_enabled)} onLabel="Habilitado" offLabel="Bloqueado" />}
          note={`Real ${status?.real_trading_enabled ? "on" : "off"}`}
        />
        <MetricCard
          title="Ejecucion"
          value={executionLabel(executionMode)}
          note={
            executionIsExchange
              ? `Exchange ${status?.exchange_configured ? "configurado" : "sin keys"}`
              : "Local"
          }
          tone={executionIsLive ? "bad" : executionIsExchange ? "warn" : ""}
        />
        <MetricCard title="Equity" value={formatMoney(account?.equity)} note={`PnL ${formatMoney(account?.realized_pnl)}`} />
        <MetricCard title="Posiciones" value={account?.open_positions ?? 0} note={`${account?.trades_today ?? 0} trades hoy`} />
        <MetricCard
          title="Kill switch"
          value={<Badge active={Boolean(status?.kill_switch?.active)} onLabel="Activo" offLabel="Libre" />}
          note={status?.kill_switch?.reason || `${status?.audit_events ?? 0} eventos auditados`}
          tone={status?.kill_switch?.active ? "bad" : ""}
        />
        <MetricCard
          title="Autonomo"
          value={<Badge active={Boolean(runnerStatus?.running)} onLabel="Corriendo" offLabel="Detenido" />}
          note={runnerStatus?.last_tick_at ? new Date(runnerStatus.last_tick_at).toLocaleTimeString() : "Sin ticks"}
          tone={runnerStatus?.running ? "good" : ""}
        />
      </section>

      <main className="main-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Operacion automatica</h2>
            <span className="text-secondary">{runnerStatus?.running ? "Activo" : "Detenido"}</span>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <Field label="Simbolo">
                <input className="form-control" value={signalRequest.symbol} onChange={(e) => updateSignalRequest("symbol", e.target.value)} />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="Temporalidad">
                <input className="form-control" value={signalRequest.timeframe} onChange={(e) => updateSignalRequest("timeframe", e.target.value)} />
              </Field>
            </div>
            <div className="col-md-4">
              <Field label="Precio opcional">
                <input
                  className="form-control"
                  value={signalRequest.current_price}
                  onChange={(e) => updateSignalRequest("current_price", e.target.value)}
                  placeholder="Usar mercado"
                />
              </Field>
            </div>
            <div className="col-12">
              <Field label="Criterio de analisis">
                <textarea
                  className="form-control"
                  rows="4"
                  value={signalRequest.market_context}
                  onChange={(e) => updateSignalRequest("market_context", e.target.value)}
                />
              </Field>
            </div>
            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={signalRequest.open_new_position}
                  onChange={(e) => updateSignalRequest("open_new_position", e.target.checked)}
                  id="openNewPosition"
                />
                <label className="form-check-label" htmlFor="openNewPosition">
                  Permitir apertura automática si no hay posición abierta
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <Field label="Intervalo automatico seg.">
                <input
                  className="form-control"
                  type="number"
                  min="5"
                  value={autonomousInterval}
                  onChange={(e) => setAutonomousInterval(e.target.value)}
                />
              </Field>
            </div>
          </div>
          <div className="button-row">
            <button className="btn btn-outline-primary" onClick={generateSignal} disabled={loading}>
              Analizar
            </button>
            <button className="btn btn-primary" onClick={runAgent} disabled={loading}>
              Operar ahora
            </button>
            <button className="btn btn-outline-dark" onClick={runTick} disabled={loading}>
              Evaluar ahora
            </button>
            <button className="btn btn-success" onClick={startAutonomous} disabled={loading || runnerStatus?.running}>
              Iniciar automático
            </button>
            <button className="btn btn-outline-danger" onClick={stopAutonomous} disabled={loading || !runnerStatus?.running}>
              Detener automático
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Orden asistida</h2>
            <span className="text-secondary">Usa la ultima señal analizada</span>
          </div>
          {!assistedSignalReady ? (
            <div className="inline-note">
              Primero ejecuta Analizar u Operar ahora. Esta seccion no envia nada hasta tener una señal completa.
            </div>
          ) : null}
          <div className="limits-strip">
            <span>Max diario {formatMoney(limits?.max_daily_loss)}</span>
            <span>Max semanal {formatMoney(limits?.max_weekly_loss)}</span>
            <span>Trades/dia {limits?.max_trades_per_day ?? "-"}</span>
            <span>Conf. min {limits?.min_confidence ?? "-"}</span>
            <span>Max orden {formatMoney(status?.max_notional_per_order)}</span>
          </div>
          <div className="row g-3">
            <div className="col-md-3">
              <Field label="Simbolo">
                <input className="form-control" value={manualSignal.symbol} onChange={(e) => updateManualSignal("symbol", e.target.value)} />
              </Field>
            </div>
            <div className="col-md-3">
              <Field label="Accion">
                <select className="form-select" value={manualSignal.action} onChange={(e) => updateManualSignal("action", e.target.value)}>
                  <option>BUY</option>
                  <option>SELL</option>
                  <option>HOLD</option>
                </select>
              </Field>
            </div>
            <div className="col-md-3">
              <Field label="Confianza">
                <input className="form-control" type="number" step="0.01" value={manualSignal.confidence ?? ""} onChange={(e) => updateManualSignal("confidence", e.target.value)} />
              </Field>
            </div>
            <div className="col-md-3">
              <Field label="Cantidad">
                <input className="form-control" type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Auto" />
              </Field>
            </div>
            {["entry_price", "stop_loss", "take_profit", "risk_amount"].map((field) => (
              <div className="col-md-3" key={field}>
                <Field label={signalFieldLabel(field)}>
                  <input className="form-control" type="number" value={manualSignal[field] ?? ""} onChange={(e) => updateManualSignal(field, e.target.value)} />
                </Field>
              </div>
            ))}
            <div className="col-12">
              <Field label="Razon">
                <input className="form-control" value={manualSignal.reason} onChange={(e) => updateManualSignal("reason", e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="button-row">
            <button className="btn btn-outline-primary" onClick={validateRisk} disabled={loading || !assistedSignalReady}>
              Validar riesgo
            </button>
            <button className="btn btn-success" onClick={executeTrade} disabled={loading || !assistedSignalReady}>
              Enviar orden {executionLabel(executionMode)}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Sistema</h2>
            <span className="text-secondary">/system</span>
          </div>
          <Field label="Motivo kill switch">
            <input className="form-control" value={killReason} onChange={(e) => setKillReason(e.target.value)} />
          </Field>
          <div className="button-row">
            <button className="btn btn-danger" onClick={() => systemPost("/system/kill-switch/activate", { reason: killReason })} disabled={loading}>
              Activar kill switch
            </button>
            <button className="btn btn-outline-success" onClick={() => systemPost("/system/kill-switch/deactivate")} disabled={loading}>
              Desactivar kill switch
            </button>
            <button className="btn btn-outline-secondary" onClick={() => systemPost("/system/trading/disable")} disabled={loading}>
              Pausar trading
            </button>
            <button className="btn btn-outline-primary" onClick={() => systemPost("/system/trading/enable")} disabled={loading}>
              Habilitar trading
            </button>
            {executionMode === "paper" ? (
              <button className="btn btn-outline-dark" onClick={() => systemPost("/system/simulation/reset")} disabled={loading}>
                Reset local
              </button>
            ) : null}
          </div>
        </section>

        <section className="panel output-panel">
          <div className="panel-heading">
            <h2>Respuesta</h2>
            <select className="form-select w-auto" value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)}>
              <option value="agent">Operacion</option>
              <option value="tick">Tick</option>
              <option value="signal">Senal</option>
              <option value="risk">Riesgo</option>
              <option value="execution">Ejecucion</option>
            </select>
          </div>
          <JsonBlock data={selectedData} />
        </section>
      </main>

      <section className="panel table-panel">
        <div className="panel-heading">
          <h2>Posiciones</h2>
          <div className="positions-toolbar">
            <span className={openUnrealizedPnl >= 0 ? "pnl-positive" : "pnl-negative"}>
              Flotante {formatMoney(openUnrealizedPnl)}
            </span>
            <select
              className="form-select"
              value={positionFilter}
              onChange={(event) => {
                setPositionFilter(event.target.value);
                refreshAll(event.target.value);
              }}
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
              {positions.map((position) => (
                <tr key={position.id}>
                  <td>{position.id}</td>
                  <td>{position.symbol}</td>
                  <td>{position.action}</td>
                  <td><Badge active={position.status === "OPEN"} onLabel="OPEN" offLabel="CLOSED" /></td>
                  <td>{executionLabel(position.execution_mode)}</td>
                  <td>{position.exchange_order_id || "-"}</td>
                  <td>{formatNumber(position.quantity)}</td>
                  <td>{formatNumber(position.entry_price, 2)}</td>
                  <td>{formatNumber(position.current_price, 2)}</td>
                  <td>{formatNumber(position.stop_loss, 2)} / {formatNumber(position.take_profit, 2)}</td>
                  <td className={position.unrealized_pnl >= 0 ? "text-success" : "text-danger"}>
                    {formatMoney(position.unrealized_pnl)}
                  </td>
                  <td className={position.realized_pnl >= 0 ? "text-success" : "text-danger"}>
                    {formatMoney(position.realized_pnl)}
                  </td>
                  <td>
                    {position.status === "OPEN" ? (
                      <div className="close-row">
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          placeholder="Mercado"
                          value={closeInputs[position.id]?.exit_price || ""}
                          onChange={(e) =>
                            setCloseInputs((current) => ({
                              ...current,
                              [position.id]: { ...(current[position.id] || {}), exit_price: e.target.value },
                            }))
                          }
                        />
                        <input
                          className="form-control form-control-sm"
                          placeholder="Motivo"
                          value={closeInputs[position.id]?.exit_reason || ""}
                          onChange={(e) =>
                            setCloseInputs((current) => ({
                              ...current,
                              [position.id]: { ...(current[position.id] || {}), exit_reason: e.target.value },
                            }))
                          }
                        />
                        <button className="btn btn-sm btn-outline-dark" onClick={() => closePosition(position.id)} disabled={loading}>
                          Cerrar mercado
                        </button>
                      </div>
                    ) : (
                      position.exit_reason || "-"
                    )}
                  </td>
                </tr>
              ))}
              {!positions.length ? (
                <tr>
                  <td colSpan="13" className="empty-state">No hay posiciones para este filtro.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <h2>Auditoria</h2>
          <span className="text-secondary">{audit.length} eventos recientes</span>
        </div>
        <div className="audit-list">
          {audit.map((event, index) => (
            <details key={`${event.timestamp}-${index}`}>
              <summary>
                <span>{event.event_type}</span>
                <time>{new Date(event.timestamp).toLocaleString()}</time>
              </summary>
              <JsonBlock data={event.payload} />
            </details>
          ))}
          {!audit.length ? <div className="empty-state">No hay eventos auditados.</div> : null}
        </div>
      </section>
    </div>
  );
}
