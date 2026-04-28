import React, { useState } from 'react';
import { DEFAULT_API_BASE, DEFAULT_API_KEY } from './constants.js';
import { useApi } from './api/client.js';
import { useAsyncAction } from './hooks/useAsyncAction.js';
import { useDashboardData } from './hooks/useDashboardData.js';
import { useSignalForm } from './hooks/useSignalForm.js';
import { useManualSignal } from './hooks/useManualSignal.js';
import { useTradingActions } from './hooks/useTradingActions.js';
import Topbar from './components/Topbar.jsx';
import ModeBanner from './components/ModeBanner.jsx';
import RunnerHealthBanner from './components/RunnerHealthBanner.jsx';
import StatusGrid from './components/StatusGrid.jsx';
import AutomaticPanel from './components/AutomaticPanel.jsx';
import AssistedOrderPanel from './components/AssistedOrderPanel.jsx';
import SystemPanel from './components/SystemPanel.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import PositionsTable from './components/PositionsTable.jsx';
import AuditList from './components/AuditList.jsx';

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [killReason, setKillReason] = useState('Pausa desde la web');

  const api = useApi(apiBase, apiKey);
  const { loading, error, runAction } = useAsyncAction();

  const dashboard = useDashboardData(api, runAction, apiBase, apiKey);
  const {
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
    liveConnectionStatus,
    refreshAll,
  } = dashboard;

  const account = status?.account;
  const executionMode = status?.execution_mode || 'paper';
  const openUnrealizedPnl = positions.reduce((total, position) => total + (position.unrealized_pnl || 0), 0);

  const signalForm = useSignalForm();
  const { signalRequest, updateSignalRequest, autonomousInterval, setAutonomousInterval, buildSignalRequest } =
    signalForm;

  const manual = useManualSignal();
  const { manualSignal, updateManualSignal, applySignal, lastSignal, assistedSignalReady, quantity, setQuantity } =
    manual;

  const actions = useTradingActions({
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
  });
  const {
    agentResult,
    tickResult,
    executionResult,
    riskDecision,
    selectedOutput,
    setSelectedOutput,
    closeInputs,
    handleCloseInputChange,
    generateSignal,
    runAgent,
    runTick,
    startAutonomous,
    stopAutonomous,
    validateRisk,
    executeTrade,
    closePosition,
    systemPost,
  } = actions;

  function handlePositionFilterChange(value) {
    setPositionFilter(value);
    refreshAll(value);
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
      <Topbar
        executionMode={executionMode}
        apiBase={apiBase}
        onApiBaseChange={setApiBase}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onRefresh={() => refreshAll()}
        loading={loading}
        liveRefreshActive={liveRefreshActive}
        liveConnectionStatus={liveConnectionStatus}
        lastUpdatedAt={lastUpdatedAt}
      />

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {liveError ? <div className="alert alert-warning">{liveError}</div> : null}

      <ModeBanner executionMode={executionMode} />
      <RunnerHealthBanner runnerStatus={runnerStatus} status={status} />

      <StatusGrid
        health={health}
        status={status}
        account={account}
        executionMode={executionMode}
        runnerStatus={runnerStatus}
        audit={audit}
      />

      <main className="main-grid">
        <AutomaticPanel
          signalRequest={signalRequest}
          onSignalChange={updateSignalRequest}
          autonomousInterval={autonomousInterval}
          onAutonomousIntervalChange={setAutonomousInterval}
          runnerStatus={runnerStatus}
          loading={loading}
          onGenerateSignal={generateSignal}
          onRunAgent={runAgent}
          onRunTick={runTick}
          onStartAutonomous={startAutonomous}
          onStopAutonomous={stopAutonomous}
        />

        <AssistedOrderPanel
          manualSignal={manualSignal}
          onManualSignalChange={updateManualSignal}
          quantity={quantity}
          onQuantityChange={setQuantity}
          limits={limits}
          status={status}
          executionMode={executionMode}
          assistedSignalReady={assistedSignalReady}
          loading={loading}
          onValidateRisk={validateRisk}
          onExecuteTrade={executeTrade}
        />

        <SystemPanel
          killReason={killReason}
          onKillReasonChange={setKillReason}
          executionMode={executionMode}
          loading={loading}
          onSystemPost={systemPost}
        />

        <OutputPanel selectedOutput={selectedOutput} onSelectedOutputChange={setSelectedOutput} data={selectedData} />
      </main>

      <PositionsTable
        positions={positions}
        positionFilter={positionFilter}
        onPositionFilterChange={handlePositionFilterChange}
        openUnrealizedPnl={openUnrealizedPnl}
        closeInputs={closeInputs}
        onCloseInputChange={handleCloseInputChange}
        onClosePosition={closePosition}
        loading={loading}
      />

      <AuditList audit={audit} />
    </div>
  );
}
