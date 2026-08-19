import { describe, expect, it } from 'vitest';
import { fallbackTutorReply, normalizeTutorHistory, parseTutorReply } from './ai-tutor';

describe('AI tutor helpers', () => {
  it('keeps only valid recent history', () => {
    const history = normalizeTutorHistory([
      { sender: 'user', text: ' 你好 ' },
      { sender: 'system', text: 'ignore' },
      null,
    ]);
    expect(history).toEqual([{ sender: 'user', text: '你好' }]);
  });

  it('returns a useful offline restaurant reply', () => {
    expect(fallbackTutorReply('식당 주문', '谢谢').text).toContain('不客气');
  });

  it('rejects malformed model output', () => {
    expect(parseTutorReply({ text: '好的' })).toBeNull();
    expect(parseTutorReply({ text: '好的', translation: '좋아요' })).toEqual({ text: '好的', translation: '좋아요' });
  });
});
