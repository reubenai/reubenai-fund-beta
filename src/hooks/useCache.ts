import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  persistToSessionStorage?: boolean;
}

export function useCache<T>(key: string, config: CacheConfig = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    persistToSessionStorage = false
  } = config;

  const [cache] = useState<Map<string, CacheItem<T>>>(new Map());
  const [loading, setLoading] = useState(false);

  // Load from session storage on mount
  useEffect(() => {
    if (persistToSessionStorage) {
      try {
        const stored = sessionStorage.getItem(`cache_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.expiresAt > Date.now()) {
            cache.set(key, parsed);
          }
        }
      } catch (error) {
        console.warn('Failed to load cache from session storage:', error);
      }
    }
  }, [key, persistToSessionStorage, cache]);

  const get = useCallback((cacheKey: string): T | null => {
    const item = cache.get(cacheKey);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      cache.delete(cacheKey);
      if (persistToSessionStorage) {
        sessionStorage.removeItem(`cache_${cacheKey}`);
      }
      return null;
    }

    return item.data;
  }, [cache, persistToSessionStorage]);

  const set = useCallback((cacheKey: string, data: T) => {
    // Manage cache size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
        if (persistToSessionStorage) {
          sessionStorage.removeItem(`cache_${firstKey}`);
        }
      }
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    cache.set(cacheKey, item);

    if (persistToSessionStorage) {
      try {
        sessionStorage.setItem(`cache_${cacheKey}`, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to persist cache to session storage:', error);
      }
    }
  }, [cache, maxSize, ttl, persistToSessionStorage]);

  const fetchWithCache = useCallback(async (
    cacheKey: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    setLoading(true);
    try {
      const data = await fetchFn();
      set(cacheKey, data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [get, set]);

  const invalidate = useCallback((pattern?: string) => {
    if (pattern) {
      // Invalidate keys matching pattern
      Array.from(cache.keys()).forEach(key => {
        if (key.includes(pattern)) {
          cache.delete(key);
          if (persistToSessionStorage) {
            sessionStorage.removeItem(`cache_${key}`);
          }
        }
      });
    } else {
      // Clear all cache
      cache.clear();
      if (persistToSessionStorage) {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('cache_')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    }
  }, [cache, persistToSessionStorage]);

  const getStats = useCallback(() => {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    cache.forEach(item => {
      if (now > item.expiresAt) {
        expiredItems++;
      } else {
        validItems++;
      }
    });

    return {
      size: cache.size,
      validItems,
      expiredItems,
      hitRate: 0 // Could implement hit tracking if needed
    };
  }, [cache]);

  return {
    loading,
    get,
    set,
    fetchWithCache,
    invalidate,
    getStats
  };
}

// Specialized hooks for common data types
export function useDealsCache(fundId: string) {
  return useCache(`deals_${fundId}`, {
    ttl: 2 * 60 * 1000, // 2 minutes for deals
    persistToSessionStorage: true
  });
}

export function useAnalysisCache(dealId: string) {
  return useCache(`analysis_${dealId}`, {
    ttl: 10 * 60 * 1000, // 10 minutes for analysis
    persistToSessionStorage: true
  });
}

export function useStrategyCache(fundId: string) {
  return useCache(`strategy_${fundId}`, {
    ttl: 30 * 60 * 1000, // 30 minutes for strategy
    persistToSessionStorage: true
  });
}