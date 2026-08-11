import { describe, expect, it } from 'vitest';
import {
  applyLearningEventToDailyQuests,
  createDailyQuestState,
  getDailyQuestCycleKey,
  refreshDailyQuestState,
  restoreDailyQuestState,
} from './daily-quests';

describe('daily quest cycle', () => {
  it('uses 6am as the start of a new daily cycle', () => {
    expect(getDailyQuestCycleKey(new Date(2026, 7, 11, 5, 59))).toBe('2026-08-10');
    expect(getDailyQuestCycleKey(new Date(2026, 7, 11, 6, 0))).toBe('2026-08-11');
  });

  it('resets progress and claimed rewards when the cycle changes', () => {
    const state = createDailyQuestState(new Date(2026, 7, 11, 6, 0));
    state.quests[0].current = 10;
    state.quests[0].claimed = true;

    const refreshed = refreshDailyQuestState(state, new Date(2026, 7, 12, 6, 0));
    expect(refreshed.quests[0]).toMatchObject({ current: 0, claimed: false });
  });
});

describe('daily quest progress', () => {
  it('counts solved questions and a completed dungeon from a lesson event', () => {
    const state = createDailyQuestState(new Date(2026, 7, 11, 12, 0));
    const updated = applyLearningEventToDailyQuests(state, { type: 'lesson', total: 4 });

    expect(updated.quests.find((quest) => quest.activity === 'questions')?.current).toBe(4);
    expect(updated.quests.find((quest) => quest.activity === 'dungeon')?.current).toBe(1);
  });

  it('only completes the pronunciation mission at a score of 80 or higher', () => {
    const state = createDailyQuestState(new Date(2026, 7, 11, 12, 0));
    const failed = applyLearningEventToDailyQuests(state, { type: 'pronunciation', total: 1, toneScore: 79 });
    const passed = applyLearningEventToDailyQuests(failed, { type: 'pronunciation', total: 1, toneScore: 80 });

    expect(failed.quests.find((quest) => quest.activity === 'pronunciation')?.current).toBe(0);
    expect(passed.quests.find((quest) => quest.activity === 'pronunciation')?.current).toBe(1);
  });

  it('recovers safely from invalid saved data', () => {
    expect(restoreDailyQuestState('not-json').quests).toHaveLength(3);
  });
});
