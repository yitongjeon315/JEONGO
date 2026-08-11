import englishVocabulary from '@/data/hsk_1to6.json';
import koreanVocabulary from '@/data/hsk_vocabulary.json';

export type MeaningLanguage = 'ko' | 'en';
export type StudyFilter = 'all' | 'learned' | 'unlearned';

interface VocabularyMeaningSource {
  hanzi: string;
  pinyin?: string;
  meaning: string;
}

interface LocalizableWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
  isLearned: boolean;
}

export const MEANING_LANGUAGE_OPTIONS: ReadonlyArray<{ id: MeaningLanguage; label: string }> = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
];

const normalizePinyin = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();
const lookupKey = (item: Pick<VocabularyMeaningSource, 'hanzi' | 'pinyin'>) => `${item.hanzi}|${normalizePinyin(item.pinyin)}`;
const containsKorean = (value: string) => /[가-힣]/.test(value);

function createLookups(source: VocabularyMeaningSource[], language: MeaningLanguage) {
  const exact = new Map<string, string>();
  const byHanzi = new Map<string, string>();
  source.forEach((item) => {
    const matchesLanguage = language === 'ko' ? containsKorean(item.meaning) : !containsKorean(item.meaning);
    if (!matchesLanguage) return;
    if (!exact.has(lookupKey(item))) exact.set(lookupKey(item), item.meaning);
    if (!byHanzi.has(item.hanzi)) byHanzi.set(item.hanzi, item.meaning);
  });
  return { exact, byHanzi };
}

const koreanLookups = createLookups(koreanVocabulary as VocabularyMeaningSource[], 'ko');
const englishLookups = createLookups(englishVocabulary as VocabularyMeaningSource[], 'en');

const CURATED_ENGLISH_MEANINGS: Readonly<Record<string, string>> = {
  我: 'I, me', 你: 'you', 他: 'he, him', 她: 'she, her', 我们: 'we, us', 人: 'person, people',
  家: 'home, family', 学校: 'school', 餐馆: 'restaurant', 中国: 'China', 北京: 'Beijing', 汉语: 'Chinese language',
  苹果: 'apple', 茶: 'tea', 水: 'water', 米饭: 'cooked rice', 电脑: 'computer', 手机: 'mobile phone',
  谢谢: 'thank you', 再见: 'goodbye, see you again', 准备: 'to prepare', 上班: 'to go to work',
  懂: 'to understand', 帮助: 'to help, assistance', 旅游: 'to travel', 跑步: 'to run, jog',
  唱歌: 'to sing', 跳舞: 'to dance', 便宜: 'cheap, inexpensive', 贵: 'expensive', 新: 'new',
  忙: 'busy', 累: 'tired', 生病: 'to get sick, be ill', 药: 'medicine', 身体: 'body, health',
  大家: 'everyone', 时间: 'time', 黑: 'black, dark', 晴: 'sunny, clear', 经常: 'often, frequently',
  努力: 'to work hard, effort', 必须: 'must, have to', 或者: 'or, either', 虽然: 'although',
  但是: 'but, however', 特别: 'special, especially', 环境: 'environment', 照顾: 'to take care of',
  觉得: 'to think, feel', 同意: 'to agree', 要求: 'to request, requirement', 简单: 'simple',
  难: 'difficult', 了解: 'to understand, learn about', 解决: 'to solve, resolve', 注意: 'to pay attention',
  相信: 'to believe, trust', 锻炼: 'to exercise, train',
};

export function getLocalizedMeaning(word: LocalizableWord, language: MeaningLanguage) {
  if (language === 'en' && CURATED_ENGLISH_MEANINGS[word.hanzi]) {
    return { text: CURATED_ENGLISH_MEANINGS[word.hanzi], isFallback: false };
  }
  const lookups = language === 'ko' ? koreanLookups : englishLookups;
  const translated = lookups.exact.get(lookupKey(word)) ?? lookups.byHanzi.get(word.hanzi);
  if (translated) return { text: translated, isFallback: false };

  const meaningMatchesLanguage = language === 'ko' ? containsKorean(word.meaning) : !containsKorean(word.meaning);
  return { text: word.meaning, isFallback: !meaningMatchesLanguage };
}

export function matchesStudyFilter(word: Pick<LocalizableWord, 'isLearned'>, filter: StudyFilter) {
  if (filter === 'learned') return word.isLearned;
  if (filter === 'unlearned') return !word.isLearned;
  return true;
}

export function getStudyFilterCounts(words: Array<Pick<LocalizableWord, 'isLearned'>>) {
  const learned = words.filter((word) => word.isLearned).length;
  return { all: words.length, learned, unlearned: words.length - learned };
}
