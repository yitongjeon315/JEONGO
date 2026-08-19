import { beforeEach, describe, expect, it } from 'vitest';
import { clearOfflineSnapshot, OFFLINE_SNAPSHOT_KEY, queueOfflineSnapshot, readOfflineSnapshot } from './offline-sync';

describe('offline account sync queue', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it('stores and restores the latest snapshot', () => {
    queueOfflineSnapshot({ stats: { xp: 10 } });
    expect(readOfflineSnapshot()?.snapshot).toEqual({ stats: { xp: 10 } });
    clearOfflineSnapshot();
    expect(window.localStorage.getItem(OFFLINE_SNAPSHOT_KEY)).toBeNull();
  });

  it('drops corrupt queue data', () => {
    window.localStorage.setItem(OFFLINE_SNAPSHOT_KEY, '{bad');
    expect(readOfflineSnapshot()).toBeNull();
  });
});
