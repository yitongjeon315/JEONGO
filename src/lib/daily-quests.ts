import type { LearningEvent } from './learning';

export type DailyQuestActivity = 'questions' | 'dungeon' | 'pronunciation';

export interface DailyQuest {
  id: string;
  activity: DailyQuestActivity;
  title: string;
  desc: string;
  target: number;
  current: number;
  claimed: boolean;
  gold: number;
  xp: number;
}

export interface DailyQuestState {
  cycleKey: string;
  quests: DailyQuest[];
}

export const DAILY_QUESTS_STORAGE_KEY = 'jeongo_daily_quests_v2';

const DAILY_QUEST_DEFINITIONS: Array<Omit<DailyQuest, 'current' | 'claimed'>> = [
  {
    id: 'daily-questions',
    activity: 'questions',
    title: '단어 10개 풀기',
    desc: '던전에서 단어 또는 문장 문제를 10개 푸세요.',
    target: 10,
    gold: 100,
    xp: 30,
  },
  {
    id: 'daily-dungeon',
    activity: 'dungeon',
    title: '던전 1회 완료',
    desc: '어휘 던전 전투를 끝까지 완료하세요.',
    target: 1,
    gold: 150,
    xp: 50,
  },
  {
    id: 'daily-pronunciation',
    activity: 'pronunciation',
    title: '성조 마스터',
    desc: 'AI 튜터에게 80점 이상의 발음 판정을 받으세요.',
    target: 1,
    gold: 200,
    xp: 50,
  },
];

export function getDailyQuestCycleKey(now = new Date()): string {
  const shifted = new Date(now);
  shifted.setHours(shifted.getHours() - 6);
  return [
    shifted.getFullYear(),
    String(shifted.getMonth() + 1).padStart(2, '0'),
    String(shifted.getDate()).padStart(2, '0'),
  ].join('-');
}

export function createDailyQuestState(now = new Date()): DailyQuestState {
  return {
    cycleKey: getDailyQuestCycleKey(now),
    quests: DAILY_QUEST_DEFINITIONS.map((quest) => ({ ...quest, current: 0, claimed: false })),
  };
}

export function refreshDailyQuestState(state: DailyQuestState, now = new Date()): DailyQuestState {
  return state.cycleKey === getDailyQuestCycleKey(now) ? state : createDailyQuestState(now);
}

export function restoreDailyQuestState(raw: string | null, now = new Date()): DailyQuestState {
  if (!raw) return createDailyQuestState(now);

  try {
    const parsed = JSON.parse(raw) as Partial<DailyQuestState>;
    if (!parsed.cycleKey || !Array.isArray(parsed.quests)) return createDailyQuestState(now);

    const savedById = new Map(parsed.quests.map((quest) => [quest.id, quest]));
    const restored: DailyQuestState = {
      cycleKey: parsed.cycleKey,
      quests: DAILY_QUEST_DEFINITIONS.map((definition) => {
        const saved = savedById.get(definition.id);
        return {
          ...definition,
          current: Math.min(definition.target, Math.max(0, saved?.current ?? 0)),
          claimed: Boolean(saved?.claimed),
        };
      }),
    };

    return refreshDailyQuestState(restored, now);
  } catch {
    return createDailyQuestState(now);
  }
}

export function applyLearningEventToDailyQuests(
  state: DailyQuestState,
  event: Pick<LearningEvent, 'type' | 'total' | 'toneScore'>,
  now = new Date(),
): DailyQuestState {
  const currentState = refreshDailyQuestState(state, now);

  const increments: Partial<Record<DailyQuestActivity, number>> = {};
  if (event.type === 'lesson') {
    increments.questions = Math.max(0, event.total);
    increments.dungeon = 1;
  }
  if (event.type === 'pronunciation' && (event.toneScore ?? 0) >= 80) {
    increments.pronunciation = 1;
  }

  if (Object.keys(increments).length === 0) return currentState;

  return {
    ...currentState,
    quests: currentState.quests.map((quest) => ({
      ...quest,
      current: Math.min(quest.target, quest.current + (increments[quest.activity] ?? 0)),
    })),
  };
}
