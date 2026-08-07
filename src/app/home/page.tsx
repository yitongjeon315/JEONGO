'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldAlert, Award, Star, Flame, Dumbbell, Zap, Brain, Heart, ChevronRight, Check, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const { stats, allocateStat, dailyQuests, completeDailyQuest } = useApp();
  const [activeTab, setActiveTab] = useState<'status' | 'quests'>('status');
  const [floatingPointsEffect, setFloatingPointsEffect] = useState<{[key: string]: boolean}>({});

  // Avatar lookup
  const getAvatarVisual = (skinId: string) => {
    switch (skinId) {
      case 'shaolin_monk':
        return {
          emoji: '🥋',
          bgColor: 'from-orange-500/20 to-yellow-600/10 border-orange-500/30',
          skinName: '소림사 수도승',
          description: '어휘력(STR)과 집중력이 극대화된 전설의 한자 암기 수행자.'
        };
      case 'cyber_punk':
        return {
          emoji: '🎧',
          bgColor: 'from-cyan-500/20 to-indigo-600/10 border-cyan-500/30',
          skinName: '사이버 무사',
          description: '유창성(DEX)과 성조 피치(INT) 스펙이 탁월한 정보 네트워크 요원.'
        };
      case 'emperor':
        return {
          emoji: '👑',
          bgColor: 'from-yellow-400/20 to-amber-600/10 border-yellow-400/30',
          skinName: '황제',
          description: '모든 스탯에 위엄 서린 위용을 풍기며 길드 레이드 버프를 제공하는 지배자.'
        };
      default:
        return {
          emoji: '🎒',
          bgColor: 'from-sky-500/20 to-indigo-600/10 border-sky-500/30',
          skinName: '기본 탐험가',
          description: '중국 대륙의 비장한 성조 던전을 개척하러 나선 열혈 어학 모험가.'
        };
    }
  };

  const avatarInfo = getAvatarVisual(stats.avatarSkin);

  const handleStatAllocation = (stat: 'str' | 'dex' | 'int' | 'vit') => {
    if (stats.points > 0) {
      allocateStat(stat);
      
      // Trigger floating point addition animation
      setFloatingPointsEffect(prev => ({ ...prev, [stat]: true }));
      setTimeout(() => {
        setFloatingPointsEffect(prev => ({ ...prev, [stat]: false }));
      }, 1000);
    }
  };

  const statItems = [
    { key: 'str' as const, label: '힘 (STR / 어휘력)', value: stats.str, icon: Dumbbell, color: 'text-neon-green', barColor: 'bg-neon-green' },
    { key: 'dex' as const, label: '민첩 (DEX / 유창성)', value: stats.dex, icon: Zap, color: 'text-neon-cyan', barColor: 'bg-neon-cyan' },
    { key: 'int' as const, label: '지혜 (INT / 성조력)', value: stats.int, icon: Brain, color: 'text-violet-400', barColor: 'bg-violet-500' },
    { key: 'vit' as const, label: '체력 (VIT / 스트릭)', value: stats.vit, icon: Heart, color: 'text-neon-rose', barColor: 'bg-neon-rose' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top action row */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-gray-400">내 학습 대시보드</span>
        <Link href="/vocab-book" className="flex items-center gap-1.5 text-xs font-bold text-neon-cyan hover:underline transition-all">
          <BookOpen size={14} />
          어휘 도감 📖
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'status' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          캐릭터 성장 상태 (Status)
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative ${
            activeTab === 'quests' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          일일 퀘스트 (Quests)
          {dailyQuests.some(q => !q.completed && q.current >= q.target) && (
            <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-neon-rose animate-ping" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'status' ? (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Character Showcase */}
            <div className={`glass-panel border rounded-2xl p-5 flex flex-col items-center bg-gradient-to-b ${avatarInfo.bgColor} shadow-lg relative overflow-hidden`}>
              <div className="absolute top-2 right-2 text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-bold border border-white/5 text-gray-300">
                칭호: 초보 모험가
              </div>
              
              {/* Avatar Animation */}
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-6xl shadow-2xl animate-float mt-4 relative">
                <div className="absolute inset-0 rounded-full border border-white/10 opacity-30 animate-pulse-glow" />
                {avatarInfo.emoji}
              </div>
              
              <h3 className="text-lg font-bold text-white mt-3">{avatarInfo.skinName}</h3>
              <p className="text-xs md:text-sm text-gray-300/80 text-center px-4 mt-1 font-medium leading-relaxed">
                {avatarInfo.description}
              </p>
            </div>

            {/* RPG Stats Card */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm md:text-base font-bold flex items-center gap-1.5 text-white">
                  <Star size={16} className="text-cyber-yellow" />
                  스탯 분배 인터페이스
                </h3>
                {stats.points > 0 ? (
                  <span className="text-xs font-bold bg-neon-rose/20 text-neon-rose border border-neon-rose/30 px-2.5 py-0.5 rounded-full animate-bounce glow-rose">
                    + {stats.points} 스탯 포인트 보유
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">레벨업 시 스탯 +3 획득</span>
                )}
              </div>

              <div className="flex flex-col gap-3.5 mt-1">
                {statItems.map((stat) => {
                  const Icon = stat.icon;
                  const valuePercent = Math.min(100, (stat.value / 100) * 100);
                  const isAllocatable = stats.points > 0;

                  return (
                    <div key={stat.key} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-300">
                          <Icon size={14} className={stat.color} />
                          <span>{stat.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs md:text-sm font-bold text-white relative">
                            {stat.value}
                            {floatingPointsEffect[stat.key] && (
                              <motion.span
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -20 }}
                                className="absolute -top-1 -right-4 text-xs font-bold text-neon-green"
                              >
                                +1
                              </motion.span>
                            )}
                          </span>
                          
                          {isAllocatable && (
                            <button
                              onClick={() => handleStatAllocation(stat.key)}
                              className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center font-bold text-sm text-white hover:scale-105 active:scale-95 transition-all"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Stat Bar */}
                      <div className="h-1.5 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                        <div
                          className={`h-full ${stat.barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${valuePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="quests"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-gray-300">일일 모험 미션 (매일 오전 6시 초기화)</h3>
              <Award size={15} className="text-cyber-yellow" />
            </div>

            {dailyQuests.map((quest) => {
              const isClaimable = !quest.completed && quest.current >= quest.target;
              
              return (
                <div
                  key={quest.id}
                  className={`glass-panel border rounded-2xl p-5 flex justify-between items-center transition-all ${
                    quest.completed ? 'opacity-65 border-white/5' : isClaimable ? 'border-cyber-yellow/40 bg-cyber-yellow/5' : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col gap-1 flex-1 pr-4">
                    <h4 className={`text-sm font-bold ${quest.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {quest.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                      {quest.desc}
                    </p>
                    
                    {/* Progress Slider */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full ${quest.completed ? 'bg-gray-500' : 'bg-cyber-yellow'} transition-all`}
                          style={{ width: `${(quest.current / quest.target) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {quest.current}/{quest.target}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Rewards Preview */}
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold text-cyber-yellow">+{quest.gold} Gold</span>
                      <span className="text-xs font-bold text-neon-cyan">+{quest.xp} XP</span>
                    </div>

                    {/* Claim Button */}
                    {quest.completed ? (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neon-green">
                        <Check size={14} />
                      </div>
                    ) : isClaimable ? (
                      <button
                        onClick={() => completeDailyQuest(quest.id, quest.gold, quest.xp)}
                        className="px-3.5 py-1.5 bg-cyber-yellow hover:bg-yellow-500 text-dark-bg font-bold rounded-lg text-xs shadow-lg shadow-cyber-yellow/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        보상 받기
                      </button>
                    ) : (
                      <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 font-bold">
                        진행 중
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
