import { describe, expect, it } from 'vitest';
import { buildAnalytics, calculateSm2, evaluatePlacement } from './learning';

describe('calculateSm2', () => {
  it('advances correct reviews through one and six day intervals', () => {
    const first = calculateSm2({ easiness: 2.5, repetitions: 0, intervalDays: 0 }, 5);
    const second = calculateSm2(first, 5);
    expect(first).toMatchObject({ repetitions: 1, intervalDays: 1 });
    expect(second).toMatchObject({ repetitions: 2, intervalDays: 6 });
  });

  it('resets a failed review and never drops easiness below 1.3', () => {
    const result = calculateSm2({ easiness: 1.3, repetitions: 5, intervalDays: 30 }, 0);
    expect(result).toEqual({ easiness: 1.3, repetitions: 0, intervalDays: 1 });
  });
});

describe('evaluatePlacement', () => {
  it('selects the highest level with at least sixty percent accuracy and records weaknesses', () => {
    const result = evaluatePlacement([
      { hskLevel: 1, word: '你好', correct: true }, { hskLevel: 2, word: '因为', correct: true },
      { hskLevel: 3, word: '环境', correct: true }, { hskLevel: 4, word: '坚持', correct: false },
    ], new Date('2026-08-10T00:00:00.000Z'));
    expect(result.level).toBe(3);
    expect(result.weakWords).toEqual(['坚持']);
  });

  it('does not promote past a lower level that failed the sixty percent threshold', () => {
    const answers = [
      ...[true, true, true, false, false].map((correct, index) => ({ hskLevel: 1, word: `L1-${index}`, correct })),
      ...[true, true, false, false, false].map((correct, index) => ({ hskLevel: 2, word: `L2-${index}`, correct })),
      ...[true, true, true, true, true].map((correct, index) => ({ hskLevel: 3, word: `L3-${index}`, correct })),
    ];
    expect(evaluatePlacement(answers).level).toBe(1);
  });
});

describe('buildAnalytics', () => {
  it('aggregates accuracy, weak items, rewards, HSK mastery and streak', () => {
    const result = buildAnalytics([
      { id: '1', type: 'lesson', occurredAt: '2026-08-10T01:00:00.000Z', correct: 3, total: 4, xp: 40, gold: 20, hskLevel: 'HSK 2', weakItems: ['因为'] },
      { id: '2', type: 'pronunciation', occurredAt: '2026-08-09T01:00:00.000Z', correct: 1, total: 1, xp: 20, gold: 10, weakItems: [] },
    ], new Date('2026-08-10T12:00:00.000Z'));
    expect(result.accuracy).toBe(80);
    expect(result.currentStreak).toBe(2);
    expect(result.earnedGold).toBe(30);
    expect(result.weakItems[0]).toEqual({ label: '因为', count: 1 });
  });
});
