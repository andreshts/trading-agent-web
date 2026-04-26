import { useState } from 'react';

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAction(action) {
    setLoading(true);
    setError('');
    try {
      return await action();
    } catch (err) {
      setError(err.message || 'Error inesperado');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, setError, runAction };
}
