'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Star, Dumbbell, Zap, Brain, Heart, Check, BarChart3, Settings, Sparkles, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EMPTY_STAT_ALLOCATION,
  getAttackDamage,
  getGrowthTier,
  previewStats,
  totalAllocatedPoints,
  type CharacterStatKey,
  type StatAllocation,
} from '@/lib/character-growth';

export default function HomePage() {
  const { stats, allocateStats, dailyQuests, claimDailyQuest, session } = useApp();
  const [activeTab, setActiveTab] = useState<'status' | 'quests'>('status');
  const [isSimulating, setIsSimulating] = useState(false);
  const [draftAllocation, setDraftAllocation] = useState<StatAllocation>({ ...EMPTY_STAT_ALLOCATION });

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
  const growthTier = getGrowthTier(stats.level);
  const allocatedPoints = totalAllocatedPoints(draftAllocation);
  const remainingPoints = stats.points - allocatedPoints;
  const simulatedStats = previewStats(stats, draftAllocation);

  const changeDraftStat = (stat: CharacterStatKey, amount: 1 | -1) => {
    setDraftAllocation((current) => {
      if (amount > 0 && totalAllocatedPoints(current) >= stats.points) return current;
      if (amount < 0 && current[stat] <= 0) return current;
      return { ...current, [stat]: current[stat] + amount };
    });
  };

  const closeSimulation = () => {
    setDraftAllocation({ ...EMPTY_STAT_ALLOCATION });
    setIsSimulating(false);
  };

  const applySimulation = () => {
    if (allocatedPoints <= 0) return;
    allocateStats(draftAllocation);
    closeSimulation();
  };

  const statItems = [
    { key: 'str' as const, label: '힘 (STR / 어휘력)', value: simulatedStats.str, icon: Dumbbell, color: 'text-neon-green', barColor: 'bg-neon-green', effect: '1포인트마다 던전 공격력 +1' },
    { key: 'dex' as const, label: '민첩 (DEX / 유창성)', value: simulatedStats.dex, icon: Zap, color: 'text-neon-cyan', barColor: 'bg-neon-cyan', effect: '풀이 속도 성장 지표' },
    { key: 'int' as const, label: '지혜 (INT / 성조력)', value: simulatedStats.int, icon: Brain, color: 'text-violet-400', barColor: 'bg-violet-500', effect: '성조·복습 성장 지표' },
    { key: 'vit' as const, label: '체력 (VIT / 스트릭)', value: simulatedStats.vit, icon: Heart, color: 'text-neon-rose', barColor: 'bg-neon-rose', effect: '학습 지속력 성장 지표' },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Link href="/analytics" className="glass-panel rounded-xl p-3 text-center text-[10px] font-bold"><BarChart3 size={17} className="mx-auto mb-1 text-violet-400" />학습 통계</Link>
        <Link href={session?.role === 'admin' ? '/admin/content' : '/login'} className="glass-panel rounded-xl p-3 text-center text-[10px] font-bold"><Settings size={17} className="mx-auto mb-1 text-cyber-yellow" />{session?.role === 'admin' ? '콘텐츠 CMS' : '로그인'}</Link>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'status' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          캐릭터 성장 상태
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative ${
            activeTab === 'quests' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          일일 모험 미션
          {dailyQuests.some(q => !q.claimed && q.current >= q.target) && (
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
            <div className={`glass-panel border rounded-2xl p-5 flex flex-col items-center bg-gradient-to-b ${avatarInfo.bgColor} shadow-xl ${growthTier.auraClass} relative overflow-hidden`}>
              <div className="absolute top-2 right-2 text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-bold border border-white/5 text-gray-300">
                칭호: {growthTier.title}
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
              <div className="mt-4 w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-neon-cyan">현재 레벨 {stats.level}</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {growthTier.nextLevel ? `레벨 ${growthTier.nextLevel}: ‘${growthTier.nextTitle}’ 칭호 해금` : '최고 성장 칭호를 달성했습니다.'}
                </p>
              </div>
            </div>

            {/* RPG Stats Card */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm md:text-base font-bold flex items-center gap-1.5 text-white">
                  <Star size={16} className="text-cyber-yellow" />
                  캐릭터 성장 시뮬레이션
                </h3>
                <button
                  type="button"
                  onClick={() => isSimulating ? closeSimulation() : setIsSimulating(true)}
                  className="flex items-center gap-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1.5 text-[10px] font-bold text-neon-cyan"
                  data-testid="toggle-growth-simulation"
                >
                  <Sparkles size={12} /> {isSimulating ? '닫기' : '시뮬레이션 시작'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="text-[10px] text-gray-400">보유 스탯 포인트</span>
                <strong className={remainingPoints > 0 ? 'text-neon-rose' : 'text-gray-300'}>{isSimulating ? remainingPoints : stats.points}</strong>
              </div>

              <div className="flex flex-col gap-3.5 mt-1">
                {statItems.map((stat) => {
                  const Icon = stat.icon;
                  const valuePercent = Math.min(100, (stat.value / 100) * 100);
                  const draftValue = draftAllocation[stat.key];

                  return (
                    <div key={stat.key} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-0.5 text-xs md:text-sm font-semibold text-gray-300">
                          <div className="flex items-center gap-1.5">
                          <Icon size={14} className={stat.color} />
                          <span>{stat.label}</span>
                          </div>
                          <span className="text-[9px] font-normal text-gray-500">{stat.effect}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSimulating && <button type="button" aria-label={`${stat.label} 감소`} disabled={draftValue <= 0} onClick={() => changeDraftStat(stat.key, -1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 disabled:opacity-25"><Minus size={13} /></button>}
                          <span className="min-w-8 text-center text-xs font-bold text-white">
                            {stats[stat.key]}{draftValue > 0 && <span className="text-neon-green">+{draftValue}</span>}
                          </span>
                          {isSimulating && <button type="button" aria-label={`${stat.label} 증가`} disabled={remainingPoints <= 0} onClick={() => changeDraftStat(stat.key, 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan disabled:opacity-25"><Plus size={13} /></button>}
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

              {isSimulating && (
                <div className="mt-2 flex flex-col gap-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/[0.04] p-3" data-testid="growth-simulation-panel">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-black/20 p-2.5"><span className="text-gray-400">어휘 일반 공격</span><strong className="mt-1 block text-neon-green">{getAttackDamage(stats.str, 'vocab')} → {getAttackDamage(simulatedStats.str, 'vocab')}</strong></div>
                    <div className="rounded-lg bg-black/20 p-2.5"><span className="text-gray-400">어휘 크리티컬</span><strong className="mt-1 block text-cyber-yellow">{getAttackDamage(stats.str, 'vocab', true)} → {getAttackDamage(simulatedStats.str, 'vocab', true)}</strong></div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-gray-400">정답을 3번 연속 맞히면 크리티컬 공격이 발생합니다. 적용하기 전까지 실제 능력치는 바뀌지 않습니다.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={closeSimulation} className="rounded-lg border border-white/10 py-2 text-xs font-bold text-gray-300">취소</button>
                    <button type="button" onClick={applySimulation} disabled={allocatedPoints <= 0} data-testid="apply-growth-simulation" className="rounded-lg bg-neon-green py-2 text-xs font-extrabold text-dark-bg disabled:opacity-30">{allocatedPoints}포인트 적용</button>
                  </div>
                </div>
              )}
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
              <h3 className="text-sm font-bold text-gray-300">일일 모험 미션 · 매일 오전 6시 갱신</h3>
              <Award size={15} className="text-cyber-yellow" />
            </div>

            {dailyQuests.map((quest) => {
              const isComplete = quest.current >= quest.target;
              const isClaimable = isComplete && !quest.claimed;
              
              return (
                <div
                  key={quest.id}
                  data-testid={`daily-quest-${quest.activity}`}
                  className={`glass-panel border rounded-2xl p-5 flex justify-between items-center transition-all ${
                    quest.claimed ? 'opacity-65 border-white/5' : isClaimable ? 'border-cyber-yellow/40 bg-cyber-yellow/5' : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col gap-1 flex-1 pr-4">
                    <h4 className={`text-sm font-bold ${quest.claimed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {quest.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                      {quest.desc}
                    </p>
                    
                    {/* Progress Slider */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full ${quest.claimed ? 'bg-gray-500' : isComplete ? 'bg-neon-green' : 'bg-cyber-yellow'} transition-all`}
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
                    {quest.claimed ? (
                      <div title="보상 수령 완료" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neon-green">
                        <Check size={14} />
                      </div>
                    ) : isClaimable ? (
                      <button
                        onClick={() => claimDailyQuest(quest.id)}
                        data-testid={`claim-${quest.activity}-reward`}
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
