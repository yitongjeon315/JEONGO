// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('@/lib/server/session', () => ({ getCurrentUser: mocks.currentUser }));
vi.mock('@/lib/server/db', () => ({
  getDb: () => ({ execute: mocks.execute }),
}));

import { GET } from './route';

describe('social league rankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses server-validated learning events for weekly XP', async () => {
    mocks.currentUser.mockResolvedValue({ id: 'user-1', email: 'one@example.com', name: '첫째', role: 'learner' });
    mocks.execute
      .mockResolvedValueOnce([[
        { id: 'user-2', name: '둘째', level: 4, weeklyXp: 120 },
        { id: 'user-1', name: '첫째', level: 2, weeklyXp: 80 },
      ], undefined])
      .mockResolvedValueOnce([[], undefined])
      .mockResolvedValueOnce([[], undefined]);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      leagueMembers: [
        { name: '둘째', level: 4, xp: 120, rank: 1 },
        { name: '첫째', level: 2, xp: 80, rank: 2, isUser: true },
      ],
    });

    const rankingSql = String(mocks.execute.mock.calls[0]?.[0]);
    expect(rankingSql).toContain('processed_learning_events');
    expect(rankingSql).toContain('awarded_xp');
    expect(rankingSql).not.toContain('user_snapshots');
  });
});
