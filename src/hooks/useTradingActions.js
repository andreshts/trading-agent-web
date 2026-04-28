import { useState } from 'react';
import { toNumberOrNull } from '../utils/format.js';

export function useTradingActions({
  api,
  runAction,
  signalRequest,
  autonomousInterval,
  buildSignalRequest,
  manualSignal,
  applySignal,
  quantity,
  account,
  positions,
  refreshAll,
  setRunnerStatus,
}) {
  const [agentResult, setAgentResult] = useState(null);
  const [tickResult, setTickResult] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [riskDecision, setRiskDecision] = useState(null);
  const [selectedOutput, setSelectedOutput] = useState('agent');
  const [closeInputs, setCloseInputs] = useState({});

  async function generateSignal() {
    await runAction(async () => {
      const signal = await api.request('/agent/signal', {
        method: 'POST',
        body: JSON.stringify(buildSignalRequest()),
      });
      applySignal(signal);
      setSelectedOutput('signal');
      await refreshAll();
    });
  }

  async function runAgent() {
    await runAction(async () => {
      const result = await api.request('/agent/run', {
        method: 'POST',
        body: JSON.stringify(buildSignalRequest()),
      });
      setAgentResult(result);
      setRiskDecision(result.risk_decision);
      applySignal(result.signal);
      setSelectedOutput('agent');
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
      const result = await api.request('/agent/autonomous/tick', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTickResult(result);
      if (result.run_result?.signal) applySignal(result.run_result.signal);
      if (result.run_result?.risk_decision) setRiskDecision(result.run_result.risk_decision);
      setSelectedOutput('tick');
      await refreshAll();
    });
  }

  async function startAutonomous() {
    await runAction(async () => {
      const result = await api.request('/agent/autonomous/start', {
        method: 'POST',
        body: JSON.stringify({
          symbols: [signalRequest.symbol],
          timeframe: signalRequest.timeframe,
          market_type: signalRequest.market_type,
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
      const result = await api.request('/agent/autonomous/stop', { method: 'POST' });
      setRunnerStatus(result);
      await refreshAll();
    });
  }

  async function validateRisk() {
    await runAction(async () => {
      const accountState = account || (await api.request('/system/account'));
      const decision = await api.request('/risk/validate', {
        method: 'POST',
        body: JSON.stringify({ signal: manualSignal, account_state: accountState }),
      });
      setRiskDecision(decision);
      setSelectedOutput('risk');
      await refreshAll();
    });
  }

  async function executeTrade() {
    await runAction(async () => {
      const result = await api.request('/trades/execute', {
        method: 'POST',
        body: JSON.stringify({
          signal: manualSignal,
          quantity: toNumberOrNull(quantity),
        }),
      });
      setExecutionResult(result);
      setSelectedOutput('execution');
      await refreshAll();
    });
  }

  async function closePosition(positionId) {
    const position = positions.find(item => item.id === positionId);
    const closeData = closeInputs[positionId] || {};
    await runAction(async () => {
      const exitPrice = toNumberOrNull(closeData.exit_price) ?? position?.current_price;
      if (exitPrice === null || exitPrice === undefined) {
        throw new Error('No hay precio actual disponible para cerrar a mercado.');
      }
      await api.request(`/trades/positions/${positionId}/close`, {
        method: 'POST',
        body: JSON.stringify({
          exit_price: exitPrice,
          exit_reason: closeData.exit_reason || 'manual',
        }),
      });
      setCloseInputs(current => {
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
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      await refreshAll();
    });
  }

  function handleCloseInputChange(positionId, field, value) {
    setCloseInputs(current => ({
      ...current,
      [positionId]: { ...(current[positionId] || {}), [field]: value },
    }));
  }

  return {
    // results
    agentResult,
    tickResult,
    executionResult,
    riskDecision,
    selectedOutput,
    setSelectedOutput,
    // close inputs
    closeInputs,
    handleCloseInputChange,
    // actions
    generateSignal,
    runAgent,
    runTick,
    startAutonomous,
    stopAutonomous,
    validateRisk,
    executeTrade,
    closePosition,
    systemPost,
  };
}
