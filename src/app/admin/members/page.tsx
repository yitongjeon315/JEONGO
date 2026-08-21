'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface MemberSummary {
  total: number;
  admins: number;
  learners: number;
  activeSessions: number;
  joinedLast7Days: number;
}

interface Member {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'admin';
  createdAt: string;
  googleLinked: boolean;
  gold: number;
  xp: number;
  level: number;
  activeSessions: number;
  lastSnapshotAt: string | null;
}

interface MembersResponse {
  summary: MemberSummary;
  members: Member[];
  pagination: { page: number; pageSize: number; total: number };
  currentUserId: string;
}

type PendingAction = { member: Member; action: 'set_role'; role: 'learner' | 'admin' } | { member: Member; action: 'revoke_sessions' };

export default function AdminMembersPage() {
  const { authStatus, session } = useApp();
  const [data, setData] = useState<MembersResponse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/members?page=${page}&q=${encodeURIComponent(search)}`, { cache: 'no-store' });
      const body = (await response.json().catch(() => null)) as MembersResponse & { error?: string } | null;
      if (!response.ok || !body) throw new Error(body?.error ?? '회원 정보를 불러오지 못했습니다.');
      setData(body);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '회원 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (session?.role !== 'admin') return;
    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, session]);

  if (authStatus === 'loading') return <p className="text-xs text-gray-400">관리자 권한을 확인하고 있습니다…</p>;
  if (session?.role !== 'admin') return <section className="glass-panel rounded-2xl p-6"><p className="text-sm">관리자 권한이 필요합니다.</p><Link href="/login" className="mt-3 inline-block text-neon-cyan">로그인 →</Link></section>;

  const mutate = async () => {
    if (!pendingAction) return;
    setLoading(true);
    setMessage('');
    try {
      const payload = pendingAction.action === 'set_role'
        ? { action: pendingAction.action, userId: pendingAction.member.id, role: pendingAction.role }
        : { action: pendingAction.action, userId: pendingAction.member.id };
      const response = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? '회원 정보를 변경하지 못했습니다.');
      setMessage(pendingAction.action === 'set_role' ? '회원 권한을 변경하고 기존 세션을 종료했습니다.' : '회원의 로그인 세션을 종료했습니다.');
      setPendingAction(null);
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '회원 정보를 변경하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / (data?.pagination.pageSize ?? 25)));

  return (
    <div className="flex flex-col gap-4" data-testid="member-admin">
      <header className="glass-panel rounded-2xl p-5">
        <Link href="/admin" className="text-[10px] font-bold text-neon-cyan">← 관리자 페이지</Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div><h1 className="text-lg font-extrabold">회원 관리</h1><p className="mt-1 text-xs text-gray-400">Google 회원을 검색하고 권한과 로그인 세션을 안전하게 관리합니다.</p></div>
          <Users className="text-neon-cyan" />
        </div>
        {message && <p className={`mt-3 rounded-xl p-3 text-xs ${message.includes('했습니다') ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-rose/10 text-neon-rose'}`} role="status">{message}</p>}
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Summary label="전체 회원" value={data?.summary.total} />
        <Summary label="학습자" value={data?.summary.learners} />
        <Summary label="관리자" value={data?.summary.admins} />
        <Summary label="활성 세션" value={data?.summary.activeSessions} />
        <Summary label="7일 신규" value={data?.summary.joinedLast7Days} />
      </div>

      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} className="glass-panel flex gap-2 rounded-xl p-2">
        <label className="sr-only" htmlFor="member-search">회원 검색</label>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/5 px-3"><Search size={15} className="text-gray-500" /><input id="member-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={80} placeholder="이름 또는 이메일 검색" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none" /></div>
        <button type="submit" disabled={loading} className="rounded-lg bg-neon-cyan px-4 text-xs font-bold text-dark-bg disabled:opacity-50">검색</button>
      </form>

      <section className="flex flex-col gap-2" aria-label="회원 목록">
        {loading && !data ? <p className="glass-panel rounded-xl p-4 text-xs text-gray-400">회원 정보를 불러오는 중…</p> : data?.members.length === 0 ? <p className="glass-panel rounded-xl p-4 text-xs text-gray-400">검색된 회원이 없습니다.</p> : data?.members.map((member) => {
          const isSelf = member.id === data.currentUserId;
          return <article key={member.id} className="glass-panel rounded-xl p-4 text-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`rounded-xl p-2 ${member.role === 'admin' ? 'bg-cyber-yellow/10 text-cyber-yellow' : 'bg-white/5 text-gray-400'}`}>{member.role === 'admin' ? <ShieldCheck size={18} /> : <UserRound size={18} />}</span>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><strong className="truncate text-sm">{member.name}</strong>{isSelf && <span className="rounded-full bg-neon-cyan/10 px-2 py-0.5 text-[9px] font-bold text-neon-cyan">내 계정</span>}<span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${member.role === 'admin' ? 'bg-cyber-yellow/10 text-cyber-yellow' : 'bg-white/5 text-gray-400'}`}>{member.role === 'admin' ? '관리자' : '학습자'}</span></div><p className="mt-1 truncate text-[10px] text-gray-500">{member.email}</p></div>
              </div>
              <div className="text-right text-[10px] text-gray-500"><p>Lv.{member.level} · {member.xp.toLocaleString()} XP · {member.gold.toLocaleString()}G</p><p className="mt-1">활성 세션 {member.activeSessions} · {member.googleLinked ? 'Google 연결' : 'Google 미연결'}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
              <button type="button" disabled={loading || isSelf} onClick={() => setPendingAction({ member, action: 'set_role', role: member.role === 'admin' ? 'learner' : 'admin' })} className="rounded-lg border border-cyber-yellow/25 px-3 py-2 text-[10px] font-bold text-cyber-yellow disabled:cursor-not-allowed disabled:opacity-30">{member.role === 'admin' ? '학습자로 변경' : '관리자 지정'}</button>
              <button type="button" disabled={loading || isSelf || member.activeSessions === 0} onClick={() => setPendingAction({ member, action: 'revoke_sessions' })} className="inline-flex items-center gap-1 rounded-lg border border-neon-rose/25 px-3 py-2 text-[10px] font-bold text-neon-rose disabled:cursor-not-allowed disabled:opacity-30"><KeyRound size={12} /> 세션 종료</button>
              <span className="ml-auto text-[9px] text-gray-600">가입 {new Date(member.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
          </article>;
        })}
      </section>

      {pendingAction && <div className="glass-panel sticky bottom-2 z-20 rounded-xl border border-cyber-yellow/25 p-3 shadow-2xl"><p className="text-xs"><strong>{pendingAction.member.name}</strong> 회원의 {pendingAction.action === 'set_role' ? `권한을 ${pendingAction.role === 'admin' ? '관리자' : '학습자'}로 변경` : '모든 로그인 세션을 종료'}할까요?</p><p className="mt-1 text-[10px] text-gray-500">관리 작업은 감사 로그에 기록됩니다.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => void mutate()} disabled={loading} className="rounded-lg bg-cyber-yellow px-4 py-2 text-xs font-bold text-dark-bg disabled:opacity-50">확인</button><button type="button" onClick={() => setPendingAction(null)} disabled={loading} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-300">취소</button></div></div>}

      <div className="flex items-center justify-between text-xs"><button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">이전</button><span className="text-gray-500">{page} / {totalPages}</span><button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">다음</button></div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: number }) {
  return <div className="glass-panel rounded-xl p-3"><p className="text-[9px] text-gray-500">{label}</p><strong className="text-lg text-white">{value ?? '—'}</strong></div>;
}
