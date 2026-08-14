import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTENT_CATALOG, parseContentCatalog } from './content-catalog';

describe('content catalog validation', () => {
  it('accepts and normalizes a valid catalog', () => {
    const result = parseContentCatalog({
      words: [{ id: 10_000_001, hanzi: '学习', pinyin: 'xuéxí', meaning: '배우다', hsk: 'HSK 1' }],
      quests: [{ id: 'q-1', title: '단어 5개', desc: '', target: 5, gold: 10, xp: 20 }],
      rewards: DEFAULT_CONTENT_CATALOG.rewards,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.catalog.words[0]).toMatchObject({ hanzi: '学习', isLearned: false, easiness: 2.5 });
    }
  });

  it('rejects duplicate IDs', () => {
    const reward = DEFAULT_CONTENT_CATALOG.rewards[0];
    const result = parseContentCatalog({ words: [], quests: [], rewards: [reward, reward] });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid numeric ranges and HSK values', () => {
    const result = parseContentCatalog({
      words: [{ id: 1, hanzi: '学习', pinyin: '', meaning: '배우다', hsk: 'HSK 9' }],
      quests: [],
      rewards: [],
    });
    expect(result.ok).toBe(false);
  });
});
