'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Gift, Coins, ShoppingBag, CheckCircle2, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RedemptionStatus, RewardRedemptionSummary } from '@/lib/reward-redemption';

const redemptionStatusLabel: Record<RedemptionStatus, string> = {
  pending: '승인 대기', approved: '발송 대기', sent: '발송 완료', cancelled: '취소',
};

interface RewardItem {
  id: string;
  name: string;
  image: string;
  cost: number;
  desc: string;
}

export default function ShopPage() {
  const { stats, skins, buySkin, equipSkin, spendGold, contentCatalog, recordLearningEvent, session } = useApp();
  const [activeTab, setActiveTab] = useState<'items' | 'rewards'>('items');
  
  // Reality Exchange modal state
  const [exchangeTarget, setExchangeTarget] = useState<RewardItem | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isExchangeSuccess, setIsExchangeSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExchangePending, setIsExchangePending] = useState(false);
  const [redemptions, setRedemptions] = useState<RewardRedemptionSummary[]>([]);
  const exchangeRequestKeyRef = useRef('');

  const skinsList = [
    { id: 'default_explorer', name: '기본 탐험가 복장', emoji: '🎒', cost: 0, desc: '중국 성조 던전에 갓 입문한 초보 개척자의 기본 복장.' },
    { id: 'shaolin_monk', name: '소림사 수도승 승복', emoji: '🥋', cost: 1000, desc: '어휘 암기 고행을 극복한 성자에게 어울리는 고고한 황토 승복.' },
    { id: 'cyber_punk', name: '사이버 펑크 아머', emoji: '🎧', cost: 1800, desc: '첨단 음성 센서와 보이스 네온 마스크가 장착된 스피킹 스페셜 슈트.' },
    { id: 'emperor', name: '한나라 황제 곤룡포', emoji: '👑', cost: 3000, desc: 'HSK 던전을 완전히 마스터하고 왕좌에 올라선 최고 정점의 복식.' }
  ];

  const rewardsList = contentCatalog.rewards;

  const loadRedemptions = async () => {
    if (!session) return;
    const response = await fetch('/api/rewards/redemptions', { cache: 'no-store' });
    if (!response.ok) return;
    const data = (await response.json()) as { redemptions: RewardRedemptionSummary[] };
    setRedemptions(data.redemptions);
  };

  useEffect(() => {
    if (activeTab !== 'rewards' || !session) return;
    let cancelled = false;
    void fetch('/api/rewards/redemptions', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ redemptions: RewardRedemptionSummary[] }> : { redemptions: [] })
      .then((data) => { if (!cancelled) setRedemptions(data.redemptions); });
    return () => { cancelled = true; };
  }, [activeTab, session]);

  const handlePurchaseSkin = (skinId: string, cost: number) => {
    const success = buySkin(skinId, cost);
    if (!success) {
      alert('골드가 부족합니다! 던전을 플레이해 더 많은 골드를 획득하십시오.');
    }
  };

  const startExchangeFlow = (reward: RewardItem) => {
    if (!session) {
      alert('현실 보상 환전은 개인정보와 신청 내역 보호를 위해 로그인이 필요합니다.');
      return;
    }
    if (stats.gold < reward.cost) {
      alert('골드가 부족하여 환전 신청을 하실 수 없습니다.');
      return;
    }
    setExchangeTarget(reward);
    setPhoneNumber('');
    setIsExchangeSuccess(false);
    setErrorMsg('');
    exchangeRequestKeyRef.current = crypto.randomUUID();
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeTarget) return;
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMsg('올바른 전화번호를 입력해 주십시오 (예: 01012345678).');
      return;
    }

    setIsExchangePending(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/rewards/redemptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rewardId: exchangeTarget.id,
          phoneNumber,
          idempotencyKey: exchangeRequestKeyRef.current,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setErrorMsg(body.error ?? '환전 신청을 저장하지 못했습니다.');
        return;
      }
      const success = spendGold(exchangeTarget.cost);
      if (!success) {
        setErrorMsg('서버 신청은 저장되었지만 화면의 골드 동기화가 지연되고 있습니다. 새로고침해 주세요.');
        return;
      }
      recordLearningEvent({ type: 'reward', correct: 0, total: 0, xp: 0, gold: -exchangeTarget.cost, weakItems: [exchangeTarget.name] });
      await loadRedemptions();
      setIsExchangeSuccess(true);
    } catch {
      setErrorMsg('네트워크에 연결하지 못했습니다. 골드는 차감되지 않았습니다.');
    } finally {
      setIsExchangePending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'items' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          게임 장비/스킨 상점 (Skins)
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative ${
            activeTab === 'rewards' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
          }`}
        >
          현실 보상 환전소 (Rewards)
          <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-cyber-yellow animate-ping" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Skins Tab */}
        {activeTab === 'items' ? (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-3.5"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-gray-400">장착용 아바타 수집 코스튬</span>
              <ShoppingBag size={14} className="text-neon-cyan" />
            </div>

            {skinsList.map((skin) => {
              const isOwned = skins.owned.includes(skin.id);
              const isEquipped = skins.equipped === skin.id;

              return (
                <div
                  key={skin.id}
                  className={`glass-panel border rounded-2xl p-4 flex gap-4 items-center transition-all ${
                    isEquipped ? 'border-neon-cyan/40 bg-neon-cyan/5' : 'border-white/10'
                  }`}
                >
                  <div className="text-4xl bg-white/5 w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center shrink-0">
                    {skin.emoji}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {skin.name}
                      {isEquipped && (
                        <span className="text-[8px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 px-1.5 py-0.2 rounded font-bold">
                          장착 중
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                      {skin.desc}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <div className="px-3 py-1.5 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg text-[10px] font-bold">
                        활성화됨
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => equipSkin(skin.id)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-lg text-[10px] font-bold hover:scale-105 active:scale-95 transition-all"
                      >
                        장착하기
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchaseSkin(skin.id, skin.cost)}
                        disabled={stats.gold < skin.cost}
                        className={`px-3 py-1.5 font-extrabold rounded-lg text-[10px] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all ${
                          stats.gold < skin.cost
                            ? 'bg-white/5 border border-white/5 text-gray-500'
                            : 'bg-cyber-yellow text-dark-bg shadow-lg shadow-cyber-yellow/20'
                        }`}
                      >
                        <Coins size={12} />
                        {skin.cost.toLocaleString()}G
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* Reality Rewards Tab */
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-3.5"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-gray-400">골드를 실물 쿠폰으로 환전</span>
              <Gift size={14} className="text-cyber-yellow" />
            </div>

            {rewardsList.map((reward) => (
              <div
                key={reward.id}
                className="glass-panel border border-white/10 rounded-2xl p-4 flex gap-4 items-center"
              >
                <div className="text-4xl bg-white/5 w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center shrink-0">
                  {reward.image}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-white">{reward.name}</h4>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                    {reward.desc}
                  </p>
                </div>

                <button
                  onClick={() => startExchangeFlow(reward)}
                  disabled={stats.gold < reward.cost || !session}
                  className={`px-3.5 py-2 font-extrabold rounded-xl text-[10px] flex flex-col items-center justify-center gap-0.5 hover:scale-105 active:scale-95 transition-all ${
                    stats.gold < reward.cost || !session
                      ? 'bg-white/5 border border-white/5 text-gray-500'
                      : 'bg-gradient-to-r from-cyber-yellow to-yellow-500 text-dark-bg shadow-lg shadow-cyber-yellow/20'
                  }`}
                >
                  <span>환전 신청</span>
                  <span className="text-[8px] opacity-80">{reward.cost.toLocaleString()}G</span>
                </button>
              </div>
            ))}
            {session && <section className="glass-panel rounded-2xl p-4">
              <h3 className="text-xs font-bold">내 환전 신청 내역</h3>
              {redemptions.length === 0 ? <p className="mt-2 text-[10px] text-gray-500">아직 신청 내역이 없습니다.</p> : redemptions.map((item) => <div key={item.id} className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[10px]">
                <div><strong className="text-white">{item.rewardName}</strong><p className="mt-0.5 text-gray-500">{item.phoneMasked} · {new Date(item.createdAt).toLocaleDateString('ko-KR')}</p></div>
                <span className={item.status === 'sent' ? 'text-neon-green' : item.status === 'cancelled' ? 'text-neon-rose' : 'text-cyber-yellow'}>{redemptionStatusLabel[item.status]}</span>
              </div>)}
            </section>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exchange Confirmation Modal */}
      <AnimatePresence>
        {exchangeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel border-white/15 w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden"
            >
              {!isExchangeSuccess ? (
                <>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <PhoneCall size={16} className="text-cyber-yellow" />
                    현실 모상 환전소 신청
                  </h3>
                  <hr className="border-white/5" />
                  
                  <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                    <span className="text-3xl">{exchangeTarget.image}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">{exchangeTarget.name}</span>
                      <span className="text-[10px] text-cyber-yellow font-bold">차감 비용: {exchangeTarget.cost.toLocaleString()} Gold</span>
                    </div>
                  </div>

                  <form onSubmit={handleExchangeSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 px-1">기프티콘 수신 휴대전화 번호 (- 없이 입력)</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="01012345678"
                        className="w-full bg-dark-bg/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-cyber-yellow transition-colors"
                      />
                      {errorMsg && <p className="text-[9px] text-neon-rose font-bold px-1 mt-0.5">{errorMsg}</p>}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setExchangeTarget(null)}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs transition-colors"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={isExchangePending}
                        className="flex-1 py-2.5 bg-cyber-yellow hover:bg-yellow-500 text-dark-bg font-extrabold rounded-xl text-xs shadow-lg shadow-cyber-yellow/20 transition-all disabled:opacity-50"
                      >
                        {isExchangePending ? '신청 저장 중…' : '결제 및 신청'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center py-6 text-center gap-3">
                  <CheckCircle2 size={48} className="text-neon-green glow-green" />
                  <h4 className="text-sm font-bold text-white">기프티콘 환전 신청 완료!</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed px-4 font-medium">
                    골드 차감과 신청 저장이 완료되었습니다. 관리자 승인 및 발송 상태는 서버 신청 내역에 안전하게 보관됩니다.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
