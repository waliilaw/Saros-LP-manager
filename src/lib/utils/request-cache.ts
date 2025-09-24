interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Additional time to serve stale data while revalidating
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private revalidating: Set<string> = new Set();

  private static instance: RequestCache;

  private constructor() {}

  static getInstance(): RequestCache {
    if (!RequestCache.instance) {
      RequestCache.instance = new RequestCache();
    }
    return RequestCache.instance;
  }

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    // If we have a valid cache entry, return it
    if (entry && now < entry.expiresAt) {
      return entry.data;
    }

    // If we have a stale entry and it's within the staleWhileRevalidate window
    if (
      entry &&
      options.staleWhileRevalidate &&
      now < entry.expiresAt + options.staleWhileRevalidate * 1000
    ) {
      // Revalidate in the background if not already doing so
      if (!this.revalidating.has(key)) {
        this.revalidateInBackground(key, fetchFn, options);
      }
      return entry.data;
    }

    // No valid cache entry, fetch fresh data
    return this.fetchAndCache(key, fetchFn, options);
  }

  private async revalidateInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    this.revalidating.add(key);
    try {
      await this.fetchAndCache(key, fetchFn, options);
    } finally {
      this.revalidating.delete(key);
    }
  }

  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    try {
      const data = await fetchFn();
      const ttl = options.ttl || 300; // Default 5 minutes
      
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl * 1000,
      });

      return data;
    } catch (error) {
      // If we have a stale entry, return it on error
      const staleEntry = this.cache.get(key);
      if (staleEntry) {
        console.warn(`Failed to fetch fresh data for ${key}, using stale data:`, error);
        return staleEntry.data;
      }
      throw error;
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getEntryMetadata(key: string): { isCached: boolean; isStale: boolean; age?: number } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { isCached: false, isStale: false };
    }

    const now = Date.now();
    return {
      isCached: true,
      isStale: now > entry.expiresAt,
      age: Math.floor((now - entry.timestamp) / 1000),
    };
  }
}

// Export singleton instance
export const requestCache = RequestCache.getInstance();
