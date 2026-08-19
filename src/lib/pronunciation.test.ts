import { describe, expect, it } from 'vitest';
import { evaluatePronunciation, normalizeSpeechText } from './pronunciation';

describe('pronunciation transcript evaluation', () => {
  it('ignores spaces and punctuation', () => {
    expect(normalizeSpeechText('我们两个人，想要火锅。')).toBe('我们两个人想要火锅');
  });

  it('gives an exact recognized sentence a perfect score', () => {
    const result = evaluatePronunciation('我们两个人，想要一个麻辣火锅。', '我们两个人想要一个麻辣火锅', ['我们', '麻辣', '火锅']);
    expect(result.score).toBe(100);
    expect(result.wordScores.every((item) => item.status === 'ok')).toBe(true);
  });

  it('lowers the score and identifies a missing keyword', () => {
    const result = evaluatePronunciation('我们两个人，想要一个麻辣火锅。', '我们两个人想要一个火锅', ['我们', '麻辣', '火锅']);
    expect(result.score).toBeLessThan(100);
    expect(result.wordScores.find((item) => item.word === '麻辣')?.status).toBe('bad');
  });

  it('reports an extra mistyped character instead of calling every target character correct', () => {
    const result = evaluatePronunciation('我们两个人，想要一个麻辣火锅。', '我们两个人，想过要一个麻辣火锅。', ['我们', '想要', '麻辣', '火锅']);

    expect(result.score).toBe(93);
    expect(result.corrections).toEqual([{ type: 'extra', actual: '过' }]);
    expect(result.wordScores.find((item) => item.word === '想要')?.status).toBe('bad');
  });

  it('distinguishes replaced and missing characters', () => {
    const replaced = evaluatePronunciation('谢谢', '谢射', ['谢谢']);
    const missing = evaluatePronunciation('谢谢', '谢', ['谢谢']);

    expect(replaced.corrections).toEqual([{ type: 'replace', expected: '谢', actual: '射' }]);
    expect(missing.corrections).toEqual([{ type: 'missing', expected: '谢' }]);
  });

  it('returns zero when no speech was recognized', () => {
    expect(evaluatePronunciation('谢谢', '', ['谢谢']).score).toBe(0);
  });
});
