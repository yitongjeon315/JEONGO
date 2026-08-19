export const OFFLINE_SNAPSHOT_KEY = 'jeongo_offline_account_snapshot';

export function queueOfflineSnapshot(snapshot: unknown) {
  window.localStorage.setItem(OFFLINE_SNAPSHOT_KEY, JSON.stringify({ snapshot, queuedAt: new Date().toISOString() }));
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then((registration) => {
      const backgroundSync = (registration as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      }).sync;
      return backgroundSync?.register('jeongo-account-sync');
    }).catch(() => undefined);
  }
}

export function readOfflineSnapshot(): { snapshot: unknown; queuedAt: string } | null {
  const raw = window.localStorage.getItem(OFFLINE_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { snapshot?: unknown; queuedAt?: unknown };
    if (!parsed.snapshot || typeof parsed.queuedAt !== 'string') throw new Error('INVALID_QUEUE');
    return { snapshot: parsed.snapshot, queuedAt: parsed.queuedAt };
  } catch {
    window.localStorage.removeItem(OFFLINE_SNAPSHOT_KEY);
    return null;
  }
}

export function clearOfflineSnapshot() {
  window.localStorage.removeItem(OFFLINE_SNAPSHOT_KEY);
}
