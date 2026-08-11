export type LearningEventType = 'login' | 'lesson' | 'pronunciation' | 'reward';

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  occurredAt: string;
  correct: number;
  total: number;
  xp: number;
  gold: number;
  hskLevel?: string;
  weakItems?: string[];
  toneScore?: number;
}

export interface Sm2State {
  easiness: number;
  repetitions: number;
  intervalDays: number;
}

export interface PlacementAnswer {
  hskLevel: number;
  word: string;
  correct: boolean;
}

export interface PlacementResult {
  level: number;
  score: number;
  weakHskLevels: number[];
  weakWords: string[];
  completedAt: string;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalQuestions: number;
  accuracy: number;
  earnedXp: number;
  earnedGold: number;
  studyDays: number;
  currentStreak: number;
  weakItems: { label: string; count: number }[];
  masteryByHsk: { level: string; accuracy: number; attempts: number }[];
  dailyActivity: { date: string; sessions: number; accuracy: number }[];
}

export function calculateSm2(state: Sm2State, quality: number): Sm2State {
  const boundedQuality = Math.max(0, Math.min(5, quality));
  let { easiness, repetitions, intervalDays } = state;

  if (boundedQuality >= 3) {
    intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(intervalDays * easiness);
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easiness += 0.1 - (5 - boundedQuality) * (0.08 + (5 - boundedQuality) * 0.02);
  return { easiness: Math.max(1.3, easiness), repetitions, intervalDays };
}

export function evaluatePlacement(answers: PlacementAnswer[], now = new Date()): PlacementResult {
  const score = answers.length === 0 ? 0 : Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100);
  const grouped = new Map<number, PlacementAnswer[]>();
  answers.forEach((answer) => grouped.set(answer.hskLevel, [...(grouped.get(answer.hskLevel) ?? []), answer]));

  let level = 1;
  for (let candidate = 1; candidate <= 6; candidate += 1) {
    const items = grouped.get(candidate) ?? [];
    if (items.length === 0 || items.filter((item) => item.correct).length / items.length < 0.6) break;
    level = candidate;
  }

  const weakHskLevels = [...grouped.entries()]
    .filter(([, items]) => items.some((item) => !item.correct))
    .map(([hskLevel]) => hskLevel);

  return {
    level,
    score,
    weakHskLevels,
    weakWords: answers.filter((answer) => !answer.correct).map((answer) => answer.word),
    completedAt: now.toISOString(),
  };
}

export function buildAnalytics(events: LearningEvent[], today = new Date()): AnalyticsSummary {
  const dateKey = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const learningEvents = events.filter((event) => event.type === 'lesson' || event.type === 'pronunciation');
  const totalQuestions = learningEvents.reduce((sum, event) => sum + event.total, 0);
  const totalCorrect = learningEvents.reduce((sum, event) => sum + event.correct, 0);
  const weakCounts = new Map<string, number>();
  const hskCounts = new Map<string, { correct: number; total: number }>();
  const daily = new Map<string, { sessions: number; correct: number; total: number }>();

  learningEvents.forEach((event) => {
    event.weakItems?.forEach((item) => weakCounts.set(item, (weakCounts.get(item) ?? 0) + 1));
    if (event.hskLevel) {
      const current = hskCounts.get(event.hskLevel) ?? { correct: 0, total: 0 };
      hskCounts.set(event.hskLevel, { correct: current.correct + event.correct, total: current.total + event.total });
    }
    const date = dateKey(event.occurredAt);
    const currentDay = daily.get(date) ?? { sessions: 0, correct: 0, total: 0 };
    daily.set(date, { sessions: currentDay.sessions + 1, correct: currentDay.correct + event.correct, total: currentDay.total + event.total });
  });

  const studyDates = [...daily.keys()].sort().reverse();
  let currentStreak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  while (studyDates.includes(dateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    totalSessions: learningEvents.length,
    totalQuestions,
    accuracy: totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100),
    earnedXp: events.reduce((sum, event) => sum + event.xp, 0),
    earnedGold: events.reduce((sum, event) => sum + event.gold, 0),
    studyDays: studyDates.length,
    currentStreak,
    weakItems: [...weakCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count })),
    masteryByHsk: [...hskCounts.entries()].sort().map(([levelName, value]) => ({
      level: levelName,
      accuracy: value.total === 0 ? 0 : Math.round((value.correct / value.total) * 100),
      attempts: value.total,
    })),
    dailyActivity: [...daily.entries()].sort().slice(-7).map(([date, value]) => ({
      date,
      sessions: value.sessions,
      accuracy: value.total === 0 ? 0 : Math.round((value.correct / value.total) * 100),
    })),
  };
}

export function getPersonalizedRecommendations(analytics: AnalyticsSummary): string[] {
  const recommendations: string[] = [];
  if (analytics.weakItems.length > 0) recommendations.push(`${analytics.weakItems[0].label} 항목을 오늘 우선 복습하세요.`);
  if (analytics.accuracy > 0 && analytics.accuracy < 70) recommendations.push('정답률이 70% 미만입니다. 한 단계 낮은 던전에서 복습하세요.');
  if (analytics.totalSessions === 0) recommendations.push('첫 학습 세션을 완료하면 취약점 분석이 시작됩니다.');
  return recommendations;
}
