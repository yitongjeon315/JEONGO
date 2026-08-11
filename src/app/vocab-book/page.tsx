'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Search, BookOpen, ChevronDown, ChevronUp, RefreshCw, Calendar, Award, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getLocalizedMeaning,
  getStudyFilterCounts,
  matchesStudyFilter,
  MEANING_LANGUAGE_OPTIONS,
  type MeaningLanguage,
  type StudyFilter,
} from '@/lib/vocab-i18n';

const ITEMS_PER_PAGE = 12;

export default function VocabBookPage() {
  const [renderedAt] = useState(() => Date.now());
  const router = useRouter();
  const { vocabList, updateSrsWord, toggleLearnWord } = useApp();
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHsk, setSelectedHsk] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6'>('all');
  const [studyFilter, setStudyFilter] = useState<StudyFilter>('all');
  const [meaningLanguage, setMeaningLanguage] = useState<MeaningLanguage>('ko');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Expanded cards state tracking
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);

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

  const totalPages = Math.max(1, Math.ceil(filteredVocabList.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedVocabList = filteredVocabList.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );
  const visiblePageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 2);

  const changePage = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
    setExpandedWordId(null);
    requestAnimationFrame(() => document.querySelector('[data-vocab-list]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const toggleExpand = (id: number) => {
    setExpandedWordId(prev => (prev === id ? null : id));
  };

  const handleResetSrs = (wordId: number) => {
    // Resetting quality to 5 sets it back to good status
    updateSrsWord(wordId, 5);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Back Bar */}
      <div className="flex items-center gap-3 py-1">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-white flex items-center gap-2">
            <BookOpen size={18} className="text-neon-cyan" />
            어휘북 및 도감 관리
          </h1>
          <p className="text-[10px] text-gray-400 font-medium">HSK 레벨별 공식 어휘 정보와 망각 곡선 학습 상태를 확인합니다.</p>
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
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* HSK Tab Filters */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-none whitespace-nowrap">
        {([
          { id: 'all', label: '전체' },
          { id: 'HSK 1', label: 'HSK 1' },
          { id: 'HSK 2', label: 'HSK 2' },
          { id: 'HSK 3', label: 'HSK 3' },
          { id: 'HSK 4', label: 'HSK 4' },
          { id: 'HSK 5', label: 'HSK 5' },
          { id: 'HSK 6', label: 'HSK 6' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setSelectedHsk(tab.id); setCurrentPage(1); setExpandedWordId(null); }}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all inline-block ${
              selectedHsk === tab.id
                ? 'bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meaning Language Selector */}
      <section className="glass-panel rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" aria-label="단어 뜻 언어">
        <div>
          <p className="text-xs font-bold text-white">단어 뜻 언어</p>
          <p className="text-[10px] text-gray-400 mt-0.5">기본 언어는 한국어입니다.</p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1">
          {MEANING_LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language.id}
              type="button"
              data-testid={`meaning-language-${language.id}`}
              onClick={() => setMeaningLanguage(language.id)}
              aria-pressed={meaningLanguage === language.id}
              className={`min-w-24 h-9 px-3 rounded-md text-xs font-bold transition-colors ${
                meaningLanguage === language.id ? 'bg-neon-cyan text-dark-bg' : 'text-gray-400 hover:text-white'
              }`}
            >
              {language.label}
            </button>
          ))}
        </div>
      </section>

      {/* Study State Filter Selector */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
        {([
          { id: 'all', label: '전체 보기', count: studyCounts.all },
          { id: 'learned', label: '학습 중인 단어', count: studyCounts.learned },
          { id: 'unlearned', label: '미학습 단어', count: studyCounts.unlearned }
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
      <div className="flex items-center justify-between gap-3 text-xs text-gray-400 px-1 font-semibold">
        <span data-testid="filtered-vocab-count">총 {filteredVocabList.length}개의 단어</span>
        <span>{safeCurrentPage} / {totalPages} 페이지</span>
      </div>

      {/* Vocabulary Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3" data-vocab-list>
        {filteredVocabList.length > 0 ? (
          paginatedVocabList.map((word) => {
            const isExpanded = expandedWordId === word.id;
            const localizedMeaning = getLocalizedMeaning(word, meaningLanguage);
            
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
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    {/* Pinyin directly above Chinese characters */}
                    <div className="flex min-w-[82px] flex-col items-start">
                      <div className="text-[10px] sm:text-xs font-bold text-neon-cyan leading-tight" data-testid="vocab-pinyin">{word.pinyin}</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-white tracking-wide leading-tight mt-1" data-testid="vocab-hanzi">
                        {word.hanzi}
                      </div>
                    </div>
                    {/* Localized meaning */}
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="text-xs sm:text-sm text-white/90 font-medium break-words" data-testid="vocab-meaning">{localizedMeaning.text}</div>
                      {localizedMeaning.isFallback && (
                        <span className="text-[9px] text-cyber-yellow">번역 준비 중 · 원문 표시</span>
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

      {filteredVocabList.length > 0 && totalPages > 1 && (
        <nav aria-label="어휘 페이지" className="glass-panel rounded-2xl px-3 py-3 flex flex-wrap items-center justify-center gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => changePage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="min-w-16 h-10 px-3 rounded-lg border border-white/10 text-xs font-bold text-gray-300 disabled:opacity-30"
          >
            이전
          </button>
          {visiblePageNumbers.map((page, index) => {
            const previousPage = visiblePageNumbers[index - 1];
            return (
              <React.Fragment key={page}>
                {previousPage && page - previousPage > 1 && <span className="px-1 text-gray-500">…</span>}
                <button
                  type="button"
                  onClick={() => changePage(page)}
                  aria-current={page === safeCurrentPage ? 'page' : undefined}
                  className={`w-10 h-10 rounded-lg text-xs font-extrabold border transition-colors ${
                    page === safeCurrentPage
                      ? 'bg-neon-cyan text-dark-bg border-neon-cyan'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}
          <button
            type="button"
            onClick={() => changePage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="min-w-16 h-10 px-3 rounded-lg border border-white/10 text-xs font-bold text-gray-300 disabled:opacity-30"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
