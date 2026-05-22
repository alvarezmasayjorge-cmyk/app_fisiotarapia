'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api-client';

export function useAsyncOperation<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await operation(...args);
        return result;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [operation],
  );

  const reset = useCallback(() => setError(null), []);

  return { execute, loading, error, reset };
}
