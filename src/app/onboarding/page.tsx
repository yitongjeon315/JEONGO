'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BEFORE_JEONGO_URL = process.env.NEXT_PUBLIC_BEFORE_JEONGO_URL ?? 'http://localhost:3002';

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState('자기계발');
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [characterClass, setCharacterClass] = useState('어휘 탐험가');

  const startPlacement = () => {
    sessionStorage.setItem('jeongo_onboarding_preferences', JSON.stringify({ learningGoal: goal, dailyMinutes, characterClass }));
    router.push('/placement');
  };

  return (
    <div className="flex flex-col gap-4" data-testid="onboarding-page">
      <header className="glass-panel rounded-2xl p-5">
        <h1 className="text-lg font-extrabold">첫 모험 설정</h1>
        <p className="mt-1 text-xs text-gray-400">목표를 설정한 뒤 적응형 배치고사로 정확한 시작 단계를 찾습니다.</p>
      </header>
      <section className="glass-panel rounded-2xl p-4">
        <h2 className="text-sm font-bold">학습 목표</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['취업/이직', '여행', '자기계발'].map((item) => <button key={item} type="button" onClick={() => setGoal(item)} className={`rounded-lg border p-2 text-[10px] ${goal === item ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-gray-400'}`}>{item}</button>)}
        </div>
      </section>
      <section className="glass-panel rounded-2xl p-4">
        <h2 className="text-sm font-bold">하루 학습량</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[10, 15, 30].map((minutes) => <button key={minutes} type="button" onClick={() => setDailyMinutes(minutes)} className={`rounded-lg border p-2 text-[10px] ${dailyMinutes === minutes ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-gray-400'}`}>{minutes}분</button>)}
        </div>
      </section>
      <section className="glass-panel rounded-2xl p-4">
        <h2 className="text-sm font-bold">캐릭터 클래스</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['어휘 탐험가', '회화 마법사'].map((item) => <button key={item} type="button" onClick={() => setCharacterClass(item)} className={`rounded-lg border p-3 text-xs ${characterClass === item ? 'border-cyber-yellow bg-cyber-yellow/10 text-cyber-yellow' : 'border-white/10 text-gray-400'}`}>{item}</button>)}
        </div>
      </section>
      <section className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-4 text-xs leading-5 text-gray-300">
        진단은 레벨별 기본 5문항, 최대 30문항입니다. 경계 점수일 때만 3문항이 추가되며 명확히 미달한 단계에서 자동 종료됩니다.
      </section>
      <a href={BEFORE_JEONGO_URL} className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/5 px-4 py-3 text-center text-xs font-bold text-neon-cyan">병음을 처음 배우나요? BEFORE JEONGO 시작</a>
      <button type="button" onClick={startPlacement} className="rounded-xl bg-neon-cyan py-3 text-sm font-extrabold text-dark-bg">설정 저장하고 정밀 진단 시작</button>
      <button type="button" onClick={() => router.push('/home')} className="py-2 text-xs text-gray-500">진단 건너뛰기</button>
    </div>
  );
}
