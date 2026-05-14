import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, ApiError, PageInfo } from '../api/axios';

interface UseApiReturn<T> {
  data: T | null; loading: boolean; error: ApiError | null;
  execute: (...args: unknown[]) => Promise<ApiResponse<T>>;
  reset: () => void;
}

interface UseApiOptions<T> {
  immediate?: boolean;
  initialData?: T | null;
}

interface UseApiListReturn<T> extends Omit<UseApiReturn<T[]>, 'execute'> {
  pagination: PageInfo | null;
  execute: (...args: unknown[]) => Promise<ApiResponse<T[]>>;
}

export function useApi<T>(
  apiCall: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {},
): UseApiReturn<T> {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: unknown[]): Promise<ApiResponse<T>> => {
    setLoading(true); setError(null);
    try {
      const res = await apiCall(...args);
      setData(res.data ?? null);
      return res;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError((err as Error).message, 'UNKNOWN', 0);
      setError(apiError); throw apiError;
    } finally { setLoading(false); }
  }, [apiCall]);

  useEffect(() => { if (immediate) void execute(); }, []); // eslint-disable-line

  const reset = useCallback(() => { setData(initialData); setError(null); setLoading(false); }, [initialData]);
  return { data, loading, error, execute, reset };
}

export function useApiList<T>(
  apiCall: (...args: unknown[]) => Promise<ApiResponse<T[]>>,
  options: UseApiOptions<T[]> = {},
): UseApiListReturn<T> {
  const { immediate = true } = options;
  const [data, setData] = useState<T[] | null>(null);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: unknown[]): Promise<ApiResponse<T[]>> => {
    setLoading(true); setError(null);
    try {
      const res = await apiCall(...args);
      setData(res.data ?? []); setPagination(res.pagination ?? null);
      return res;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError((err as Error).message, 'UNKNOWN', 0);
      setError(apiError); throw apiError;
    } finally { setLoading(false); }
  }, [apiCall]);

  useEffect(() => { if (immediate) void execute(); }, []); // eslint-disable-line
  const reset = useCallback(() => { setData(null); setPagination(null); setError(null); setLoading(false); }, []);
  return { data, pagination, loading, error, execute, reset };
}
