'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Flame, Coins, Sparkles } from 'lucide-react';

const Header = () => {
  const { stats } = useApp();

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
    <header className="sticky top-0 z-40 max-w-md mx-auto glass-panel border-b border-white/10 px-4 py-3 flex flex-col gap-2 rounded-b-2xl shadow-md">
      <div className="flex justify-between items-center">
        {/* User Profile Avatar & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/15 flex items-center justify-center text-2xl relative shadow-inner">
            {getAvatarEmoji(stats.avatarSkin)}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neon-rose text-[10px] font-bold flex items-center justify-center border border-dark-bg text-white">
              {stats.level}
            </span>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white/90">학습자님</h2>
            <p className="text-[10px] text-gray-400 font-medium">{getSkinName(stats.avatarSkin)}</p>
          </div>
        </div>

        {/* Currency & Streak Status */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-neon-rose/10 border border-neon-rose/20 px-2.5 py-1 rounded-full text-neon-rose font-bold text-xs glow-rose">
            <Flame size={14} className="fill-current animate-pulse" />
            <span>{stats.streak}일</span>
          </div>
          
          {/* Gold */}
          <div className="flex items-center gap-1.5 bg-cyber-yellow/10 border border-cyber-yellow/20 px-2.5 py-1 rounded-full text-cyber-yellow font-bold text-xs glow-yellow animate-float">
            <Coins size={14} className="fill-current" />
            <span>{stats.gold.toLocaleString()}G</span>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[9px] font-bold text-gray-400">XP</span>
        <div className="flex-1 h-2 rounded-full bg-white/10 border border-white/5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <span className="text-[9px] font-semibold text-gray-300 w-10 text-right">
          {stats.xp}/{stats.xpNeeded}
        </span>
      </div>
    </header>
  );
};

export default Header;
