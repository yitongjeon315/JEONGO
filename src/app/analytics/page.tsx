'use client';

import { useApp } from '@/context/AppContext';
import { getPersonalizedRecommendations } from '@/lib/learning';

export default function AnalyticsPage() {
  const { analytics } = useApp();
  const recommendations = getPersonalizedRecommendations(analytics);
  const cards = [
    ['학습 세션', analytics.totalSessions], ['정답률', `${analytics.accuracy}%`], ['학습일', analytics.studyDays], ['연속 학습', `${analytics.currentStreak}일`],
  ];
  return <div className="flex flex-col gap-4" data-testid="analytics-page">
    <div className="glass-panel rounded-2xl p-5"><h1 className="text-lg font-extrabold">학습 통계 & 개인화</h1><p className="text-xs text-gray-400 mt-1">일·주·누적 학습 데이터를 기준으로 다음 학습을 추천합니다.</p></div>
    <div className="grid grid-cols-2 gap-3">{cards.map(([label, value]) => <div key={label} className="glass-panel rounded-xl p-4"><p className="text-[10px] text-gray-400">{label}</p><strong className="text-xl text-neon-cyan">{value}</strong></div>)}</div>
    <section className="glass-panel rounded-2xl p-4"><h2 className="text-sm font-bold">HSK 단계별 숙련도</h2>{analytics.masteryByHsk.length === 0 ? <p className="text-xs text-gray-500 mt-3">학습 기록이 아직 없습니다.</p> : analytics.masteryByHsk.map((item) => <div key={item.level} className="mt-3"><div className="flex justify-between text-[11px]"><span>{item.level}</span><span>{item.accuracy}%</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-neon-green" style={{ width: `${item.accuracy}%` }} /></div></div>)}</section>
    <section className="glass-panel rounded-2xl p-4"><h2 className="text-sm font-bold">취약 영역</h2>{analytics.weakItems.length === 0 ? <p className="text-xs text-gray-500 mt-3">오답이 쌓이면 우선순위를 표시합니다.</p> : analytics.weakItems.map((item) => <p key={item.label} className="text-xs mt-2 flex justify-between"><span>{item.label}</span><span className="text-neon-rose">{item.count}회</span></p>)}</section>
    <section className="glass-panel rounded-2xl p-4 border-neon-cyan/20"><h2 className="text-sm font-bold text-neon-cyan">오늘의 추천</h2>{recommendations.map((item) => <p key={item} className="text-xs text-gray-300 mt-2">• {item}</p>)}</section>
  </div>;
}
