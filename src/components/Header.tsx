'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowUpRight, Coins, Flame, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

const BEFORE_JEONGO_URL = process.env.NEXT_PUBLIC_BEFORE_JEONGO_URL ?? 'http://localhost:3002';

const Header = () => {
  const pathname = usePathname();
  const { stats, session } = useApp();

  if (pathname === '/vocab-book') return null;

  // Calculate XP percentage
  const xpPercent = Math.min(100, Math.max(0, (stats.xp / stats.xpNeeded) * 100));

  // Avatar lookup
  const getAvatarEmoji = (skinId: string) => {
    switch (skinId) {
      case 'shaolin_monk': return '🥋';
      case 'cyber_punk': return '🎧';
      case 'emperor': return '👑';
      default: return '🎒';
    }
  };

  const getSkinName = (skinId: string) => {
    switch (skinId) {
      case 'shaolin_monk': return '소림사 수도승';
      case 'cyber_punk': return '사이버 무사';
      case 'emperor': return '황제';
      default: return '기본 탐험가';
    }
  };

  return (
    <header className="sticky top-0 z-40 max-w-md md:max-w-4xl xl:max-w-6xl w-full mx-auto glass-panel border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3.5 flex flex-col gap-2 rounded-b-2xl shadow-md">
      <div className="flex justify-between items-center gap-2">
        {/* User Profile Avatar & Info */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/15 flex items-center justify-center text-xl sm:text-2xl relative shadow-inner">
            {getAvatarEmoji(stats.avatarSkin)}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neon-rose text-[11px] font-bold flex items-center justify-center border border-dark-bg text-white">
              {stats.level}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-sm font-bold text-white/90">
                {session?.name || '학습자님'}
              </h2>
              {session?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold transition ${
                    pathname?.startsWith('/admin')
                      ? 'border-cyber-yellow/60 bg-cyber-yellow text-dark-bg'
                      : 'border-cyber-yellow/35 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/20'
                  }`}
                  aria-label="관리자 페이지로 이동"
                >
                  <ShieldCheck size={11} />
                  관리자
                </Link>
              )}
            </div>
            <p className="hidden min-[370px]:block text-xs text-gray-400 font-medium truncate">{getSkinName(stats.avatarSkin)}</p>
          </div>
        </div>

        {/* Currency & Streak Status */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1 bg-neon-rose/10 border border-neon-rose/20 px-2 sm:px-3 py-1.5 rounded-full text-neon-rose font-bold text-xs sm:text-sm glow-rose">
            <Flame size={15} className="fill-current animate-pulse" />
            <span>{stats.streak}일</span>
          </div>
          
          {/* Gold */}
          <div className="flex items-center gap-1 bg-cyber-yellow/10 border border-cyber-yellow/20 px-2 sm:px-3 py-1.5 rounded-full text-cyber-yellow font-bold text-xs sm:text-sm glow-yellow">
            <Coins size={15} className="fill-current" />
            <span>{stats.gold.toLocaleString()}G</span>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs font-bold text-gray-400">XP</span>
        <div className="flex-1 h-2.5 rounded-full bg-white/10 border border-white/5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-300 w-12 text-right">
          {stats.xp}/{stats.xpNeeded}
        </span>
      </div>

      {pathname === '/home' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={BEFORE_JEONGO_URL}
            className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-neon-cyan/30 bg-gradient-to-r from-neon-cyan/15 via-cyan-400/10 to-violet-500/15 px-3 py-2 shadow-sm transition hover:border-neon-cyan/55 hover:bg-neon-cyan/15 active:scale-[0.99]"
            aria-label="BEFORE JEONGO 병음 입문 앱 열기"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/15 text-neon-cyan">
                <Sparkles size={18} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs font-extrabold text-white sm:text-sm">BEFORE JEONGO</strong>
                <span className="block truncate text-[10px] text-cyan-100/70">병음이 처음이라면 여기서 시작</span>
              </span>
            </span>
            <ArrowUpRight size={15} className="shrink-0 text-neon-cyan transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>

          <a
            href="/topic/index.html"
            className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-sky-300/25 bg-gradient-to-r from-sky-500/15 via-cyan-400/10 to-violet-500/15 px-3 py-2 shadow-sm transition hover:border-sky-300/45 hover:bg-sky-400/15 active:scale-[0.99]"
            aria-label="한국어 TOPIK 학습 서비스 열기"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-300/15 text-sky-200">
                <GraduationCap size={18} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs font-extrabold text-white sm:text-sm">한국어 TOPIK 학습</strong>
                <span className="block truncate text-[10px] text-sky-100/70">TOPIK 수업과 실전 연습 열기</span>
              </span>
            </span>
            <ArrowUpRight size={15} className="shrink-0 text-sky-200 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
