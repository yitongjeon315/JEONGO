import { describe, expect, it } from 'vitest';
import {
  getAttackDamage,
  getDungeonMaxHp,
  getGrowthTier,
  previewStats,
  totalAllocatedPoints,
} from './character-growth';

describe('character growth tiers', () => {
  it('unlocks titles at the configured level milestones', () => {
    expect(getGrowthTier(4).title).toBe('초보 모험가');
    expect(getGrowthTier(5)).toMatchObject({ title: '숙련 모험가', nextLevel: 10 });
    expect(getGrowthTier(30)).toMatchObject({ title: 'HSK 정복자', nextLevel: null });
  });
});

describe('combat growth', () => {
  it('adds one damage for every strength point and ten for a critical', () => {
    expect(getAttackDamage(16, 'vocab')).toBe(26);
    expect(getAttackDamage(17, 'vocab')).toBe(27);
    expect(getAttackDamage(17, 'vocab', true)).toBe(37);
    expect(getAttackDamage(17, 'writing')).toBe(32);
  });

  it('sizes monster hp for all questions and expected three-answer criticals', () => {
    expect(getDungeonMaxHp('vocab', 4, 20)).toBe(130);
  });
});

describe('growth simulation', () => {
  it('previews allocations without mutating current stats', () => {
    const stats = { str: 18, dex: 12, int: 14, vit: 20 };
    const allocation = { str: 2, dex: 1, int: 0, vit: 0 };
    expect(totalAllocatedPoints(allocation)).toBe(3);
    expect(previewStats(stats, allocation)).toEqual({ str: 20, dex: 13, int: 14, vit: 20 });
    expect(stats.str).toBe(18);
  });
});
