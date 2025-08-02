import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const queryCache = new QueryCache();

export const useQueryCache = <T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    dependencies?: any[];
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, enabled = true, dependencies = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = useCallback(async (useCache: boolean = true) => {
    if (!enabled) return;

    // Try to get from cache first
    if (useCache) {
      const cachedData = queryCache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      
      // Cache the result
      queryCache.set(key, result, ttl);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, ttl, enabled]);

  const invalidate = useCallback(() => {
    queryCache.invalidate(key);
    setData(null);
  }, [key]);

  const refresh = useCallback(() => {
    return executeQuery(false);
  }, [executeQuery]);

  // Execute query when dependencies change
  useEffect(() => {
    executeQuery();
  }, [executeQuery, ...dependencies]);

  return {
    data,
    loading,
    error,
    invalidate,
    refresh,
    executeQuery
  };
};

export { queryCache };