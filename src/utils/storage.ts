import { APP_CONFIG } from '@/constants/config';

/**
 * Type-safe localStorage wrapper
 */
export const storage = {
  /**
   * Get item from localStorage with type safety
   */
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue ?? null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue ?? null;
    }
  },

  /**
   * Set item in localStorage
   */
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Check if key exists in localStorage
   */
  has: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get item with expiry check
   */
  getWithExpiry: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      if (!parsed.expiry) {
        return parsed as T;
      }

      const now = Date.now();
      if (now > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value as T;
    } catch (error) {
      console.error(`Error reading with expiry from localStorage (${key}):`, error);
      return null;
    }
  },

  /**
   * Set item with expiry time (in milliseconds)
   */
  setWithExpiry: <T>(key: string, value: T, expiryMs: number): boolean => {
    try {
      const item = {
        value,
        expiry: Date.now() + expiryMs,
      };
      
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error(`Error writing with expiry to localStorage (${key}):`, error);
      return false;
    }
  },
};

/**
 * Cache manager for offline support
 */
export const cacheManager = {
  /**
   * Save routes to cache
   */
  saveRoutes: (routes: unknown) => {
    const expiryHours = APP_CONFIG.STORAGE.MAX_CACHE_AGE_HOURS;
    return storage.setWithExpiry(
      APP_CONFIG.STORAGE.ROUTES_KEY,
      routes,
      expiryHours * 60 * 60 * 1000
    );
  },

  /**
   * Get cached routes
   */
  getRoutes: <T>(): T | null => {
    return storage.getWithExpiry<T>(APP_CONFIG.STORAGE.ROUTES_KEY);
  },

  /**
   * Clear all cached data
   */
  clearCache: () => {
    storage.remove(APP_CONFIG.STORAGE.ROUTES_KEY);
    storage.remove(APP_CONFIG.STORAGE.OFFLINE_DATA_KEY);
  },

  /**
   * Add item to sync queue (for offline operations)
   */
  addToSyncQueue: (operation: unknown) => {
    const queue = storage.get<unknown[]>(APP_CONFIG.STORAGE.SYNC_QUEUE_KEY, []);
    if (queue) {
      queue.push(operation);
      return storage.set(APP_CONFIG.STORAGE.SYNC_QUEUE_KEY, queue);
    }
    return false;
  },

  /**
   * Get sync queue
   */
  getSyncQueue: <T>(): T[] => {
    return storage.get<T[]>(APP_CONFIG.STORAGE.SYNC_QUEUE_KEY, []) || [];
  },

  /**
   * Clear sync queue
   */
  clearSyncQueue: () => {
    return storage.remove(APP_CONFIG.STORAGE.SYNC_QUEUE_KEY);
  },
};
