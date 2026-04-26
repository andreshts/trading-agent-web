import { useState } from 'react';
import { initialSignalRequest } from '../constants.js';
import { defaultContextFor } from '../utils/labels.js';

export function useSignalForm() {
  const [signalRequest, setSignalRequest] = useState(initialSignalRequest);
  const [autonomousInterval, setAutonomousInterval] = useState('60');

  function updateSignalRequest(field, value) {
    setSignalRequest(current => {
      if (field === 'symbol') {
        const oldDefault = defaultContextFor(current.symbol);
        return {
          ...current,
          symbol: value,
          market_context: current.market_context === oldDefault ? defaultContextFor(value) : current.market_context,
        };
      }
      return { ...current, [field]: value };
    });
  }

  function buildSignalRequest() {
    return {
      symbol: signalRequest.symbol,
      timeframe: signalRequest.timeframe,
      market_context: signalRequest.market_context,
    };
  }

  return {
    signalRequest,
    updateSignalRequest,
    autonomousInterval,
    setAutonomousInterval,
    buildSignalRequest,
  };
}
