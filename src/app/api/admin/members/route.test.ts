// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  dbExecute: vi.fn(),
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}));

vi.mock('@/lib/server/session', () => ({ getCurrentUser: mocks.currentUser }));
vi.mock('@/lib/server/db', () => ({
  getDb: () => ({
    execute: mocks.dbExecute,
    getConnection: async () => ({
      execute: mocks.execute,
      beginTransaction: mocks.beginTransaction,
      commit: mocks.commit,
      rollback: mocks.rollback,
      release: mocks.release,
    }),
  }),
}));

import { GET, PATCH } from './route';

describe('admin member management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects member listings from a learner', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'learner-1', email: 'learner@example.com', name: '학습자', role: 'learner' });
    const response = await GET(new Request('https://www.aina365.com/api/admin/members'));
    expect(response.status).toBe(403);
    expect(mocks.dbExecute).not.toHaveBeenCalled();
  });

  it('returns a no-store member summary to an administrator', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: '관리자', role: 'admin' });
    mocks.dbExecute
      .mockResolvedValueOnce([[{ total: 2, admins: 1, learners: 1, activeSessions: 1, joinedLast7Days: 1 }], undefined])
      .mockResolvedValueOnce([[{ total: 2 }], undefined])
      .mockResolvedValueOnce([[
        { id: 'admin-1', email: 'admin@example.com', name: '관리자', role: 'admin', createdAt: '2026-08-21T00:00:00Z', googleLinked: 1, gold: 100, xp: 20, level: 2, activeSessions: 1, lastSnapshotAt: null },
      ], undefined]);

    const response = await GET(new Request('https://www.aina365.com/api/admin/members?page=1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toMatchObject({
      summary: { total: 2, admins: 1 },
      members: [{ id: 'admin-1', googleLinked: true }],
      currentUserId: 'admin-1',
    });
  });

  it('prevents an administrator from changing their own role', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: '관리자', role: 'admin' });
    const response = await PATCH(new Request('https://www.aina365.com/api/admin/members', {
      method: 'PATCH',
      headers: { origin: 'https://www.aina365.com', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'set_role', userId: 'admin-1', role: 'learner' }),
    }));
    expect(response.status).toBe(400);
    expect(mocks.beginTransaction).not.toHaveBeenCalled();
  });

  it('changes another member role, revokes sessions, and writes an audit log', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: '관리자', role: 'admin' });
    mocks.execute
      .mockResolvedValueOnce([[{ id: 'learner-1', email: 'learner@example.com', name: '학습자', role: 'learner' }], undefined])
      .mockResolvedValueOnce([[], { affectedRows: 1 }])
      .mockResolvedValueOnce([[], { affectedRows: 2 }])
      .mockResolvedValueOnce([[], { affectedRows: 1 }]);

    const response = await PATCH(new Request('https://www.aina365.com/api/admin/members', {
      method: 'PATCH',
      headers: { origin: 'https://www.aina365.com', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'set_role', userId: 'learner-1', role: 'admin' }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ updated: true, role: 'admin' });
    expect(mocks.commit).toHaveBeenCalledOnce();
    expect(mocks.execute.mock.calls.some(([sql]) => String(sql).includes('admin_audit_logs'))).toBe(true);
  });
});
