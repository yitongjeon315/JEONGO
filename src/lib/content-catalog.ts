export interface VocabItem {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  meaningEn?: string;
  hsk: string;
  partOfSpeech?: string;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  isLearned: boolean;
  easiness: number;
  repetitions: number;
  intervalDays: number;
  nextReviewAt: string;
}

export interface ContentQuest {
  id: string;
  title: string;
  desc: string;
  target: number;
  gold: number;
  xp: number;
}

export interface ContentReward {
  id: string;
  name: string;
  image: string;
  cost: number;
  desc: string;
}

export interface ContentCatalog {
  words: VocabItem[];
  quests: ContentQuest[];
  rewards: ContentReward[];
}

export const DEFAULT_CONTENT_CATALOG: ContentCatalog = {
  words: [],
  quests: [],
  rewards: [
    { id: 'starbucks', name: '스타벅스 아이스 아메리카노 Tall', image: '☕', cost: 5000, desc: '학습 고행을 식혀줄 현실 커피 쿠폰.' },
    { id: 'naverpay', name: '네이버페이 포인트 1,000원권', image: '💳', cost: 1200, desc: '쇼핑에 사용할 수 있는 포인트.' },
    { id: 'gs25', name: 'GS25 모바일 상품권 3,000원권', image: '🏪', cost: 3300, desc: '편의점 모바일 상품권.' },
  ],
};

type ParseResult =
  | { ok: true; catalog: ContentCatalog }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : null;
};

const readInteger = (value: unknown, min: number, max: number) =>
  Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= max ? Number(value) : null;

export function parseContentCatalog(value: unknown): ParseResult {
  if (!isRecord(value) || !Array.isArray(value.words) || !Array.isArray(value.quests) || !Array.isArray(value.rewards)) {
    return { ok: false, error: '콘텐츠 목록 형식이 올바르지 않습니다.' };
  }
  if (value.words.length > 2000 || value.quests.length > 200 || value.rewards.length > 200) {
    return { ok: false, error: '한 번에 저장할 수 있는 콘텐츠 수를 초과했습니다.' };
  }

  const words: VocabItem[] = [];
  const wordIds = new Set<number>();
  for (const raw of value.words) {
    if (!isRecord(raw)) return { ok: false, error: '단어 형식이 올바르지 않습니다.' };
    const id = readInteger(raw.id, 10_000_000, Number.MAX_SAFE_INTEGER);
    const hanzi = readString(raw.hanzi, 64);
    const pinyin = readString(raw.pinyin, 128);
    const meaning = readString(raw.meaning, 500);
    const hsk = readString(raw.hsk, 10);
    if (id === null || !hanzi || pinyin === null || !meaning || !hsk || !/^HSK [1-6]$/.test(hsk) || wordIds.has(id)) {
      return { ok: false, error: '단어의 필수값, HSK 등급 또는 ID가 올바르지 않습니다.' };
    }
    wordIds.add(id);
    words.push({
      id,
      hanzi,
      pinyin,
      meaning,
      hsk,
      isLearned: false,
      easiness: 2.5,
      repetitions: 0,
      intervalDays: 0,
      nextReviewAt: new Date().toISOString(),
    });
  }

  const quests: ContentQuest[] = [];
  const questIds = new Set<string>();
  for (const raw of value.quests) {
    if (!isRecord(raw)) return { ok: false, error: '퀘스트 형식이 올바르지 않습니다.' };
    const id = readString(raw.id, 100);
    const title = readString(raw.title, 100);
    const desc = readString(raw.desc, 500);
    const target = readInteger(raw.target, 1, 100_000);
    const gold = readInteger(raw.gold, 0, 1_000_000);
    const xp = readInteger(raw.xp, 0, 1_000_000);
    if (!id || !title || desc === null || target === null || gold === null || xp === null || questIds.has(id)) {
      return { ok: false, error: '퀘스트 입력값 또는 ID가 올바르지 않습니다.' };
    }
    questIds.add(id);
    quests.push({ id, title, desc, target, gold, xp });
  }

  const rewards: ContentReward[] = [];
  const rewardIds = new Set<string>();
  for (const raw of value.rewards) {
    if (!isRecord(raw)) return { ok: false, error: '보상 형식이 올바르지 않습니다.' };
    const id = readString(raw.id, 100);
    const name = readString(raw.name, 120);
    const image = readString(raw.image, 255);
    const cost = readInteger(raw.cost, 0, 10_000_000);
    const desc = readString(raw.desc, 500);
    if (!id || !name || !image || cost === null || desc === null || rewardIds.has(id)) {
      return { ok: false, error: '보상 입력값 또는 ID가 올바르지 않습니다.' };
    }
    rewardIds.add(id);
    rewards.push({ id, name, image, cost, desc });
  }

  return { ok: true, catalog: { words, quests, rewards } };
}
