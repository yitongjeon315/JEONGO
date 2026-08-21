// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  getConnection: vi.fn(),
}));

vi.mock('@/lib/server/session', () => ({ getCurrentUser: mocks.currentUser }));
vi.mock('@/lib/server/db', () => ({
  getDb: () => ({ getConnection: mocks.getConnection }),
}));

import { enforceAiAccess } from './ai-access';

describe('AI access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConnection.mockResolvedValue({
      execute: mocks.execute,
      beginTransaction: mocks.beginTransaction,
      commit: mocks.commit,
      rollback: mocks.rollback,
      release: mocks.release,
    });
  });

  it('requires an authenticated member', async () => {
    mocks.currentUser.mockResolvedValue(null);
    const response = await enforceAiAccess('tutor');
    expect(response?.status).toBe(401);
    expect(mocks.getConnection).not.toHaveBeenCalled();
  });

  it('records an allowed request atomically', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'user-1', email: 'one@example.com', name: '첫째', role: 'learner' });
    mocks.execute
      .mockResolvedValueOnce([[], { affectedRows: 0 }])
      .mockResolvedValueOnce([[{ count: 29, oldestAt: '2026-08-21T15:00:00.000Z' }], undefined])
      .mockResolvedValueOnce([[], { affectedRows: 1 }]);

    expect(await enforceAiAccess('tutor')).toBeNull();
    expect(mocks.commit).toHaveBeenCalledOnce();
    expect(mocks.execute.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO ai_rate_limit_events'))).toBe(true);
  });

  it('returns 429 without recording a request when the limit is reached', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'user-1', email: 'one@example.com', name: '첫째', role: 'learner' });
    mocks.execute
      .mockResolvedValueOnce([[], { affectedRows: 0 }])
      .mockResolvedValueOnce([[{ count: 30, oldestAt: new Date().toISOString() }], undefined]);

    const response = await enforceAiAccess('tutor');
    expect(response?.status).toBe(429);
    expect(Number(response?.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(mocks.rollback).toHaveBeenCalledOnce();
    expect(mocks.execute.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO ai_rate_limit_events'))).toBe(false);
  });
});
