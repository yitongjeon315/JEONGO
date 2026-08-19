import { describe, expect, it } from 'vitest';
import { getLocalizedMeaning, getStudyFilterCounts, matchesStudyFilter } from './vocab-i18n';
import officialVocabulary from '@/data/hsk_official_ko.json';

const word = { hanzi: '我', pinyin: 'wǒ', meaning: 'I, me, my', isLearned: false };

describe('vocabulary localization and filters', () => {
  it('ships the complete official HSK 2.0 vocabulary with Korean meanings and pinyin', () => {
    const counts = Object.fromEntries(
      [...officialVocabulary.reduce((grouped, item) => {
        grouped.set(item.hsk, (grouped.get(item.hsk) ?? 0) + 1);
        return grouped;
      }, new Map<string, number>())],
    );
    expect(counts).toEqual({ 'HSK 1': 150, 'HSK 2': 150, 'HSK 3': 300, 'HSK 4': 600, 'HSK 5': 1300, 'HSK 6': 2500 });
    expect(officialVocabulary).toHaveLength(5000);
    expect(officialVocabulary.every((item) => item.pinyin.trim() && /[가-힣]/.test(item.meaning))).toBe(true);
  });

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
