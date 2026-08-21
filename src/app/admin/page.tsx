'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, BookOpenCheck, Gift, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getPersonalizedRecommendations } from '@/lib/learning';

interface AdminSummary {
  total: number;
  admins: number;
  learners: number;
  activeSessions: number;
  joinedLast7Days: number;
}

export default function AdminDashboardPage() {
  const { authStatus, session, analytics } = useApp();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState('');
  const recommendations = getPersonalizedRecommendations(analytics);

  useEffect(() => {
    if (session?.role !== 'admin') return;
    let cancelled = false;
    void fetch('/api/admin/members?page=1', { cache: 'no-store' })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { summary?: AdminSummary; error?: string } | null;
        if (!response.ok || !body?.summary) throw new Error(body?.error ?? '운영 통계를 불러오지 못했습니다.');
        if (!cancelled) setSummary(body.summary);
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : '운영 통계를 불러오지 못했습니다.'); });
    return () => { cancelled = true; };
  }, [session]);

  if (authStatus === 'loading') return <AdminLoading />;
  if (session?.role !== 'admin') return <AdminDenied />;

  const personalCards = [
    ['학습 세션', analytics.totalSessions],
    ['정답률', `${analytics.accuracy}%`],
    ['학습일', analytics.studyDays],
    ['연속 학습', `${analytics.currentStreak}일`],
  ];
  const systemCards = [
    ['전체 회원', summary?.total ?? '—'],
    ['활성 세션', summary?.activeSessions ?? '—'],
    ['최근 7일 가입', summary?.joinedLast7Days ?? '—'],
    ['관리자', summary?.admins ?? '—'],
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="admin-dashboard">
      <header className="glass-panel rounded-2xl border-cyber-yellow/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyber-yellow">JEONGO CONTROL</p>
            <h1 className="mt-1 text-xl font-extrabold">관리자 페이지</h1>
            <p className="mt-1 text-xs text-gray-400">{session.name} 관리자 계정으로 운영 현황과 회원·콘텐츠를 관리합니다.</p>
          </div>
          <span className="rounded-xl bg-cyber-yellow/10 p-3 text-cyber-yellow"><ShieldCheck size={24} /></span>
        </div>
        {error && <p className="mt-3 rounded-xl border border-neon-rose/20 bg-neon-rose/10 p-3 text-xs text-neon-rose" role="alert">{error}</p>}
      </header>

      <section aria-labelledby="operations-title">
        <h2 id="operations-title" className="mb-2 text-xs font-bold text-gray-300">운영 도구</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <AdminLink href="/admin/members" icon={Users} title="회원 관리" description="회원 검색·권한·세션 관리" color="cyan" />
          <AdminLink href="/admin/content" icon={BookOpenCheck} title="콘텐츠 관리" description="단어·퀘스트·보상 편집" color="green" />
          <AdminLink href="/admin/redemptions" icon={Gift} title="보상 신청" description="승인·발송·취소 처리" color="yellow" />
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-4" aria-labelledby="service-stats-title">
        <div className="flex items-center gap-2">
          <BarChart3 size={17} className="text-violet-300" />
          <h2 id="service-stats-title" className="text-sm font-bold">서비스 통계</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {systemCards.map(([label, value]) => <Metric key={label} label={String(label)} value={value} />)}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-4" aria-labelledby="personal-stats-title">
        <h2 id="personal-stats-title" className="text-sm font-bold">내 학습 통계</h2>
        <p className="mt-1 text-[10px] text-gray-500">기존 통계 메뉴를 관리자 페이지로 옮겼습니다.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {personalCards.map(([label, value]) => <Metric key={label} label={String(label)} value={value} accent />)}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-3">
            <h3 className="text-xs font-bold">HSK 단계별 숙련도</h3>
            {analytics.masteryByHsk.length === 0 ? <p className="mt-3 text-xs text-gray-500">학습 기록이 아직 없습니다.</p> : analytics.masteryByHsk.map((item) => (
              <div key={item.level} className="mt-3">
                <div className="flex justify-between text-[11px]"><span>{item.level}</span><span>{item.accuracy}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-neon-green" style={{ width: `${item.accuracy}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <h3 className="text-xs font-bold text-neon-cyan">오늘의 추천</h3>
            {recommendations.map((item) => <p key={item} className="mt-2 text-xs text-gray-300">• {item}</p>)}
            <h3 className="mt-4 text-xs font-bold">취약 영역</h3>
            {analytics.weakItems.length === 0 ? <p className="mt-2 text-xs text-gray-500">오답이 쌓이면 우선순위를 표시합니다.</p> : analytics.weakItems.map((item) => (
              <p key={item.label} className="mt-2 flex justify-between text-xs"><span>{item.label}</span><span className="text-neon-rose">{item.count}회</span></p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminLink({ href, icon: Icon, title, description, color }: { href: string; icon: typeof Users; title: string; description: string; color: 'cyan' | 'green' | 'yellow' }) {
  const tones = {
    cyan: 'border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/10',
    green: 'border-neon-green/20 text-neon-green hover:bg-neon-green/10',
    yellow: 'border-cyber-yellow/20 text-cyber-yellow hover:bg-cyber-yellow/10',
  };
  return <Link href={href} className={`glass-panel flex items-center gap-3 rounded-xl border p-3 transition ${tones[color]}`}><Icon size={20} /><span><strong className="block text-xs text-white">{title}</strong><span className="text-[10px] text-gray-400">{description}</span></span></Link>;
}

function Metric({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-gray-400">{label}</p><strong className={`text-lg ${accent ? 'text-neon-cyan' : 'text-white'}`}>{value}</strong></div>;
}

function AdminLoading() {
  return <div className="glass-panel rounded-2xl p-6 text-xs text-gray-400">관리자 권한을 확인하고 있습니다…</div>;
}

function AdminDenied() {
  return <section className="glass-panel rounded-2xl p-6"><h1 className="text-lg font-extrabold">접근할 수 없습니다</h1><p className="mt-2 text-xs text-gray-400">관리자 역할이 부여된 Google 계정이 필요합니다.</p><Link href="/login" className="mt-4 inline-block text-xs font-bold text-neon-cyan">관리자 로그인 →</Link></section>;
}
