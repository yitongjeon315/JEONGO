'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLACEMENT_BASE_QUESTIONS, PLACEMENT_TIE_BREAKERS, type PlacementQuestion } from '@/data/placement-questions';
import { useApp } from '@/context/AppContext';
import { classifyPlacementLevel, evaluatePlacement, type PlacementAnswer, type PlacementResult } from '@/lib/learning';

const DOMAIN_LABELS = {
  vocabulary: '어휘',
  grammar: '문법',
  reading: '독해',
  listening: '듣기',
} as const;

function questionsForLevel(source: PlacementQuestion[], level: number) {
  return source.filter((question) => question.hskLevel === level);
}

export default function PlacementPage() {
  const { savePlacementResult } = useApp();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [phase, setPhase] = useState<'base' | 'tie-breaker'>('base');
  const [queue, setQueue] = useState(() => questionsForLevel(PLACEMENT_BASE_QUESTIONS, 1));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [notice, setNotice] = useState('HSK 1부터 차례로 실력을 확인합니다.');
  const [result, setResult] = useState<PlacementResult | null>(null);

  const question = queue[questionIndex];

  const finish = (completedAnswers: PlacementAnswer[]) => {
    let onboardingPreferences: Pick<PlacementResult, 'learningGoal' | 'dailyMinutes' | 'characterClass'> = {};
    try {
      onboardingPreferences = JSON.parse(sessionStorage.getItem('jeongo_onboarding_preferences') ?? '{}') as typeof onboardingPreferences;
    } catch {
      onboardingPreferences = {};
    }
    const placement = { ...evaluatePlacement(completedAnswers), ...onboardingPreferences };
    sessionStorage.removeItem('jeongo_onboarding_preferences');
    savePlacementResult(placement);
    setAnswers(completedAnswers);
    setResult(placement);
  };

  const startLevel = (level: number) => {
    setCurrentLevel(level);
    setPhase('base');
    setQueue(questionsForLevel(PLACEMENT_BASE_QUESTIONS, level));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setQuestionStartedAt(Date.now());
    setNotice(`HSK ${level} 기본 진단 5문항을 시작합니다.`);
  };

  const submitAnswer = () => {
    if (!question || selectedAnswer === null) return;
    const completedAnswers = [
      ...answers,
      {
        hskLevel: question.hskLevel,
        word: question.word,
        domain: question.domain,
        correct: selectedAnswer === question.answer,
        durationMs: Date.now() - questionStartedAt,
      },
    ];
    setAnswers(completedAnswers);

    if (questionIndex < queue.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelectedAnswer(null);
      setQuestionStartedAt(Date.now());
      return;
    }

    const levelAnswers = completedAnswers.filter((answer) => answer.hskLevel === currentLevel);
    if (phase === 'base' && classifyPlacementLevel(levelAnswers) === 'borderline') {
      setPhase('tie-breaker');
      setQueue(questionsForLevel(PLACEMENT_TIE_BREAKERS, currentLevel));
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setQuestionStartedAt(Date.now());
      setNotice(`HSK ${currentLevel} 경계 점수입니다. 보강 3문항으로 판정 신뢰도를 높입니다.`);
      return;
    }

    const passed = levelAnswers.filter((answer) => answer.correct).length / levelAnswers.length >= 0.7;
    if (passed && currentLevel < 6) {
      startLevel(currentLevel + 1);
      return;
    }
    finish(completedAnswers);
  };

  const playAudio = () => {
    if (!question?.audioText || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.audioText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const reset = () => {
    setAnswers([]);
    setResult(null);
    startLevel(1);
  };

  if (result) {
    return (
      <div className="flex flex-col gap-4" data-testid="placement-result">
        <header className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-xs font-bold text-neon-cyan">적응형 진단 완료</p>
          <h1 className="mt-2 text-3xl font-black">권장 HSK {result.level}</h1>
          <p className="mt-2 text-sm text-gray-400">총 {result.totalQuestions}문항 · 종합 정답률 {result.score}% · 판정 신뢰도 {result.confidence}%</p>
        </header>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-extrabold">영역별 정확도</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {result.domainScores?.map((domain) => (
              <div key={domain.domain} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-400">{DOMAIN_LABELS[domain.domain]}</p>
                <p className={`mt-1 text-xl font-black ${domain.accuracy < 70 ? 'text-cyber-yellow' : 'text-neon-green'}`}>{domain.accuracy}%</p>
                <p className="text-[10px] text-gray-500">{domain.correct}/{domain.total} 정답</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-extrabold">단계별 판정</h2>
          <div className="mt-3 flex flex-col gap-2">
            {result.levelScores?.map((item) => (
              <div key={item.level} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs">
                <span>HSK {item.level} · {item.correct}/{item.total}</span>
                <span className={item.status === 'pass' ? 'text-neon-green' : item.status === 'borderline' ? 'text-cyber-yellow' : 'text-red-400'}>
                  {item.status === 'pass' ? '통과' : item.status === 'borderline' ? '경계' : '미통과'} · {item.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {result.weakWords.length > 0 && (
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-extrabold">우선 복습 항목</h2>
            <p className="mt-2 text-xs leading-6 text-gray-400">{result.weakWords.join(' · ')}</p>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={reset} className="rounded-xl border border-white/15 py-3 text-xs font-bold">다시 진단하기</button>
          <Link href="/home" className="rounded-xl bg-neon-cyan py-3 text-center text-xs font-extrabold text-dark-bg">추천 단계로 시작</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="placement-page">
      <header className="glass-panel rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-neon-cyan">레벨 진단</p>
            <h1 className="mt-1 text-xl font-black">적응형 HSK 배치고사</h1>
          </div>
          <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-bold text-neon-cyan">HSK {currentLevel}</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-400">레벨마다 기본 5문항을 풀며, 55~69% 경계 점수에는 3문항이 추가됩니다. 70% 이상이면 다음 단계로 진행하고 미달하면 진단을 종료합니다.</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all" style={{ width: `${Math.min(100, ((answers.length + 1) / 30) * 100)}%` }} />
        </div>
        <p className="mt-2 text-[10px] text-gray-500">응답 {answers.length}문항 · 최대 기본 30문항{phase === 'tie-breaker' ? ' · 현재 보강 진단' : ''}</p>
      </header>

      <div className="rounded-xl border border-cyber-yellow/20 bg-cyber-yellow/5 px-4 py-3 text-xs text-cyber-yellow" role="status">{notice}</div>

      {question && (
        <fieldset className="glass-panel rounded-2xl p-5">
          <legend className="sr-only">HSK {currentLevel} {DOMAIN_LABELS[question.domain]} 문항</legend>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-400">{DOMAIN_LABELS[question.domain]} · {phase === 'base' ? `기본 ${questionIndex + 1}/5` : `보강 ${questionIndex + 1}/3`}</span>
            <span className="text-gray-500">문항 {answers.length + 1}</span>
          </div>
          <h2 className="mt-5 text-base font-extrabold leading-7">{question.prompt}</h2>
          {question.audioText && (
            <button type="button" onClick={playAudio} className="mt-4 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-3 text-xs font-bold text-neon-cyan" aria-label="중국어 음성 듣기">
              ▶ 중국어 음성 듣기
            </button>
          )}
          <div className="mt-5 grid gap-3">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                data-testid="placement-option"
                data-correct={option === question.answer ? 'true' : 'false'}
                aria-pressed={selectedAnswer === option}
                onClick={() => setSelectedAnswer(option)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${selectedAnswer === option ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/25'}`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-testid="placement-submit"
            disabled={selectedAnswer === null}
            onClick={submitAnswer}
            className="mt-5 w-full rounded-xl bg-neon-cyan py-3 text-sm font-extrabold text-dark-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            답안 제출
          </button>
        </fieldset>
      )}
    </div>
  );
}
