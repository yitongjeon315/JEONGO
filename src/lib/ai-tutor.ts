export interface TutorHistoryMessage {
  sender: 'ai' | 'user';
  text: string;
}

export interface TutorReply {
  text: string;
  translation: string;
  source: 'openai' | 'fallback';
}

export function normalizeTutorHistory(value: unknown): TutorHistoryMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is TutorHistoryMessage => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Record<string, unknown>;
      return (candidate.sender === 'ai' || candidate.sender === 'user') &&
        typeof candidate.text === 'string' && candidate.text.trim().length > 0;
    })
    .slice(-12)
    .map((item) => ({ sender: item.sender, text: item.text.trim().slice(0, 500) }));
}

export function fallbackTutorReply(scenario: string, userText: string): TutorReply {
  const compact = userText.replace(/\s+/g, '').slice(0, 80);
  if (scenario.includes('식당')) {
    return {
      text: compact.includes('谢谢') || compact.includes('感谢')
        ? '不客气！今天的点餐练习完成得很好。'
        : '好的，我明白了。还需要别的吗？',
      translation: compact.includes('谢谢') || compact.includes('感谢')
        ? '천만에요! 오늘 주문 연습을 아주 잘 마쳤어요.'
        : '네, 알겠습니다. 더 필요한 것이 있나요?',
      source: 'fallback',
    };
  }
  return {
    text: compact.includes('一个星期')
      ? '好的，祝您旅行愉快。请问您住在哪里？'
      : '我明白了。请再告诉我一点。',
    translation: compact.includes('一个星期')
      ? '알겠습니다. 즐거운 여행 되세요. 어디에 머무르시나요?'
      : '알겠습니다. 조금 더 이야기해 주세요.',
    source: 'fallback',
  };
}

export function parseTutorReply(value: unknown): Omit<TutorReply, 'source'> | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.text !== 'string' || typeof candidate.translation !== 'string') return null;
  const text = candidate.text.trim().slice(0, 300);
  const translation = candidate.translation.trim().slice(0, 300);
  return text && translation ? { text, translation } : null;
}
