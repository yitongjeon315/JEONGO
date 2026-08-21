'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import type { RedemptionStatus, RewardRedemptionSummary } from '@/lib/reward-redemption';

const statusLabel: Record<RedemptionStatus, string> = {
  pending: '승인 대기', approved: '발송 대기', sent: '발송 완료', cancelled: '취소',
};

export default function AdminRedemptionsPage() {
  const { authStatus, session } = useApp();
  const [items, setItems] = useState<RewardRedemptionSummary[]>([]);
  const [message, setMessage] = useState('');
  const load = async () => {
    const response = await fetch('/api/rewards/redemptions?scope=all', { cache: 'no-store' });
    if (!response.ok) throw new Error('신청 내역을 불러오지 못했습니다.');
    const data = (await response.json()) as { redemptions: RewardRedemptionSummary[] };
    setItems(data.redemptions);
  };
  useEffect(() => {
    if (session?.role !== 'admin') return;
    let cancelled = false;
    void fetch('/api/rewards/redemptions?scope=all', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('신청 내역을 불러오지 못했습니다.');
        return response.json() as Promise<{ redemptions: RewardRedemptionSummary[] }>;
      })
      .then((data) => { if (!cancelled) setItems(data.redemptions); })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : '신청 내역을 불러오지 못했습니다.'); });
    return () => { cancelled = true; };
  }, [session]);

  if (authStatus === 'loading') return <p className="text-xs text-gray-400">관리자 권한을 확인하고 있습니다…</p>;
  if (session?.role !== 'admin') return <section className="glass-panel rounded-2xl p-6"><p className="text-sm">관리자 권한이 필요합니다.</p><Link href="/login" className="mt-3 inline-block text-neon-cyan">로그인 →</Link></section>;

  const update = async (id: string, status: RedemptionStatus) => {
    setMessage('처리 중…');
    const response = await fetch('/api/rewards/redemptions', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) { setMessage(body.error ?? '상태 변경에 실패했습니다.'); return; }
    await load();
    setMessage('상태를 변경했습니다.');
  };

  return <div className="flex flex-col gap-4" data-testid="redemption-admin">
    <header className="glass-panel rounded-2xl p-5"><Link href="/admin" className="text-[10px] font-bold text-neon-cyan">← 관리자 페이지</Link><h1 className="mt-2 text-lg font-extrabold">현실 보상 신청 관리</h1><p className="mt-1 text-xs text-gray-400">승인 및 실제 발송 후 상태를 기록합니다.</p>{message && <p className="mt-2 text-xs text-cyber-yellow">{message}</p>}</header>
    {items.length === 0 ? <p className="glass-panel rounded-xl p-4 text-xs text-gray-400">신청 내역이 없습니다.</p> : items.map((item) => <article key={item.id} className="glass-panel rounded-xl p-4 text-xs">
      <div className="flex justify-between gap-3"><div><strong>{item.rewardName}</strong><p className="mt-1 text-gray-400">{item.phoneMasked} · {item.cost.toLocaleString()}G</p></div><span className="text-cyber-yellow">{statusLabel[item.status]}</span></div>
      <div className="mt-3 flex gap-2">
        {item.status === 'pending' && <button type="button" onClick={() => void update(item.id, 'approved')} className="rounded-lg bg-neon-cyan px-3 py-2 font-bold text-dark-bg">승인</button>}
        {item.status === 'approved' && <button type="button" onClick={() => void update(item.id, 'sent')} className="rounded-lg bg-neon-green px-3 py-2 font-bold text-dark-bg">발송 완료</button>}
        {(item.status === 'pending' || item.status === 'approved') && <button type="button" onClick={() => void update(item.id, 'cancelled')} className="rounded-lg border border-neon-rose/30 px-3 py-2 text-neon-rose">취소</button>}
      </div>
    </article>)}
  </div>;
}
