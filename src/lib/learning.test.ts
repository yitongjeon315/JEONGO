import { describe, expect, it } from 'vitest';
import { buildAnalytics, calculateSm2, classifyPlacementLevel, evaluatePlacement, prioritizeReviewQueue } from './learning';

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

describe('prioritizeReviewQueue', () => {
  it('places overdue learned words before future and new words', () => {
    const queue = prioritizeReviewQueue([
      { id: 1, isLearned: true, nextReviewAt: '2026-08-20T00:00:00.000Z', easiness: 2.5, repetitions: 1, intervalDays: 1 },
      { id: 2, isLearned: false, nextReviewAt: '2026-08-01T00:00:00.000Z', easiness: 2.5, repetitions: 0, intervalDays: 0 },
      { id: 3, isLearned: true, nextReviewAt: '2026-08-10T00:00:00.000Z', easiness: 2.5, repetitions: 2, intervalDays: 6 },
    ], new Date('2026-08-15T00:00:00.000Z'));
    expect(queue[0].id).toBe(3);
  });
});

describe('evaluatePlacement', () => {
  it('selects the highest continuously passed level using the seventy percent rule', () => {
    const result = evaluatePlacement([
      { hskLevel: 1, word: '你好', correct: true }, { hskLevel: 2, word: '因为', correct: true },
      { hskLevel: 3, word: '环境', correct: true }, { hskLevel: 4, word: '坚持', correct: false },
    ], new Date('2026-08-10T00:00:00.000Z'));
    expect(result.level).toBe(3);
    expect(result.weakWords).toEqual(['坚持']);
  });

  it('treats 55 to 69 percent as a boundary that needs extra questions', () => {
    const answers = [true, true, true, false, false].map((correct, index) => ({ hskLevel: 2, word: `L2-${index}`, correct }));
    expect(classifyPlacementLevel(answers)).toBe('borderline');
  });

  it('does not promote past a lower level that failed the seventy percent threshold', () => {
    const answers = [
      ...[true, true, true, false, false].map((correct, index) => ({ hskLevel: 1, word: `L1-${index}`, correct })),
      ...[true, true, false, false, false].map((correct, index) => ({ hskLevel: 2, word: `L2-${index}`, correct })),
      ...[true, true, true, true, true].map((correct, index) => ({ hskLevel: 3, word: `L3-${index}`, correct })),
    ];
    const result = evaluatePlacement(answers);
    expect(result.level).toBe(1);
    expect(result.weakHskLevels).toContain(1);
  });

  it('reports domain accuracy, question count, duration and confidence', () => {
    const result = evaluatePlacement([
      { hskLevel: 1, word: '你好', domain: 'vocabulary', correct: true, durationMs: 1000 },
      { hskLevel: 1, word: '谢谢', domain: 'listening', correct: false, durationMs: 3000 },
    ], new Date('2026-08-10T00:00:00.000Z'));
    expect(result.domainScores).toEqual([
      { domain: 'vocabulary', correct: 1, total: 1, accuracy: 100 },
      { domain: 'listening', correct: 0, total: 1, accuracy: 0 },
    ]);
    expect(result.totalQuestions).toBe(2);
    expect(result.averageDurationMs).toBe(2000);
    expect(result.confidence).toBeGreaterThanOrEqual(55);
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
