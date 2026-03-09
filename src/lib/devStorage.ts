// Alternative storage for DEF-DEV mode data
// Separates development/debug data from production system data

const DEV_STORAGE_PREFIX = 'defdev_';

export const devStorage = {
  // Get a value from dev storage
  get: (key: string): string | null => {
    return localStorage.getItem(`${DEV_STORAGE_PREFIX}${key}`);
  },

  // Set a value in dev storage
  set: (key: string, value: string): void => {
    localStorage.setItem(`${DEV_STORAGE_PREFIX}${key}`, value);
  },

  // Remove a value from dev storage
  remove: (key: string): void => {
    localStorage.removeItem(`${DEV_STORAGE_PREFIX}${key}`);
  },

  // Get all dev storage keys
  getKeys: (): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEV_STORAGE_PREFIX)) {
        keys.push(key.replace(DEV_STORAGE_PREFIX, ''));
      }
    }
    return keys;
  },

  // Get all dev storage entries
  getAll: (): Record<string, string> => {
    const entries: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEV_STORAGE_PREFIX)) {
        const cleanKey = key.replace(DEV_STORAGE_PREFIX, '');
        entries[cleanKey] = localStorage.getItem(key) || '';
      }
    }
    return entries;
  },

  // Clear all dev storage
  clear: (): void => {
    const keys = devStorage.getKeys();
    keys.forEach(key => devStorage.remove(key));
  },

  // Get total size of dev storage in bytes
  getSize: (): number => {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEV_STORAGE_PREFIX)) {
        size += (localStorage.getItem(key) || '').length;
      }
    }
    return size;
  },

  // Check if a key exists in dev storage
  has: (key: string): boolean => {
    return localStorage.getItem(`${DEV_STORAGE_PREFIX}${key}`) !== null;
  },

  // Get JSON value from dev storage
  getJSON: <T>(key: string, defaultValue: T): T => {
    const value = devStorage.get(key);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  },

  // Set JSON value in dev storage
  setJSON: <T>(key: string, value: T): void => {
    devStorage.set(key, JSON.stringify(value));
  }
};

// Make available globally for debugging (typed via vite-env.d.ts)
(window as Window).devStorage = devStorage;
