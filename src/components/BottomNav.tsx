'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Sparkles, Users, Gift, BarChart3 } from 'lucide-react';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { label: '홈', path: '/home', icon: Home, color: 'text-neon-rose' },
    { label: '던전', path: '/learn', icon: Swords, color: 'text-neon-green' },
    { label: 'AI튜터', path: '/ai-tutor', icon: Sparkles, color: 'text-neon-cyan' },
    { label: '소셜', path: '/social', icon: Users, color: 'text-sky-400' },
    { label: '상점', path: '/shop', icon: Gift, color: 'text-cyber-yellow' },
    { label: '통계', path: '/analytics', icon: BarChart3, color: 'text-violet-400' },
  ];

  return (
    <nav className="relative z-50 shrink-0 w-full glass-panel border-t border-white/10 px-1.5 sm:px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-6 items-center rounded-t-2xl shadow-xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path || (item.path !== '/home' && pathname?.startsWith(item.path));

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 py-1 px-0.5 sm:px-2 rounded-xl transition-all duration-300 ${
              isActive
                ? 'font-bold bg-white/5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon
              size={20}
              className={`transition-colors duration-300 ${
                isActive ? item.color : 'text-gray-400'
              }`}
            />
            <span className="max-w-full truncate text-[10px] min-[370px]:text-[11px] tracking-tight sm:tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
