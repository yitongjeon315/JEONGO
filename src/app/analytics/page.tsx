'use client';

import Link from 'next/link';
import { BarChart3, CalendarDays, Flame, Target, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getPersonalizedRecommendations } from '@/lib/learning';

export default function AnalyticsPage() {
  const { analytics } = useApp();
  const recommendations = getPersonalizedRecommendations(analytics);
  const metrics = [
    { label: '학습 세션', value: analytics.totalSessions, icon: Trophy },
    { label: '정답률', value: `${analytics.accuracy}%`, icon: Target },
    { label: '학습일', value: analytics.studyDays, icon: CalendarDays },
    { label: '연속 학습', value: `${analytics.currentStreak}일`, icon: Flame },
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="analytics-page">
      <header className="glass-panel rounded-2xl border-violet-400/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-300">LEARNING ANALYTICS</p>
            <h1 className="mt-1 text-xl font-extrabold">내 학습 통계</h1>
            <p className="mt-1 text-xs text-gray-400">학습 기록을 바탕으로 성장 흐름과 복습 우선순위를 확인합니다.</p>
          </div>
          <span className="rounded-xl bg-violet-400/10 p-3 text-violet-300"><BarChart3 size={24} /></span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="학습 요약">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-panel rounded-xl p-3">
            <Icon size={15} className="mb-2 text-neon-cyan" />
            <p className="text-[10px] text-gray-400">{label}</p>
            <strong className="text-lg text-white">{value}</strong>
          </div>
        ))}
      </section>

      <section className="glass-panel rounded-2xl p-4" aria-labelledby="mastery-title">
        <h2 id="mastery-title" className="text-sm font-bold">HSK 단계별 숙련도</h2>
        {analytics.masteryByHsk.length === 0 ? (
          <p className="mt-3 text-xs text-gray-500">학습 세션을 완료하면 단계별 숙련도가 표시됩니다.</p>
        ) : analytics.masteryByHsk.map((item) => (
          <div key={item.level} className="mt-3">
            <div className="flex justify-between text-[11px]"><span>{item.level}</span><span>{item.accuracy}%</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-neon-green" style={{ width: `${item.accuracy}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="text-sm font-bold text-neon-cyan">오늘의 추천</h2>
          {recommendations.map((item) => <p key={item} className="mt-2 text-xs leading-relaxed text-gray-300">• {item}</p>)}
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="text-sm font-bold">취약 영역</h2>
          {analytics.weakItems.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">오답이 쌓이면 우선 복습할 항목을 표시합니다.</p>
          ) : analytics.weakItems.map((item) => (
            <p key={item.label} className="mt-2 flex justify-between text-xs"><span>{item.label}</span><span className="text-neon-rose">{item.count}회</span></p>
          ))}
        </div>
      </section>

      <Link href="/home" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-bold text-gray-300">홈으로 돌아가기</Link>
    </div>
  );
}
