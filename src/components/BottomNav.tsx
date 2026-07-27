'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Sparkles, Users, Gift } from 'lucide-react';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { label: '홈', path: '/home', icon: Home, color: 'text-neon-rose' },
    { label: '던전', path: '/learn', icon: Swords, color: 'text-neon-green' },
    { label: 'AI튜터', path: '/ai-tutor', icon: Sparkles, color: 'text-neon-cyan' },
    { label: '소셜', path: '/social', icon: Users, color: 'text-sky-400' },
    { label: '상점', path: '/shop', icon: Gift, color: 'text-cyber-yellow' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto glass-panel border-t border-white/10 px-4 py-2 flex justify-around items-center rounded-t-2xl shadow-xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path || (item.path !== '/home' && pathname?.startsWith(item.path));

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
              isActive
                ? 'scale-110 font-bold bg-white/5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon
              size={20}
              className={`transition-colors duration-300 ${
                isActive ? item.color : 'text-gray-400'
              }`}
            />
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
