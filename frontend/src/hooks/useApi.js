import { useState, useCallback } from 'react';

/**
 * Generic API call hook with loading state and error handling.
 */
export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorMsg = err.message || 'An unexpected error occurred';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}
