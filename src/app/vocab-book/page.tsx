'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Search, BookOpen, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw, Calendar, Award, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getLocalizedMeaning,
  getStudyFilterCounts,
  matchesStudyFilter,
  MEANING_LANGUAGE_OPTIONS,
  type MeaningLanguage,
  type StudyFilter,
} from '@/lib/vocab-i18n';

export default function VocabBookPage() {
  const [renderedAt] = useState(() => Date.now());
  const router = useRouter();
  const { vocabList, resetSrsWord, toggleLearnWord } = useApp();
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHsk, setSelectedHsk] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6'>('all');
  const [studyFilter, setStudyFilter] = useState<StudyFilter>('all');
  const [meaningLanguage, setMeaningLanguage] = useState<MeaningLanguage>('ko');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  
  // Expanded cards state tracking
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);
  const [generatedMeanings, setGeneratedMeanings] = useState<Record<string, string>>({});
  const [translationStatus, setTranslationStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const updatePageSize = () => {
      const { innerHeight: height, innerWidth: width } = window;
      if (width >= 1024) {
        setItemsPerPage(height < 720 ? 4 : height < 900 ? 8 : 10);
      } else if (width >= 768) {
        setItemsPerPage(height < 720 ? 3 : height < 900 ? 5 : 6);
      } else {
        setItemsPerPage(height < 620 ? 2 : height < 780 ? 3 : 4);
      }
    };
    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  const requestTranslation = async (word: typeof vocabList[number], language: MeaningLanguage) => {
    const key = `${word.id}-${language}`;
    setTranslationStatus((current) => ({ ...current, [key]: '번역 중…' }));
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hanzi: word.hanzi, pinyin: word.pinyin, sourceMeaning: word.meaning, language }),
      });
      const body = (await response.json()) as { translation?: string; error?: string };
      if (!response.ok || !body.translation) throw new Error(body.error ?? '번역 실패');
      setGeneratedMeanings((current) => ({ ...current, [key]: body.translation! }));
      setTranslationStatus((current) => ({ ...current, [key]: '' }));
    } catch (error) {
      setTranslationStatus((current) => ({ ...current, [key]: error instanceof Error ? error.message : '번역 실패' }));
    }
  };

  // Filter vocabulary list
  const filteredVocabList = vocabList.filter(word => {
    const koreanMeaning = getLocalizedMeaning(word, 'ko').text;
    const englishMeaning = getLocalizedMeaning(word, 'en').text;
    const matchesSearch = 
      word.hanzi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      koreanMeaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      englishMeaning.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesHsk = selectedHsk === 'all' || word.hsk === selectedHsk;
    
    return matchesSearch && matchesHsk && matchesStudyFilter(word, studyFilter);
  });

  const studyCounts = getStudyFilterCounts(vocabList);

  const totalPages = Math.max(1, Math.ceil(filteredVocabList.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedVocabList = filteredVocabList.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const changePage = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
    setExpandedWordId(null);
  };

  const toggleExpand = (id: number) => {
    setExpandedWordId(prev => (prev === id ? null : id));
  };

  const handleResetSrs = (wordId: number) => {
    resetSrsWord(wordId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-hidden" data-testid="vocab-book-page">
      {/* Header Back Bar */}
      <div className="flex items-center gap-2.5 py-0.5">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-all hover:bg-white/10 hover:text-white"
          aria-label="이전 화면"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 text-sm font-extrabold text-white min-[480px]:text-base">
            <BookOpen size={17} className="shrink-0 text-neon-cyan" />
            어휘북 및 도감 관리
          </h1>
          <p className="hidden text-[10px] font-medium text-gray-400 min-[480px]:block">HSK 레벨별 공식 어휘와 복습 상태를 확인합니다.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setExpandedWordId(null); }}
          placeholder="한자, 병음, 한국어·영어 뜻 검색..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 transition-all focus:border-neon-cyan/50 focus:bg-white/10 focus:outline-none"
        />
      </div>

      {/* Compact HSK and language toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-0.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 p-1" aria-label="HSK 급수">
          {([
            { id: 'all', label: '전체', compactLabel: '전체' },
            { id: 'HSK 1', label: 'HSK 1', compactLabel: '1' },
            { id: 'HSK 2', label: 'HSK 2', compactLabel: '2' },
            { id: 'HSK 3', label: 'HSK 3', compactLabel: '3' },
            { id: 'HSK 4', label: 'HSK 4', compactLabel: '4' },
            { id: 'HSK 5', label: 'HSK 5', compactLabel: '5' },
            { id: 'HSK 6', label: 'HSK 6', compactLabel: '6' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              aria-label={tab.label}
              onClick={() => { setSelectedHsk(tab.id); setCurrentPage(1); setExpandedWordId(null); }}
              className={`min-w-0 flex-1 rounded-lg border px-0.5 py-1.5 text-[10px] font-bold transition-all ${
                selectedHsk === tab.id
                  ? 'border-neon-cyan/30 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="min-[480px]:hidden">{tab.compactLabel}</span>
              <span className="hidden min-[480px]:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="grid w-[92px] shrink-0 grid-cols-2 gap-0.5 rounded-xl border border-white/10 bg-white/5 p-1" aria-label="단어 뜻 언어">
          {MEANING_LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language.id}
              type="button"
              data-testid={`meaning-language-${language.id}`}
              onClick={() => setMeaningLanguage(language.id)}
              aria-pressed={meaningLanguage === language.id}
              aria-label={`${language.label} 뜻`}
              title={`${language.label} 뜻`}
              className={`h-7 min-w-0 rounded-lg px-1 text-[10px] font-bold transition-colors ${
                meaningLanguage === language.id ? 'bg-neon-cyan text-dark-bg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {language.id === 'ko' ? '한' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* Study State Filter Selector */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
        {([
          { id: 'all', label: '전체 보기', count: studyCounts.all },
          { id: 'learned', label: '학습 중', count: studyCounts.learned },
          { id: 'unlearned', label: '미학습', count: studyCounts.unlearned }
        ] as const).map((chip) => (
          <button
            key={chip.id}
            data-testid={`study-filter-${chip.id}`}
            onClick={() => { setStudyFilter(chip.id); setCurrentPage(1); setExpandedWordId(null); }}
            aria-pressed={studyFilter === chip.id}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
              studyFilter === chip.id
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {chip.label} <span className="opacity-70">({chip.count})</span>
          </button>
        ))}
      </div>

      {/* Word Count Indicator */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-1 text-xs font-semibold text-gray-400">
        <span data-testid="filtered-vocab-count">총 {filteredVocabList.length}개의 단어</span>
        <nav aria-label="어휘 페이지" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changePage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 disabled:opacity-25"
            aria-label="이전 페이지"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="min-w-[72px] text-center">{safeCurrentPage} / {totalPages}</span>
          <button
            type="button"
            onClick={() => changePage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 disabled:opacity-25"
            aria-label="다음 페이지"
          >
            <ChevronRight size={15} />
          </button>
        </nav>
      </div>

      {/* Vocabulary Cards List */}
      <div className={`grid min-h-0 flex-1 content-start grid-cols-1 items-start gap-2.5 pr-0.5 lg:grid-cols-2 ${expandedWordId === null ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`} data-vocab-list data-items-per-page={itemsPerPage}>
        {filteredVocabList.length > 0 ? (
          paginatedVocabList.map((word) => {
            const isExpanded = expandedWordId === word.id;
            const localizedMeaning = getLocalizedMeaning(word, meaningLanguage);
            const translationKey = `${word.id}-${meaningLanguage}`;
            const displayedMeaning = generatedMeanings[translationKey] ?? localizedMeaning.text;
            
            // Check SRS review ready status (nextReviewAt is in the past)
            const isReviewReady = new Date(word.nextReviewAt).getTime() <= renderedAt;
            const hasLearned = word.isLearned;
            
            return (
              <div
                key={word.id}
                data-testid="vocab-card"
                className={`glass-panel border rounded-2xl overflow-hidden transition-all ${
                  isExpanded ? 'border-neon-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-white/10'
                }`}
              >
                {/* Word Summary View */}
                <div
                  onClick={() => toggleExpand(word.id)}
                  className="flex cursor-pointer items-center justify-between p-3 transition-all hover:bg-white/5 min-[480px]:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    {/* Pinyin directly above Chinese characters */}
                    <div className="flex min-w-[82px] flex-col items-start">
                      <div className="text-[10px] sm:text-xs font-bold text-neon-cyan leading-tight" data-testid="vocab-pinyin">{word.pinyin}</div>
                      <div lang="zh-CN" className="font-hanzi text-xl sm:text-2xl font-semibold text-white tracking-wide leading-tight mt-1" data-testid="vocab-hanzi">
                        {word.hanzi}
                      </div>
                    </div>
                    {/* Localized meaning */}
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="text-xs sm:text-sm text-white/90 font-medium break-words" data-testid="vocab-meaning">{displayedMeaning}</div>
                      {localizedMeaning.isFallback && !generatedMeanings[translationKey] && (
                        <button type="button" onClick={(event) => { event.stopPropagation(); void requestTranslation(word, meaningLanguage); }} className="text-left text-[9px] text-cyber-yellow hover:underline">
                          {translationStatus[translationKey] || 'AI 번역 요청 · 현재 원문 표시'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badges & Bookmark & Expanding Arrow */}
                  <div className="flex items-center gap-2">
                    {/* Toggle Bookmark / Learn State */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLearnWord(word.id);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                        word.isLearned
                          ? 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                      }`}
                      title={word.isLearned ? '학습 목록에서 제외' : '학습 목록에 추가'}
                    >
                      <Bookmark size={14} className={word.isLearned ? 'fill-neon-cyan' : ''} />
                    </button>

                    <div className="flex flex-col gap-1 items-end min-w-[52px]">
                      <span className="text-[9px] font-extrabold bg-white/10 px-1.5 py-0.5 rounded-full border border-white/5 text-gray-300">
                        {word.hsk}
                      </span>
                      {word.isLearned ? (
                        word.repetitions > 0 ? (
                          isReviewReady ? (
                            <span className="text-[9px] font-extrabold bg-neon-rose/20 text-neon-rose border border-neon-rose/30 px-1.5 py-0.5 rounded-full glow-rose animate-pulse">
                              복습 대기
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold bg-neon-green/20 text-neon-green border border-neon-green/30 px-1.5 py-0.5 rounded-full">
                              기억됨
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] font-extrabold bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 px-1.5 py-0.5 rounded-full">
                            학습중
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] font-extrabold bg-white/5 text-gray-500 border border-white/5 px-1.5 py-0.5 rounded-full">
                          미학습
                        </span>
                      )}
                    </div>

                    <div className="text-gray-400 pl-1">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details View */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-white/5 border-t border-white/5"
                    >
                      <div className="p-4 flex flex-col gap-3 text-xs">
                        {/* Word Metadata */}
                        <div className="flex gap-2">
                          <span className="text-[9px] font-extrabold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20 px-2 py-0.5 rounded-md">
                            품사: {word.partOfSpeech || '명사'}
                          </span>
                        </div>

                        {/* Example Sentences */}
                        {word.exampleHanzi && (
                          <div className="bg-dark-bg/40 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400">학습 예문</span>
                            <span className="text-xs font-semibold text-white tracking-wide mt-0.5">{word.exampleHanzi}</span>
                            <span className="text-[10px] text-neon-cyan">{word.examplePinyin}</span>
                            {meaningLanguage === 'ko' && <span className="text-[11px] text-gray-300 font-medium">{word.exampleMeaning}</span>}
                          </div>
                        )}

                        {/* SRS stats */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/5 border border-white/5 rounded-xl p-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-400 font-medium flex items-center gap-1">
                              <RefreshCw size={10} /> 누적 정답 횟수:
                            </span>
                            <span className="text-white font-bold text-xs">{word.repetitions}회</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-400 font-medium flex items-center gap-1">
                              <Calendar size={10} /> 다음 복습 간격:
                            </span>
                            <span className="text-white font-bold text-xs">
                              {word.intervalDays > 0 ? `${word.intervalDays}일` : '즉시'}
                            </span>
                          </div>
                          <div className="col-span-2 mt-1 pt-2 border-t border-white/5 flex flex-col gap-1">
                            <span className="text-gray-400 font-medium">다음 복습 예정 시각:</span>
                            <span className="text-gray-300 font-semibold">
                              {hasLearned 
                                ? new Date(word.nextReviewAt).toLocaleString('ko-KR')
                                : '학습 시작 안 됨'
                              }
                            </span>
                          </div>
                        </div>

                        {/* Force Reset Button */}
                        <button
                          onClick={() => handleResetSrs(word.id)}
                          className="w-full py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <RefreshCw size={12} className="animate-spin-slow" />
                          이 단어 복습 주기 초기화 (다시 학습하기)
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="glass-panel border border-white/10 rounded-2xl p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <Award size={36} className="text-gray-600 animate-pulse" />
            <div className="text-xs font-bold text-white">검색된 단어가 없습니다</div>
            <p className="text-[10px]">다른 검색어를 입력하시거나 HSK 필터 칩을 확인해 보세요.</p>
          </div>
        )}
      </div>

    </div>
  );
}
