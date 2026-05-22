'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/api-client';

type Options = {
  interval?: number;
  enabled?: boolean;
};

export function usePolling<T>(
  fetcher: () => Promise<T>,
  { interval = 5000, enabled = true }: Options = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [enabled, interval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
