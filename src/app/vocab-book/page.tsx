'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, VocabItem } from '@/context/AppContext';
import { ArrowLeft, Search, BookOpen, ChevronDown, ChevronUp, RefreshCw, Calendar, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VocabBookPage() {
  const router = useRouter();
  const { vocabList, updateSrsWord } = useApp();
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHsk, setSelectedHsk] = useState<'all' | 'HSK 1' | 'HSK 2' | 'HSK 3'>('all');
  
  // Expanded cards state tracking
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);

  // Filter vocabulary list
  const filteredVocabList = vocabList.filter(word => {
    const matchesSearch = 
      word.hanzi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesHsk = selectedHsk === 'all' || word.hsk === selectedHsk;
    
    return matchesSearch && matchesHsk;
  });

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
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="한자, 병음, 한국어 뜻 실시간 검색..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* HSK Tab Filters */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
        {[
          { id: 'all', label: '전체' },
          { id: 'HSK 1', label: 'HSK 1급' },
          { id: 'HSK 2', label: 'HSK 2급' },
          { id: 'HSK 3', label: 'HSK 3급' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedHsk(tab.id as any)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              selectedHsk === tab.id
                ? 'bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Word Count Indicator */}
      <div className="text-[10px] text-gray-400 px-1 font-semibold">
        총 {filteredVocabList.length}개의 단어가 검색되었습니다.
      </div>

      {/* Vocabulary Cards List */}
      <div className="flex flex-col gap-3 pb-8">
        {filteredVocabList.length > 0 ? (
          filteredVocabList.map((word) => {
            const isExpanded = expandedWordId === word.id;
            
            // Check SRS review ready status (nextReviewAt is in the past)
            const isReviewReady = new Date(word.nextReviewAt).getTime() <= Date.now();
            const hasLearned = word.repetitions > 0;
            
            return (
              <div
                key={word.id}
                className={`glass-panel border rounded-2xl overflow-hidden transition-all ${
                  isExpanded ? 'border-neon-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-white/10'
                }`}
              >
                {/* Word Summary View */}
                <div
                  onClick={() => toggleExpand(word.id)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Chinese Characters */}
                    <div className="text-2xl font-extrabold text-white tracking-wide min-w-[70px]">
                      {word.hanzi}
                    </div>
                    {/* Pinyin & Meaning */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-bold text-neon-cyan">{word.pinyin}</div>
                      <div className="text-xs text-white/90 font-medium">{word.meaning}</div>
                    </div>
                  </div>

                  {/* Badges & Expanding Arrow */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[9px] font-extrabold bg-white/10 px-2 py-0.5 rounded-full border border-white/5 text-gray-300">
                        {word.hsk}
                      </span>
                      {hasLearned ? (
                        isReviewReady ? (
                          <span className="text-[9px] font-extrabold bg-neon-rose/20 text-neon-rose border border-neon-rose/30 px-2 py-0.5 rounded-full glow-rose animate-pulse">
                            복습 대기
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold bg-neon-green/20 text-neon-green border border-neon-green/30 px-2 py-0.5 rounded-full">
                            기억됨
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] font-extrabold bg-white/5 text-gray-500 border border-white/5 px-2 py-0.5 rounded-full">
                          미학습
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400">
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
                            <span className="text-[11px] text-gray-300 font-medium">{word.exampleMeaning}</span>
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
