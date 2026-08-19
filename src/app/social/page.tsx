'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Users, Swords, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LeagueMember } from '@/lib/social';

export default function SocialPage() {
  const { stats, activeLeague, guildInfo, contributeToGuild, session } = useApp();
  const [activeTab, setActiveTab] = useState<'league' | 'guild'>('league');
  const [attackEffect, setAttackEffect] = useState(false);

  const sampleLeagueMembers: LeagueMember[] = [
    { rank: 1, name: '베이징짜장', level: 12, xp: 2450, status: 'promote' },
    { rank: 2, name: '중드매니아', level: 9, xp: 1980, status: 'promote' },
    { rank: 3, name: '나 (학습자)', level: stats.level, xp: stats.xp + (stats.level * 100), status: 'current', isUser: true },
    { rank: 4, name: '성조마술사', level: 6, xp: 1120, status: 'keep' },
    { rank: 5, name: '낙타도령', level: 5, xp: 750, status: 'demote' },
    { rank: 6, name: '왕초보탈출', level: 3, xp: 320, status: 'demote' }
  ];

  const sampleGuildMembers = [
    { name: '길드마스터 (김만두)', rank: 'Master', contrib: 1200, status: 'online' },
    { name: '나 (학습자)', rank: 'Member', contrib: guildInfo.contribution, status: 'online', isUser: true },
    { name: '훠궈빌런', rank: 'Member', contrib: 450, status: 'offline' },
    { name: '중국어독학러', rank: 'Member', contrib: 180, status: 'online' }
  ];
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>(sampleLeagueMembers);
  const [guildMembers, setGuildMembers] = useState(sampleGuildMembers);
  const [serverGuild, setServerGuild] = useState<typeof guildInfo | null>(null);
  const [hasGuild, setHasGuild] = useState(false);
  const [guildRecommendations, setGuildRecommendations] = useState<Array<{ id: string; name: string; level: number; memberCount: number }>>([]);
  const [socialError, setSocialError] = useState('');
  const displayedGuild = serverGuild ?? guildInfo;

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void fetch('/api/social', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('SOCIAL_LOOKUP_FAILED');
      const data = (await response.json()) as {
        leagueMembers: LeagueMember[];
        guild?: { name: string; level: number; exp: number; expNeeded: number; bossHp: number; bossMaxHp: number };
        guildMembers: Array<{ name: string; contribution: number; isUser?: boolean }>;
        recommendations: Array<{ id: string; name: string; level: number; memberCount: number }>;
      };
      if (cancelled) return;
      setLeagueMembers(data.leagueMembers);
      setHasGuild(Boolean(data.guild));
      setServerGuild(data.guild ? { ...data.guild, contribution: data.guildMembers.find((member) => member.isUser)?.contribution ?? 0 } : null);
      setGuildRecommendations(data.recommendations);
      setGuildMembers(data.guildMembers.map((member) => ({ name: member.isUser ? '나 (학습자)' : member.name, rank: 'Member', contrib: member.contribution, status: 'online', isUser: member.isUser })));
      setSocialError('');
    }).catch(() => {
      if (!cancelled) setSocialError('서버 소셜 정보를 불러오지 못해 연습용 데이터를 표시합니다.');
    });
    return () => { cancelled = true; };
  }, [session]);

  const joinGuild = async (guildId: string) => {
    const response = await fetch('/api/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'join', guildId }) });
    if (!response.ok) { const body = (await response.json()) as { error?: string }; setSocialError(body.error ?? '길드에 가입하지 못했습니다.'); return; }
    window.location.reload();
  };

  const leaveGuild = async () => {
    const response = await fetch('/api/social', { method: 'DELETE' });
    if (!response.ok) { const body = (await response.json()) as { error?: string }; setSocialError(body.error ?? '길드에서 탈퇴하지 못했습니다.'); return; }
    setHasGuild(false); setServerGuild(null); setGuildMembers([]);
  };

  const handleGuildContribution = async () => {
    if (stats.gold < 100 || !session) {
      setSocialError(!session ? '길드 공동 레이드는 로그인이 필요합니다.' : '골드가 부족합니다.');
      return;
    }
    const response = await fetch('/api/social', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gold: 100 }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setSocialError(body.error ?? '길드 기여를 저장하지 못했습니다.');
      return;
    }
    
    // Attack effect trigger
    setAttackEffect(true);
    contributeToGuild(100);
    setServerGuild((current) => current ? { ...current, exp: current.exp + 50, contribution: current.contribution + 100, bossHp: Math.max(0, current.bossHp - 300) } : current);
    
    setTimeout(() => {
      setAttackEffect(false);
    }, 1000);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('league')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'league' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          주간 리그 (League)
        </button>
        <button
          onClick={() => setActiveTab('guild')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'guild' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          길드 보스 레이드 (Guild)
        </button>
      </div>
      {socialError && <p role="status" className="rounded-xl border border-cyber-yellow/20 bg-cyber-yellow/10 p-2 text-[10px] text-cyber-yellow">{socialError}</p>}

      <AnimatePresence mode="wait">
        {/* League Tab */}
        {activeTab === 'league' ? (
          <motion.div
            key="league"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-4"
          >
            {/* League info panel */}
            <div className="glass-panel border-cyber-yellow/20 rounded-2xl p-4 flex flex-col gap-2 bg-gradient-to-r from-cyber-yellow/5 to-transparent">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-cyber-yellow flex items-center gap-1.5">
                  <Trophy size={16} />
                  현재 소속: {activeLeague}
                </span>
                <span className="text-[9px] text-gray-400 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  시즌 마감: 2일 14시간 남음
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">
                일주일에 한 번씩 누적 XP에 따라 상위 2명은 3급 골드 리그로 승급하고 하위 2명은 브론즈 리그로 강등됩니다.
              </p>
            </div>

            {/* Leaderboard */}
            <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow">
              <div className="flex flex-col">
                {/* Header */}
                <div className="flex justify-between bg-white/5 px-4 py-2 text-[10px] font-bold text-gray-400 tracking-wider">
                  <span>순위 & 유저 정보</span>
                  <span>누적 주간 XP</span>
                </div>
                
                {/* Rows */}
                {leagueMembers.map((member) => {
                  const isPromotion = member.status === 'promote';
                  const isDemotion = member.status === 'demote';
                  
                  return (
                    <div
                      key={member.rank}
                      className={`flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0 transition-all ${
                        member.isUser ? 'bg-neon-cyan/5 border-y border-neon-cyan/15' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-xs font-extrabold w-5 text-center text-gray-400">
                          {getRankBadge(member.rank)}
                        </span>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold flex items-center gap-1.5 ${member.isUser ? 'text-neon-cyan' : 'text-white'}`}>
                            {member.name}
                            {isPromotion && (
                              <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.1 border border-neon-green/20 rounded font-bold flex items-center gap-0.5">
                                <ArrowUp size={8} /> 승급권
                              </span>
                            )}
                            {isDemotion && (
                              <span className="text-[8px] bg-neon-rose/10 text-neon-rose px-1.5 py-0.1 border border-neon-rose/20 rounded font-bold flex items-center gap-0.5">
                                <ArrowDown size={8} /> 강등권
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-gray-500 font-medium">Lv.{member.level} 모험가</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-gray-300">
                        {member.xp.toLocaleString()} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Guild Tab */
          <motion.div
            key="guild"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-4"
          >
            {!session ? <div className="glass-panel rounded-2xl p-5 text-center text-xs text-gray-400">길드 가입과 공동 레이드는 로그인 후 이용할 수 있습니다.</div> : !hasGuild ? <section className="glass-panel rounded-2xl p-4">
              <h3 className="text-sm font-extrabold">가입할 길드를 선택하세요</h3>
              <p className="mt-1 text-[10px] text-gray-400">길드는 언제든 탈퇴하거나 다른 길드로 옮길 수 있습니다.</p>
              {guildRecommendations.map((guild) => <div key={guild.id} className="mt-3 flex items-center justify-between rounded-xl border border-white/10 p-3"><div><strong className="text-xs">{guild.name}</strong><p className="text-[9px] text-gray-500">Lv.{guild.level} · {guild.memberCount}명</p></div><button type="button" onClick={() => void joinGuild(guild.id)} className="rounded-lg bg-neon-cyan px-3 py-2 text-[10px] font-bold text-dark-bg">가입</button></div>)}
            </section> : <>
            {/* Guild General Info */}
            <div className="glass-panel border-white/10 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Users size={16} className="text-neon-cyan" />
                  {displayedGuild.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  길드 등급: Lv.{displayedGuild.level} | 기여도 공헌: {displayedGuild.contribution}G
                </p>
              </div>
              <div className="text-right flex flex-col gap-1 w-24">
                <div className="text-[8px] text-gray-500 font-bold">길드 경험치</div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-neon-cyan rounded-full transition-all"
                    style={{ width: `${(displayedGuild.exp / displayedGuild.expNeeded) * 100}%` }}
                  />
                </div>
                <button type="button" onClick={() => void leaveGuild()} className="mt-2 text-[8px] text-gray-500 hover:text-neon-rose">길드 탈퇴</button>
              </div>
            </div>

            {/* Guild Boss Raid Panel */}
            <div className={`glass-panel border-red-500/10 rounded-2xl p-5 flex flex-col items-center bg-gradient-to-br from-red-950/15 to-transparent relative overflow-hidden transition-all ${
              attackEffect ? 'scale-[0.98] border-neon-rose/40' : ''
            }`}>
              {/* Boss Character Visual */}
              <div className={`text-6xl mb-4 relative ${attackEffect ? 'animate-bounce' : 'animate-float'}`}>
                👹
                {attackEffect && (
                  <motion.div
                    initial={{ opacity: 1, scale: 0.5 }}
                    animate={{ opacity: [1, 1, 0], scale: [1, 1.8, 2], y: -50 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 font-extrabold text-base text-cyber-yellow"
                  >
                    💥 -300 BOSS DMG!
                  </motion.div>
                )}
              </div>

              <div className="w-full flex flex-col gap-1.5 items-center">
                <span className="text-[9px] font-bold text-neon-rose uppercase tracking-wider">주간 월드 보스</span>
                <h4 className="text-xs font-bold text-white">사천성 마라 마왕 (Spicy Satan)</h4>
                
                {/* Boss Health Bar */}
                <div className="w-full mt-2 flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400">보스 체력 (HP)</span>
                  <span className="text-neon-rose">{displayedGuild.bossHp.toLocaleString()} / {displayedGuild.bossMaxHp.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-neon-rose transition-all duration-300"
                    style={{ width: `${(displayedGuild.bossHp / displayedGuild.bossMaxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Button: Raid Attack */}
              <button
                onClick={handleGuildContribution}
                disabled={stats.gold < 100 || displayedGuild.bossHp <= 0 || !session}
                className={`w-full mt-5 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  stats.gold < 100 || displayedGuild.bossHp <= 0 || !session
                    ? 'bg-white/5 border border-white/5 text-gray-500'
                    : 'bg-neon-rose hover:bg-rose-500 text-white shadow-lg shadow-neon-rose/20 hover:scale-105 active:scale-95'
                }`}
              >
                <Swords size={16} />
                {displayedGuild.bossHp <= 0 ? '보스 퇴치 완료!' : !session ? '로그인 후 공동 레이드 참여' : '보스 습격 (기여: 100G 투척)'}
              </button>
            </div>

            {/* Guild Member List */}
            <div className="glass-panel border-white/5 rounded-2xl p-4 flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-gray-400 px-1">소속 길드원 공헌도 순위</h4>
              <hr className="border-white/5" />
              <div className="flex flex-col gap-2">
                {guildMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-neon-green shadow-[0_0_6px_#10b981]' : 'bg-gray-600'}`} />
                      <span className={`font-semibold ${member.isUser ? 'text-neon-cyan' : 'text-white'}`}>{member.name}</span>
                      <span className="text-[8px] bg-white/5 border border-white/10 px-1 py-0.1 text-gray-400 rounded">
                        {member.rank}
                      </span>
                    </div>
                    <span className="font-extrabold text-gray-300">
                      {member.contrib.toLocaleString()} G 기여
                    </span>
                  </div>
                ))}
              </div>
            </div>
            </>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
