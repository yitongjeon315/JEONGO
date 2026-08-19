import { describe, expect, it } from 'vitest';
import { rankLeagueMembers } from './social';

describe('social league', () => {
  it('sorts members by weekly XP and assigns ranks', () => {
    const ranked = rankLeagueMembers([
      { name: '나', level: 2, xp: 20, isUser: true },
      { name: '친구', level: 3, xp: 50 },
      { name: '동료', level: 1, xp: 10 },
    ]);
    expect(ranked.map((item) => item.name)).toEqual(['친구', '나', '동료']);
    expect(ranked[1]).toMatchObject({ rank: 2, isUser: true, status: 'current' });
  });
});
