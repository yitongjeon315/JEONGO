'use client';

import React, { useState } from 'react';
import { useApp, VocabItem } from '@/context/AppContext';
import { Swords, Heart, Check, X, ShieldAlert, Award, Star, BookOpen, PenTool, HelpCircle, ChevronRight, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface WritingQuest {
  korean: string;
  correctCards: string[];
  pinyin: string;
}

export default function LearnPage() {
  const { vocabList, updateSrsWord, stats, spendGold, addXP, addGold } = useApp();
  
  // Lobby Selection States
  const [selectedHsk, setSelectedHsk] = useState<'hsk12' | 'hsk34' | 'hsk56'>('hsk12');
  const [selectedMode, setSelectedMode] = useState<'vocab' | 'writing'>('vocab');
  
  // Game Play States
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'cleared'>('lobby');
  const [currentVocabQueue, setCurrentVocabQueue] = useState<VocabItem[]>([]);
  const [currentWritingQueue, setCurrentWritingQueue] = useState<WritingQuest[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(100);
  const [monsterMaxHp, setMonsterMaxHp] = useState(100);
  const [potionUsed, setPotionUsed] = useState(false);
  
  // Vocab Mode specific states
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Writing Mode specific states
  const [scrambledCards, setScrambledCards] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  // Answer validation states
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Rewards accumulator
  const [xpEarned, setXpEarned] = useState(0);
  const [goldEarned, setGoldEarned] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  
  // Floating text feedback for attacks
  const [damageEffect, setDamageEffect] = useState<{ active: boolean; text: string; isCrit: boolean }>({ active: false, text: '', isCrit: false });

  // Mock HSK 5-6 words (Since initial database has 1-3)
  const HSK56_WORDS: VocabItem[] = [
    { id: 101, hanzi: '关键', pinyin: 'guānjiàn', meaning: '관건/핵심', hsk: 'HSK 5', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: '' },
    { id: 102, hanzi: '招聘', pinyin: 'zhāopìn', meaning: '채용/모집', hsk: 'HSK 5', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: '' },
    { id: 103, hanzi: ' 繁荣', pinyin: 'fánróng', meaning: '번영하다', hsk: 'HSK 6', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: '' },
    { id: 104, hanzi: ' 抽象', pinyin: 'chōuxiàng', meaning: '추상적이다', hsk: 'HSK 6', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: '' },
    { id: 105, hanzi: ' 逻辑', pinyin: 'luójí', meaning: '논리/이치', hsk: 'HSK 6', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: '' },
  ];

  // Writing quests mapping by HSK level
  const WRITING_QUESTS = {
    hsk12: [
      { korean: '나는 사과를 먹는 것을 좋아해.', correctCards: ['我', '喜欢', '吃', '苹果'], pinyin: 'Wǒ xǐhuan chī píngguǒ.' },
      { korean: '우리는 학교에서 중국어를 공부해.', correctCards: ['我们', '在学校', '学习', '中文'], pinyin: 'Wǒmen zài xuéxiào xuéxí Zhōngwén.' },
      { korean: '그는 내 좋은 친구야.', correctCards: ['他', '是', '我的', '好朋友'], pinyin: 'Tā shì wǒ de hǎo péngyou.' },
    ],
    hsk34: [
      { korean: '이 햄버거는 정말 맛있어.', correctCards: ['这个', '汉堡包', '很好吃'], pinyin: 'Zhège hànbǎobāo hěn hǎochī.' },
      { korean: '중국인은 새해에 만두를 먹어.', correctCards: ['中国人', '过年', '吃', '饺子'], pinyin: 'Zhōngguórén guònián chī jiǎozi.' },
    ],
    hsk56: [
      { korean: '이번 채용은 매우 중요해.', correctCards: ['这次', '招聘', '非常', '关键'], pinyin: 'Zhècì zhāopìn fēicháng guānjiàn.' },
      { korean: '그의 말은 논리에 맞지 않아.', correctCards: ['他的话', '不符合', '逻辑'], pinyin: 'Tā de huà bù fúhé luójí.' },
    ]
  };

  // Start Dungeon Play
  const startDungeon = () => {
    setXpEarned(0);
    setGoldEarned(0);
    setIncorrectCount(0);
    setCurrentIndex(0);
    setIsAnswered(false);
    
    if (selectedMode === 'vocab') {
      // Filter words based on selected HSK level
      let pool: VocabItem[] = [];
      if (selectedHsk === 'hsk12') {
        pool = vocabList.filter(item => item.hsk === 'HSK 1' || item.hsk === 'HSK 2');
      } else if (selectedHsk === 'hsk34') {
        pool = vocabList.filter(item => item.hsk === 'HSK 3' || item.hsk === 'HSK 4');
      } else {
        pool = HSK56_WORDS;
      }
      
      // Shuffle and take max 4 words
      const queue = [...pool].sort(() => 0.5 - Math.random()).slice(0, 4);
      setCurrentVocabQueue(queue);
      
      const calculatedHp = queue.length * 25;
      setMonsterHp(calculatedHp);
      setMonsterMaxHp(calculatedHp);
      
      setGameState('playing');
      generateVocabOptions(queue[0], [...vocabList, ...HSK56_WORDS]);
    } else {
      // Sentence Writing Mode
      const quests = WRITING_QUESTS[selectedHsk];
      const queue = [...quests].sort(() => 0.5 - Math.random());
      setCurrentWritingQueue(queue);
      
      const calculatedHp = queue.length * 30;
      setMonsterHp(calculatedHp);
      setMonsterMaxHp(calculatedHp);
      
      setGameState('playing');
      setupWritingQuest(queue[0]);
    }
  };

  // Vocab Mode: Options Generation
  const generateVocabOptions = (word: VocabItem, allWords: VocabItem[]) => {
    setSelectedOption(null);
    setIsAnswered(false);
    setPotionUsed(false);
    
    const wrongOptions = allWords
      .filter(item => item.id !== word.id && item.meaning !== word.meaning)
      .map(item => item.meaning)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
      
    const pool = [word.meaning, ...wrongOptions].sort(() => 0.5 - Math.random());
    setOptions(pool);
  };

  // Writing Mode: Scramble Cards Setup
  const setupWritingQuest = (quest: WritingQuest) => {
    setIsAnswered(false);
    setSelectedCards([]);
    // Scramble the correct cards list
    const scrambled = [...quest.correctCards].sort(() => 0.5 - Math.random());
    setScrambledCards(scrambled);
  };

  // Click card to move it up or down in Writing Mode
  const handleCardClick = (card: string, isFromScrambled: boolean) => {
    if (isAnswered) return;
    
    if (isFromScrambled) {
      setSelectedCards(prev => [...prev, card]);
      setScrambledCards(prev => prev.filter(c => c !== card));
    } else {
      setScrambledCards(prev => [...prev, card]);
      setSelectedCards(prev => prev.filter(c => c !== card));
    }
  };

  // Check Writing Mode Answer
  const checkWritingAnswer = () => {
    if (isAnswered) return;
    
    const quest = currentWritingQueue[currentIndex];
    const userSentence = selectedCards.join('');
    const correctSentence = quest.correctCards.join('');
    const isRight = userSentence === correctSentence;
    
    setIsAnswered(true);
    setIsCorrect(isRight);
    
    if (isRight) {
      const isCrit = stats.str > 15 && Math.random() > 0.4;
      const damage = isCrit ? 40 : 30;
      setMonsterHp(prev => Math.max(0, prev - damage));
      
      setDamageEffect({
        active: true,
        text: isCrit ? `크리티컬! -${damage} HP` : `-${damage} HP`,
        isCrit
      });
      
      setXpEarned(prev => prev + 25);
      setGoldEarned(prev => prev + 12);
    } else {
      setIncorrectCount(prev => prev + 1);
      setDamageEffect({
        active: true,
        text: '빗나감! 반격 0 데미지',
        isCrit: false
      });
    }
    
    setTimeout(() => {
      setDamageEffect(prev => ({ ...prev, active: false }));
    }, 1200);
  };

  // Check Vocab Mode Answer
  const handleVocabAnswerSubmit = (optionIndex: number) => {
    if (isAnswered) return;
    
    const word = currentVocabQueue[currentIndex];
    const chosenMeaning = options[optionIndex];
    const isRight = chosenMeaning === word.meaning;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    setIsCorrect(isRight);
    
    if (isRight) {
      const isCrit = stats.str > 15 && Math.random() > 0.5;
      const damage = isCrit ? 35 : 25;
      setMonsterHp(prev => Math.max(0, prev - damage));
      
      setDamageEffect({
        active: true,
        text: isCrit ? `크리티컬! -${damage} HP` : `-${damage} HP`,
        isCrit
      });
      
      setXpEarned(prev => prev + 15);
      setGoldEarned(prev => prev + 8);
      
      // Update SRS only if it belongs to client database
      if (word.id < 100) {
        updateSrsWord(word.id, 5);
      }
    } else {
      setIncorrectCount(prev => prev + 1);
      setDamageEffect({
        active: true,
        text: '빗나감! 반격 0 데미지',
        isCrit: false
      });
      if (word.id < 100) {
        updateSrsWord(word.id, 2);
      }
    }
    
    setTimeout(() => {
      setDamageEffect(prev => ({ ...prev, active: false }));
    }, 1200);
  };

  // Use Potion (Hint in Vocab Mode)
  const useHintPotion = () => {
    if (potionUsed || isAnswered) return;
    if (stats.gold < 50) return;
    
    spendGold(50);
    setPotionUsed(true);
    
    const correctMeaning = currentVocabQueue[currentIndex].meaning;
    const incorrectIndices = options
      .map((opt, idx) => ({ opt, idx }))
      .filter(item => item.opt !== correctMeaning);
      
    const toRemove = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)].idx;
    setOptions(prev => prev.map((opt, idx) => idx === toRemove ? '🧪 (제거됨)' : opt));
  };

  // Next Turn
  const nextTurn = () => {
    const nextIdx = currentIndex + 1;
    const totalQuests = selectedMode === 'vocab' ? currentVocabQueue.length : currentWritingQueue.length;
    
    if (nextIdx >= totalQuests) {
      // Dungeon Cleared
      setGameState('cleared');
      setMonsterHp(0);
      
      // Grant final stage completion bonus
      addXP(xpEarned);
      addGold(goldEarned);
    } else {
      setCurrentIndex(nextIdx);
      if (selectedMode === 'vocab') {
        generateVocabOptions(currentVocabQueue[nextIdx], [...vocabList, ...HSK56_WORDS]);
      } else {
        setupWritingQuest(currentWritingQueue[nextIdx]);
      }
    }
  };

  const getDungeonVisuals = () => {
    switch (selectedHsk) {
      case 'hsk34':
        return { name: '상하이 타워 던전 (중급)', bg: 'from-cyan-950/20 to-transparent border-cyan-500/20', monster: '👹' };
      case 'hsk56':
        return { name: '자금성 황제 던전 (고급)', bg: 'from-yellow-950/20 to-transparent border-yellow-500/20', monster: '👑' };
      default:
        return { name: '만리장성 관문 던전 (초급)', bg: 'from-emerald-950/20 to-transparent border-emerald-500/20', monster: '🐉' };
    }
  };

  const dungeonInfo = getDungeonVisuals();

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {/* Lobby: Stage & Mode Selector */}
        {gameState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Lobby Title Header */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col items-center bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/20 relative">
              <Link href="/vocab-book" className="absolute top-3 right-3 text-[10px] md:text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/5 text-gray-300 hover:text-white hover:bg-white/15 flex items-center gap-1 transition-all">
                어휘북 📖
              </Link>
              <div className="w-14 h-14 rounded-full bg-neon-green/15 flex items-center justify-center text-neon-green glow-green animate-float">
                <Swords size={28} />
              </div>
              <h3 className="text-lg font-extrabold mt-3 text-white">중국어 격전의 던전 맵</h3>
              <p className="text-xs text-gray-400 text-center px-4 mt-1 font-medium leading-relaxed">
                난이도(HSK) 등급을 선택하고, 원하는 학습 전투(유형) 모드로 몬스터를 토벌하십시오.
              </p>
            </div>

            {/* 1. Select HSK Level */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-300 px-1">1단계: 던전 난이도(HSK 등급) 지정</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hsk12', label: '1-2급 (초급)', name: '만리장성' },
                  { id: 'hsk34', label: '3-4급 (중급)', name: '상하이' },
                  { id: 'hsk56', label: '5-6급 (고급)', name: '자금성' }
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedHsk(level.id as any)}
                    className={`glass-panel border rounded-xl py-3 px-1 text-center transition-all ${
                      selectedHsk === level.id 
                        ? 'border-neon-green/40 bg-neon-green/5 text-neon-green font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                        : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{level.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-80">{level.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Select Mode */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-gray-300 px-1">2단계: 학습 전투 모드(유형) 선택</span>
              <div className="flex flex-col gap-2">
                {/* Vocab Mode */}
                <button
                  onClick={() => setSelectedMode('vocab')}
                  className={`glass-panel border rounded-2xl p-4 text-left flex gap-3.5 items-center transition-all ${
                    selectedMode === 'vocab' ? 'border-neon-cyan/40 bg-neon-cyan/5' : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-cyan border border-white/10">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      ⚔️ 어휘 전투 모드 (읽기 유형)
                      {selectedMode === 'vocab' && <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_#06b6d4]" />}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">단어의 한자와 병음을 보고 한글 뜻을 맞추어 보스를 타격합니다.</span>
                  </div>
                </button>

                {/* Writing Mode */}
                <button
                  onClick={() => setSelectedMode('writing')}
                  className={`glass-panel border rounded-2xl p-4 text-left flex gap-3.5 items-center transition-all ${
                    selectedMode === 'writing' ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-violet-400 border border-white/10">
                    <PenTool size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      ✍️ 문장 쓰기 모드 (쓰기 유형)
                      {selectedMode === 'writing' && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">제시된 한글 번역에 맞게 중국어 단어 블록을 바르게 나열해 문장을 조립합니다.</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={startDungeon}
              className="w-full mt-2 py-3.5 bg-neon-green hover:bg-emerald-500 text-dark-bg font-extrabold rounded-xl text-sm shadow-lg shadow-neon-green/20 hover:scale-105 active:scale-95 transition-all"
            >
              던전 침공 개시 (전투 시작)
            </button>
          </motion.div>
        )}

        {/* Playing State */}
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Monster HP Panel */}
            <div className={`glass-panel rounded-2xl p-4 flex flex-col gap-2 bg-gradient-to-r border-red-500/10 ${dungeonInfo.bg}`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-300">{dungeonInfo.name}</span>
                <span className="text-neon-rose">{monsterHp}/{monsterMaxHp} HP</span>
              </div>
              <div className="h-3.5 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-neon-rose transition-all duration-300"
                  style={{ width: `${(monsterHp / monsterMaxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Battle Zone (Visual Monster Card) */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center relative min-h-[170px]">
              <div className="text-5xl mb-4 animate-bounce relative">
                {monsterHp > 0 ? dungeonInfo.monster : '💥'}
                
                {/* Damage text effect */}
                <AnimatePresence>
                  {damageEffect.active && (
                    <motion.div
                      initial={{ opacity: 1, y: 0, scale: 0.8 }}
                      animate={{ opacity: 1, y: -30, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      className={`absolute -top-6 left-1/2 -translate-x-1/2 font-extrabold text-sm whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
                        damageEffect.isCrit ? 'text-cyber-yellow' : 'text-neon-rose'
                      }`}
                    >
                      {damageEffect.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Vocab Mode Card Content */}
              {selectedMode === 'vocab' ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-neon-cyan uppercase">
                    {currentVocabQueue[currentIndex]?.hsk}
                  </span>
                  <h1 className="text-3xl font-extrabold text-white mt-1 select-none">
                    {currentVocabQueue[currentIndex]?.hanzi}
                  </h1>
                  <p className="text-xs text-gray-400 font-mono font-medium">
                    {currentVocabQueue[currentIndex]?.pinyin}
                  </p>
                </div>
              ) : (
                /* Writing Mode Korean Prompt */
                <div className="flex flex-col items-center gap-1.5 text-center px-4">
                  <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-violet-400 uppercase">
                    문장 결합 쓰기 미션
                  </span>
                  <h2 className="text-sm font-extrabold text-white mt-1 leading-snug">
                    "{currentWritingQueue[currentIndex]?.korean}"
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium">위 한국어에 부합하도록 중국어 단어를 조립하십시오.</p>
                </div>
              )}
            </div>

            {/* Interactive Answer Input Zone */}
            {selectedMode === 'vocab' ? (
              /* Vocab Multiple Choice Options */
              <div className="flex flex-col gap-2">
                {options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  let optionStyle = 'border-white/10 bg-white/5 hover:bg-white/10 text-white';
                  
                  if (isAnswered) {
                    if (option === currentVocabQueue[currentIndex].meaning) {
                      optionStyle = 'border-neon-green/40 bg-neon-green/10 text-neon-green font-bold';
                    } else if (isSelected) {
                      optionStyle = 'border-neon-rose/40 bg-neon-rose/10 text-neon-rose font-bold';
                    } else {
                      optionStyle = 'border-white/5 bg-white/2 opacity-50 text-gray-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered || option.startsWith('🧪')}
                      onClick={() => handleVocabAnswerSubmit(idx)}
                      className={`w-full py-3.5 px-4 border rounded-xl text-left text-xs transition-all flex items-center justify-between hover:scale-[1.01] ${optionStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswered && option === currentVocabQueue[currentIndex].meaning && <Check size={16} />}
                      {isAnswered && isSelected && option !== currentVocabQueue[currentIndex].meaning && <X size={16} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Writing Mode: Drag/Click Card builder */
              <div className="flex flex-col gap-4">
                {/* 1. Selected Cards (User's forming sentence) */}
                <div className="glass-panel min-h-[60px] rounded-xl p-3 border-dashed border-white/10 flex flex-wrap gap-2 items-center justify-center bg-black/20">
                  {selectedCards.length === 0 && (
                    <span className="text-[10px] text-gray-500 font-medium">아래 카드들을 차례대로 클릭해 문장을 조립하세요.</span>
                  )}
                  {selectedCards.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCardClick(card, false)}
                      disabled={isAnswered}
                      className="px-3.5 py-1.5 bg-violet-500/20 border border-violet-500/40 text-violet-400 rounded-lg text-xs font-bold hover:scale-95 transition-all"
                    >
                      {card}
                    </button>
                  ))}
                </div>

                {/* 2. Scrambled Selection Pool */}
                <div className="flex flex-wrap justify-center gap-2.5 p-2 bg-white/2 border border-white/5 rounded-xl min-h-[50px] items-center">
                  {scrambledCards.length === 0 && selectedCards.length > 0 && !isAnswered && (
                    <span className="text-[10px] text-neon-green font-bold">카드 정렬 완료! 검증 버튼을 눌러 확인하세요.</span>
                  )}
                  {scrambledCards.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCardClick(card, true)}
                      disabled={isAnswered}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-medium hover:scale-105 active:scale-95 transition-all"
                    >
                      {card}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Answer feedback result info in Writing Mode */}
            {isAnswered && selectedMode === 'writing' && (
              <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                isCorrect ? 'bg-neon-green/5 border-neon-green/20 text-neon-green' : 'bg-neon-rose/5 border-neon-rose/20 text-neon-rose'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {isCorrect ? <Check size={14} /> : <X size={14} />}
                  <span>{isCorrect ? '문장 결합 성공!' : '문장 구조 불일치'}</span>
                </div>
                <p className="text-[10px] text-gray-300 font-mono mt-0.5">
                  정답: {currentWritingQueue[currentIndex].correctCards.join(' ')}
                </p>
                <p className="text-[9px] text-gray-500 font-mono">
                  병음: {currentWritingQueue[currentIndex].pinyin}
                </p>
              </div>
            )}

            {/* Action Bar (Hint or Check or Next) */}
            <div className="flex gap-2 mt-1">
              {!isAnswered ? (
                selectedMode === 'vocab' ? (
                  <button
                    onClick={useHintPotion}
                    disabled={potionUsed || stats.gold < 50}
                    className={`flex-1 py-3.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      potionUsed || stats.gold < 50
                        ? 'border-white/5 text-gray-500'
                        : 'border-cyber-yellow/30 bg-cyber-yellow/5 hover:bg-cyber-yellow/10 text-cyber-yellow hover:scale-105 active:scale-95'
                    }`}
                  >
                    🧪 힌트 포션 사용 (비용: 50G)
                  </button>
                ) : (
                  <button
                    onClick={checkWritingAnswer}
                    disabled={selectedCards.length === 0}
                    className={`flex-1 py-3.5 font-extrabold rounded-xl text-xs transition-all ${
                      selectedCards.length === 0
                        ? 'bg-white/5 border border-white/5 text-gray-500'
                        : 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95'
                    }`}
                  >
                    검증하기 (체크)
                  </button>
                )
              ) : (
                <button
                  onClick={nextTurn}
                  className="flex-1 py-3.5 bg-neon-cyan hover:bg-cyan-500 text-dark-bg font-extrabold rounded-xl text-xs shadow-lg shadow-neon-cyan/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  다음 관문 돌파 <ChevronRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Cleared State Summary */}
        {gameState === 'cleared' && (
          <motion.div
            key="cleared"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-2xl p-6 flex flex-col items-center bg-gradient-to-br from-cyber-yellow/10 to-transparent border-cyber-yellow/20 relative"
          >
            <div className="w-16 h-16 rounded-full bg-cyber-yellow/15 flex items-center justify-center text-cyber-yellow glow-yellow animate-float">
              <Award size={32} />
            </div>
            <h3 className="text-base font-bold mt-4 text-white">던전 토벌 완료!</h3>
            <p className="text-xs text-gray-400 text-center px-4 mt-1 font-medium">
              선택한 난이도와 모드의 학습 전투 스테이지를 무사히 돌파하셨습니다.
            </p>

            <div className="w-full mt-6 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-300">던전 전적 및 정산 내역</h4>
              <hr className="border-white/5" />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400 font-medium">클리어 던전 등급</span>
                <span className="text-neon-cyan font-bold">
                  {selectedHsk === 'hsk12' ? 'HSK 1-2급 (초급)' : selectedHsk === 'hsk34' ? 'HSK 3-4급 (중급)' : 'HSK 5-6급 (고급)'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">학습 전투 모드</span>
                <span className="text-violet-400 font-bold">
                  {selectedMode === 'vocab' ? '어휘 전투 모드' : '문장 쓰기 모드'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">틀린 문제 수</span>
                <span className={incorrectCount > 0 ? 'text-neon-rose font-bold' : 'text-neon-green font-bold'}>
                  {incorrectCount} 개
                </span>
              </div>
              <hr className="border-white/5 my-1" />
              <div className="flex justify-between text-xs font-bold">
                <span className="text-cyber-yellow">지급 골드</span>
                <span className="text-cyber-yellow">+{goldEarned} Gold</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-neon-green">획득 경험치</span>
                <span className="text-neon-green">+{xpEarned} XP</span>
              </div>
            </div>

            <button
              onClick={() => setGameState('lobby')}
              className="w-full mt-6 py-3 bg-cyber-yellow hover:bg-yellow-500 text-dark-bg font-extrabold rounded-xl text-xs shadow-lg shadow-cyber-yellow/20 hover:scale-105 active:scale-95 transition-all"
            >
              던전 대기 로비로 나가기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
