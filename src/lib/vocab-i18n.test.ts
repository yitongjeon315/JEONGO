import { describe, expect, it } from 'vitest';
import { getLocalizedMeaning, getStudyFilterCounts, matchesStudyFilter } from './vocab-i18n';

const word = { hanzi: '我', pinyin: 'wǒ', meaning: 'I, me, my', isLearned: false };

describe('vocabulary localization and filters', () => {
  it('uses Korean by default-ready lookup and switches to English', () => {
    expect(getLocalizedMeaning(word, 'ko')).toEqual({ text: '나', isFallback: false });
    expect(getLocalizedMeaning(word, 'en').text).toMatch(/I|me/);
  });

  it('separates learned and unlearned words exactly', () => {
    const words = [{ isLearned: true }, { isLearned: false }, { isLearned: false }];
    expect(getStudyFilterCounts(words)).toEqual({ all: 3, learned: 1, unlearned: 2 });
    expect(words.filter((item) => matchesStudyFilter(item, 'all'))).toHaveLength(3);
    expect(words.filter((item) => matchesStudyFilter(item, 'learned'))).toHaveLength(1);
    expect(words.filter((item) => matchesStudyFilter(item, 'unlearned'))).toHaveLength(2);
  });
});
