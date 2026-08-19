'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flame, Heart, Headphones, LockKeyhole, Play, RotateCcw, Shield, Sparkles, Star, Trophy, Volume2, Zap } from 'lucide-react';
import { playMandarinTone, speakChinese } from '@/lib/browser-speech';

const STORAGE_KEY = 'jeongo_pinyin_bridge_v1';
const JEONGO_URL = process.env.NEXT_PUBLIC_JEONGO_URL ?? 'http://localhost:3001';

type Phase = 'map' | 'tones' | 'pinyin' | 'words' | 'boss' | 'complete';

const tones = [
  { pinyin: 'mā', hanzi: '妈', label: '1성', hint: '높고 평평하게', gesture: '—', color: 'tone-1', meaning: '엄마' },
  { pinyin: 'má', hanzi: '麻', label: '2성', hint: '아래에서 위로', gesture: '↗', color: 'tone-2', meaning: '삼베' },
  { pinyin: 'mǎ', hanzi: '马', label: '3성', hint: '낮췄다가 올리기', gesture: '↘↗', color: 'tone-3', meaning: '말' },
  { pinyin: 'mà', hanzi: '骂', label: '4성', hint: '짧고 강하게', gesture: '↘', color: 'tone-4', meaning: '꾸짖다' },
];

const firstWords = [
  { hanzi: '你', pinyin: 'nǐ', korean: '너, 당신', formula: 'n + i + 3성', emoji: '👋' },
  { hanzi: '好', pinyin: 'hǎo', korean: '좋다', formula: 'h + ao + 3성', emoji: '✨' },
  { hanzi: '我', pinyin: 'wǒ', korean: '나', formula: 'w + o + 3성', emoji: '🙋' },
  { hanzi: '是', pinyin: 'shì', korean: '~이다', formula: 'sh + i + 4성', emoji: '✅' },
];

const pinyinLessons = [
  { hanzi: '妈', pinyin: 'mā', initial: 'm', final: 'a', tone: '1성', korean: '엄마', koreanSound: '마—', hint: '입술을 닫았다 열며 m, 크게 a' },
  { hanzi: '你', pinyin: 'nǐ', initial: 'n', final: 'i', tone: '3성', korean: '너, 당신', koreanSound: '니↘↗', hint: '혀끝으로 n, 입꼬리를 당겨 i' },
  { hanzi: '好', pinyin: 'hǎo', initial: 'h', final: 'ao', tone: '3성', korean: '좋다', koreanSound: '하오↘↗', hint: '목에서 h, a에서 o로 움직여 ao' },
  { hanzi: '是', pinyin: 'shì', initial: 'sh', final: 'i', tone: '4성', korean: '~이다', koreanSound: '스↘', hint: '혀를 말아 sh, 짧은 i' },
];

const initialChoices = ['m', 'n', 'h', 'sh'];
const finalChoices = ['a', 'i', 'ao', 'ou'];
const initialGuides: Record<string, string> = { m: 'ㅁ과 비슷', n: 'ㄴ과 비슷', h: 'ㅎ과 비슷', sh: '혀를 말아 쉬' };
const finalGuides: Record<string, string> = { a: '아', i: '이', ao: '아오', ou: '오우' };

const quiz = [
  { prompt: '“너, 당신”이라는 뜻의 소리는?', answer: 'nǐ', options: ['nǐ', 'hǎo', 'shì'], enemy: '혼돈 슬라임' },
  { prompt: '성모 h와 운모 ao를 조립한 병음은?', answer: 'hǎo', options: ['hǎo', 'nǐ', 'mā'], enemy: '조립 고블린' },
  { prompt: '높고 평평하게 유지하는 성조는?', answer: '1성', options: ['1성', '2성', '4성'], enemy: '성조 박쥐' },
  { prompt: '“你好”를 읽는 병음은?', answer: 'nǐ hǎo', options: ['nǐ hǎo', 'wǒ shì', 'mā má'], enemy: '침묵의 용' },
];

const phaseOrder: Phase[] = ['map', 'tones', 'pinyin', 'words', 'boss', 'complete'];

export default function PinyinGamePage() {
  const [phase, setPhase] = useState<Phase>('map');
  const [heardTones, setHeardTones] = useState<string[]>([]);
  const [pinyinRound, setPinyinRound] = useState(0);
  const [selectedInitial, setSelectedInitial] = useState('');
  const [selectedFinal, setSelectedFinal] = useState('');
  const [pinyinCleared, setPinyinCleared] = useState<string[]>([]);
  const [builderFeedback, setBuilderFeedback] = useState('');
  const [showBuilderHint, setShowBuilderHint] = useState(true);
  const [heardWords, setHeardWords] = useState<string[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [xp, setXp] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [audioNotice, setAudioNotice] = useState('');
  const [voiceLabel, setVoiceLabel] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { completed?: boolean; xp?: number; bestCombo?: number } | null;
      if (saved?.completed) {
        setXp(saved.xp ?? 180);
        setBestCombo(saved.bestCombo ?? 3);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [phase]);

  const phaseIndex = phaseOrder.indexOf(phase);
  const progress = phase === 'complete' ? 100 : Math.max(0, phaseIndex) * 20;
  const bossHp = useMemo(() => Math.max(0, 100 - quizIndex * 25 - (feedback.startsWith('정답') ? 25 : 0)), [quizIndex, feedback]);
  const currentPinyin = pinyinLessons[pinyinRound];

  const play = async (hanzi: string, id: string, kind: 'tone' | 'word', toneIndex?: number) => {
    const played = kind === 'tone' && toneIndex !== undefined
      ? await playMandarinTone(toneIndex)
      : await speakChinese(hanzi);
    if (played.ok) {
      setAudioNotice('');
      setVoiceLabel(played.voiceName ?? '중국어 표준 음성');
    } else {
      setVoiceLabel('');
      setAudioNotice(played.reason === 'voice-unavailable'
        ? '정확한 중국 본토 표준어(zh-CN) 음성을 찾지 못해 재생을 중단했습니다. 기기의 중국어 음성 팩을 설치해 주세요.'
        : '이 브라우저에서는 음성 재생을 사용할 수 없습니다.');
    }
    if (!played.ok) return;
    if (kind === 'tone') {
      setHeardTones((current) => {
        if (current.includes(id)) return current;
        setXp((value) => value + 5);
        return [...current, id];
      });
    } else {
      setHeardWords((current) => {
        if (current.includes(id)) return current;
        setXp((value) => value + 5);
        return [...current, id];
      });
    }
  };

  const assemblePinyin = async () => {
    if (!selectedInitial || !selectedFinal || builderFeedback.startsWith('정답')) return;
    const correct = selectedInitial === currentPinyin.initial && selectedFinal === currentPinyin.final;
    if (!correct) {
      setBuilderFeedback(`괜찮아요! 빛나는 ${currentPinyin.initial}와 ${currentPinyin.final} 블록을 눌러보세요.`);
      setCombo(0);
      return;
    }

    setBuilderFeedback(`정답! ${currentPinyin.initial} + ${currentPinyin.final} = ${currentPinyin.pinyin}`);
    setPinyinCleared((current) => {
      if (current.includes(currentPinyin.pinyin)) return current;
      setXp((value) => value + 10);
      setCombo((value) => value + 1);
      return [...current, currentPinyin.pinyin];
    });
    const played = await speakChinese(currentPinyin.hanzi);
    if (played.ok) {
      setAudioNotice('');
      setVoiceLabel(played.voiceName ?? '중국어 표준 음성');
    }
  };

  const nextPinyinRound = () => {
    if (pinyinRound >= pinyinLessons.length - 1) return;
    setPinyinRound((value) => value + 1);
    setSelectedInitial('');
    setSelectedFinal('');
    setBuilderFeedback('');
    setShowBuilderHint(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitQuiz = () => {
    if (!selectedAnswer || feedback) return;
    const isCorrect = selectedAnswer === quiz[quizIndex].answer;
    const nextScore = correctAnswers + (isCorrect ? 1 : 0);
    const nextCombo = isCorrect ? combo + 1 : 0;
    if (isCorrect) {
      setCorrectAnswers(nextScore);
      setCombo(nextCombo);
      setBestCombo((value) => Math.max(value, nextCombo));
      setXp((value) => value + 30 + combo * 5);
      setFeedback(combo >= 1 ? `정답! ${nextCombo} COMBO · 크리티컬!` : '정답! 보스에게 34 피해');
    } else {
      setHearts((value) => Math.max(0, value - 1));
      setCombo(0);
      setFeedback(`아쉬워요! 정답은 ${quiz[quizIndex].answer}`);
    }

    window.setTimeout(() => {
      if (quizIndex < quiz.length - 1) {
        setQuizIndex((value) => value + 1);
        setSelectedAnswer(null);
        setFeedback('');
        return;
      }
      const finalXp = xp + (isCorrect ? 30 + combo * 5 : 0) + 50;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: true, score: nextScore, step: 5, xp: finalXp, bestCombo: Math.max(bestCombo, nextCombo) }));
      setXp(finalXp);
      setPhase('complete');
      setFeedback('');
    }, 850);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPhase('map'); setHeardTones([]); setPinyinRound(0); setSelectedInitial(''); setSelectedFinal(''); setPinyinCleared([]); setBuilderFeedback(''); setShowBuilderHint(true); setHeardWords([]); setQuizIndex(0); setSelectedAnswer(null);
    setCorrectAnswers(0); setXp(0); setHearts(5); setCombo(0); setBestCombo(0); setFeedback('');
  };

  return (
    <div className="game-shell" data-testid="pinyin-start-page">
      <header className="game-topbar">
        <button type="button" className="game-brand" onClick={() => phase !== 'complete' && setPhase('map')} aria-label="성조 퀘스트 홈">
          <span className="brand-orb">声</span><span><small>BEFORE JEONGO</small>성조 퀘스트 · 중국어 소리 첫걸음</span>
        </button>
        <div className="player-stats" aria-label="플레이어 상태">
          <span><Flame size={16} /> 7일</span><span><Heart size={16} fill="currentColor" /> {hearts}</span><span><Zap size={16} /> {xp} XP</span>
        </div>
      </header>

      {phase !== 'map' && phase !== 'complete' && (
        <div className="mission-progress" aria-label={`모험 진행률 ${progress}%`}>
          <button type="button" onClick={() => setPhase('map')} aria-label="모험 지도로 돌아가기"><ArrowLeft size={17} /></button>
          <div><span style={{ width: `${progress}%` }} /></div>
          <strong>{progress}%</strong>
        </div>
      )}

      {audioNotice && <p className="notice" role="status">{audioNotice}</p>}
      {voiceLabel && <p className="voice-status" role="status"><Volume2 size={13} /> 재생 음원: {voiceLabel}</p>}

      {phase === 'map' && (
        <main className="game-grid">
          <section className="quest-hero">
            <div className="level-chip"><Sparkles size={14} /> 오늘의 모험 · 5분</div>
            <h1>중국어 소리를<br /><em>내 편</em>으로 만들어라!</h1>
            <p>듣고, 맞히고, 콤보를 쌓으세요. 지루한 암기 대신 성조 몬스터를 물리치며 병음을 익힙니다.</p>
            <button type="button" className="start-quest" onClick={() => setPhase('tones')}>
              <span className="play-icon"><Play size={20} fill="currentColor" /></span>
              <span><strong>소리부터 시작하기</strong><small>첫 성조 던전 입장</small></span><span className="reward">+20 XP</span>
            </button>
          </section>

          <aside className="daily-card">
            <div className="daily-head"><span><Shield size={16} /> 일일 미션</span><strong>2 / 3</strong></div>
            <div className="player-level"><div className="level-badge">Lv.1</div><div><small>칭호</small><strong>소리 탐험가</strong></div></div>
            <div className="xp-track"><span style={{ width: `${Math.min(100, xp / 2)}%` }} /></div>
            <ul>
              <li className="done"><Check size={14} /> 앱에 접속하기 <b>+5 XP</b></li>
              <li className="done"><Check size={14} /> 성조 1회 듣기 <b>+5 XP</b></li>
              <li><span>○</span> 성조 보스 쓰러뜨리기 <b>+50 XP</b></li>
            </ul>
            <div className="streak-note"><Flame size={20} /> <span><strong>7일 연속 학습 중!</strong><small>내일도 오면 보물 상자 해금</small></span></div>
          </aside>

          <section className="world-map" aria-label="학습 스테이지">
            <div className="section-title"><div><small>WORLD 01</small><h2>병음 모험 지도</h2></div><span>2 / 4 해금</span></div>
            <div className="stage-track">
              <button type="button" className="stage-card active" onClick={() => setPhase('tones')}><span className="stage-number">01</span><span className="stage-icon">🎵</span><span><strong>성조 정글</strong><small>네 가지 높낮이를 구별해요</small></span><span className="stars"><Star size={13} fill="currentColor" /><Star size={13} /><Star size={13} /></span></button>
              <button type="button" className="stage-card active" onClick={() => setPhase('pinyin')}><span className="stage-number">02</span><span className="stage-icon">🧩</span><span><strong>병음 조립소</strong><small>성모 + 운모를 직접 결합</small></span><span className="stars"><Star size={13} /><Star size={13} /><Star size={13} /></span></button>
              <article className="stage-card locked"><LockKeyhole size={18} /><div><strong>단어 보물섬</strong><small>실전 단어 수집</small></div></article>
              <article className="stage-card locked"><LockKeyhole size={18} /><div><strong>성조 보스전</strong><small>최종 듣기 대결</small></div></article>
            </div>
          </section>
        </main>
      )}

      {phase === 'tones' && (
        <main className="battle-layout">
          <section className="lesson-panel">
            <div className="lesson-kicker"><span>STAGE 01</span><b>성조 정글</b></div>
            <h1>‘마’ 몬스터 4종을<br />모두 깨워보세요</h1>
            <p>카드를 눌러 소리를 듣고, 선의 움직임을 손가락으로 따라 해보세요.</p>
            <div className="tone-card-grid">
              {tones.map((tone, toneIndex) => {
                const heard = heardTones.includes(tone.pinyin);
                return <button key={tone.pinyin} type="button" onClick={() => play(tone.hanzi, tone.pinyin, 'tone', toneIndex)} data-testid="tone-audio" className={`tone-battle-card ${tone.color} ${heard ? 'is-heard' : ''}`}>
                  <span className="tone-status">{heard ? <Check size={15} /> : <Volume2 size={15} />}</span>
                  <span className="tone-gesture">{tone.gesture}</span><strong>{tone.pinyin}</strong><span className="hanzi">{tone.hanzi}</span>
                  <small>{tone.label} · {tone.hint}</small><em>{tone.meaning}</em>
                </button>;
              })}
            </div>
            <p className="audio-credit">성조 녹음: Peter Isotalo · <a href="https://commons.wikimedia.org/wiki/File:Zh-pinyin_tones_with_ma.ogg" target="_blank" rel="noreferrer">Wikimedia Commons, CC BY 3.0</a></p>
            <button type="button" disabled={heardTones.length < tones.length} onClick={() => setPhase('pinyin')} className="next-stage">병음 조립소 열기 <span>+20 XP</span><ArrowRight size={18} /></button>
          </section>
          <aside className="battle-side"><div className="enemy-orb">◉‿◉</div><small>정글의 문지기</small><strong>마마몬</strong><div className="enemy-hp"><span style={{ width: `${100 - heardTones.length * 25}%` }} /></div><p>{heardTones.length === 4 ? '완벽해요! 길이 열렸습니다.' : `${4 - heardTones.length}마리의 소리를 더 깨우세요.`}</p><div className="combo-box"><Zap size={17} /><span><small>수집한 XP</small><strong>+{heardTones.length * 5}</strong></span></div></aside>
        </main>
      )}

      {phase === 'pinyin' && (
        <main className="battle-layout pinyin-layout" data-testid="pinyin-builder">
          <section className="lesson-panel">
            <div className="lesson-kicker"><span>STAGE 02</span><b>병음 조립소</b></div>
            <h1>성모와 운모를<br />직접 조립하세요</h1>
            <p>한자를 읽는 문제가 아닙니다. 먼저 완성 소리를 보고, 빛나는 <b>성모</b>와 <b>운모</b> 블록을 그대로 따라 누르세요.</p>

            <div className="pinyin-target">
              <div className="target-pinyin">{currentPinyin.pinyin}</div>
              <div><small>오늘 배울 소리 · {pinyinRound + 1}/{pinyinLessons.length}</small><strong>{currentPinyin.korean}</strong><p>한국어로 가깝게: <b>{currentPinyin.koreanSound}</b></p></div>
              <span>{currentPinyin.tone}</span>
              <div className="hanzi-reference"><small>한자는 참고만</small><b>{currentPinyin.hanzi}</b><em>지금 외우지 않아도 돼요</em></div>
            </div>

            <div className={`guided-formula ${showBuilderHint ? 'hint-open' : ''}`}>
              <span>{showBuilderHint ? '힌트가 열렸어요' : '먼저 직접 나눠보세요'}</span>
              {showBuilderHint ? <><strong>{currentPinyin.initial}</strong><i>+</i><strong>{currentPinyin.final}</strong><i>→</i><b>{currentPinyin.pinyin}</b><small>{currentPinyin.hint}</small></> : <><strong>?</strong><i>+</i><strong>?</strong><i>→</i><b>{currentPinyin.pinyin}</b><button type="button" className="hint-toggle" onClick={() => setShowBuilderHint(true)}>힌트 보기</button></>}
            </div>

            <div className="sound-bank">
              <div>
                <div className="bank-title"><b>1</b><span><strong>성모</strong><small>음절의 첫소리</small></span></div>
                <div className="sound-options">{initialChoices.map((initial) => <button key={initial} type="button" data-testid="initial-choice" data-value={initial} className={showBuilderHint && initial === currentPinyin.initial ? 'is-guide' : ''} aria-label={`성모 ${initial} 선택`} aria-pressed={selectedInitial === initial} onClick={() => { setSelectedInitial(initial); setBuilderFeedback(''); }}><strong>{initial}</strong><small>{selectedInitial === initial ? '✓ 선택됨' : `${initialGuides[initial]}${showBuilderHint && initial === currentPinyin.initial ? ' · 힌트' : ''}`}</small></button>)}</div>
              </div>
              <div>
                <div className="bank-title"><b>2</b><span><strong>운모</strong><small>성모 뒤에 오는 소리</small></span></div>
                <div className="sound-options">{finalChoices.map((final) => <button key={final} type="button" data-testid="final-choice" data-value={final} className={showBuilderHint && final === currentPinyin.final ? 'is-guide' : ''} aria-label={`운모 ${final} 선택`} aria-pressed={selectedFinal === final} onClick={() => { setSelectedFinal(final); setBuilderFeedback(''); }}><strong>{final}</strong><small>{selectedFinal === final ? '✓ 선택됨' : `${finalGuides[final]}${showBuilderHint && final === currentPinyin.final ? ' · 힌트' : ''}`}</small></button>)}</div>
              </div>
            </div>

            <div className={`assembly-tray ${builderFeedback.startsWith('정답') ? 'is-correct' : ''}`}>
              <div className="assembly-slots"><span>{selectedInitial || '?'}</span><i>+</i><span>{selectedFinal || '?'}</span><i>=</i><strong>{builderFeedback.startsWith('정답') ? currentPinyin.pinyin : `${selectedInitial}${selectedFinal}` || '?'}</strong></div>
              <p>{builderFeedback || '두 블록을 골라 병음을 완성하세요.'}</p>
              {builderFeedback.startsWith('정답')
                ? pinyinRound < pinyinLessons.length - 1 && <button type="button" onClick={nextPinyinRound}>다음 조립 <ArrowRight size={16} /></button>
                : <button type="button" data-testid="assemble-pinyin" disabled={!selectedInitial || !selectedFinal} onClick={assemblePinyin}>조립하기 <Zap size={16} /></button>}
            </div>

            <div className="lesson-actions"><button type="button" onClick={() => setPhase('tones')} aria-label="이전 단계"><ArrowLeft size={18} /></button><button type="button" disabled={pinyinCleared.length < pinyinLessons.length} onClick={() => setPhase('words')} className="next-stage">단어 보물섬으로 <span>4개 완성</span><ArrowRight size={18} /></button></div>
          </section>
          <aside className="battle-side pinyin-side">
            <div className="pinyin-machine">{selectedInitial || '声'}<span>+</span>{selectedFinal || '韵'}</div>
            <small>병음 에너지</small><strong>{pinyinCleared.length} / {pinyinLessons.length} 조립</strong>
            <div className="enemy-hp"><span style={{ width: `${pinyinCleared.length * 25}%` }} /></div>
            <div className="built-list">{pinyinLessons.map((lesson) => <span key={lesson.pinyin} className={pinyinCleared.includes(lesson.pinyin) ? 'done' : ''}>{pinyinCleared.includes(lesson.pinyin) ? lesson.pinyin : '?'}</span>)}</div>
            <p>{pinyinCleared.length === pinyinLessons.length ? '병음 조립 완료! 단어 보물섬이 열렸어요.' : '성모와 운모를 붙여 네 개의 병음을 완성하세요.'}</p>
          </aside>
        </main>
      )}

      {phase === 'words' && (
        <main className="battle-layout">
          <section className="lesson-panel">
            <div className="lesson-kicker"><span>STAGE 03</span><b>단어 보물섬</b></div>
            <h1>첫 단어 보물<br />4개를 수집하세요</h1>
            <p>한자보다 소리를 먼저 듣고 병음 조각을 살펴보세요.</p>
            <div className="word-card-grid">
              {firstWords.map((word) => {
                const heard = heardWords.includes(word.pinyin);
                return <button key={word.pinyin} type="button" onClick={() => play(word.hanzi, word.pinyin, 'word')} data-testid="word-audio" className={`word-loot-card ${heard ? 'is-collected' : ''}`}>
                  <span className="loot-emoji">{heard ? '💎' : word.emoji}</span><span className="hanzi">{word.hanzi}</span><strong>{word.pinyin}</strong><small>{word.korean}</small><em>{word.formula}</em>
                </button>;
              })}
            </div>
            <button type="button" className="tone-pair" onClick={() => play('你好', 'nǐ hǎo', 'word')}><Headphones size={18} /><span><small>성조 변화 · 표기는 3성+3성, 실제 소리는 2성+3성</small><strong>你好 <b>nǐ hǎo → ní hǎo</b></strong></span><Volume2 size={18} /></button>
            <div className="lesson-actions"><button type="button" onClick={() => setPhase('pinyin')} aria-label="이전 단계"><ArrowLeft size={18} /></button><button type="button" disabled={heardWords.length < firstWords.length} onClick={() => setPhase('boss')} className="next-stage">확인 문제 풀기 <span>보스전</span><ArrowRight size={18} /></button></div>
          </section>
          <aside className="battle-side treasure"><div className="treasure-box">{heardWords.length === 4 ? '🎁' : '🧰'}</div><small>단어 보물 상자</small><strong>{heardWords.length} / 4 수집</strong><div className="enemy-hp"><span style={{ width: `${heardWords.length * 25}%` }} /></div><p>{heardWords.length === 4 ? '보물 상자 오픈! 보스 열쇠 획득.' : '모든 단어를 들으면 보스 열쇠가 나타나요.'}</p></aside>
        </main>
      )}

      {phase === 'boss' && (
        <main className="boss-layout" data-testid="pinyin-checkpoint">
          <section className="boss-stage">
            <div className="boss-top"><span>FINAL BOSS · {quizIndex + 1}/{quiz.length}</span><div className="boss-hp-label"><b>{quiz[quizIndex].enemy}</b><span>HP {bossHp}</span></div><div className="boss-hp-track"><span style={{ width: `${bossHp}%` }} /></div></div>
            <div className={`boss-creature ${feedback.startsWith('정답') ? 'hit' : ''}`}><span>{quizIndex === 2 ? '🐲' : quizIndex === 1 ? '🦇' : '🟣'}</span><small>{feedback || '정답을 골라 공격하세요!'}</small></div>
          </section>
          <section className="quiz-panel">
            <div className="quiz-meta"><span><Heart size={15} fill="currentColor" /> {hearts}</span><span><Zap size={15} /> {combo} COMBO</span></div>
            <h2>{quiz[quizIndex].prompt}</h2>
            <div className="quiz-options">{quiz[quizIndex].options.map((option, index) => <button key={option} type="button" data-correct={!feedback && option === quiz[quizIndex].answer ? 'true' : 'false'} aria-pressed={selectedAnswer === option} onClick={() => !feedback && setSelectedAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
            <button type="button" disabled={!selectedAnswer || !!feedback} onClick={submitQuiz} data-testid="pinyin-quiz-submit" className="attack-button">{feedback ? '공격 성공!' : '선택하고 공격하기'} <Zap size={18} fill="currentColor" /></button>
          </section>
        </main>
      )}

      {phase === 'complete' && (
        <main className="complete-screen" data-testid="pinyin-complete">
          <div className="victory-rays" /><div className="trophy-orb"><Trophy size={48} /></div>
          <p className="victory-label">WORLD 01 CLEAR!</p><h1>이제 병음이 <br />낯설지 않아요</h1>
          <p>첫 성조 몬스터를 모두 물리쳤습니다. 다음 JEONGO 모험에서도 이 소리 감각을 이어가세요.</p>
          <div className="result-grid"><div><small>획득 XP</small><strong>+{xp}</strong></div><div><small>정답</small><strong>{correctAnswers} / {quiz.length}</strong></div><div><small>최고 콤보</small><strong>{bestCombo}</strong></div></div>
          <div className="badge-earned"><span>🏅</span><div><small>새 배지 획득</small><strong>성조 정글 수호자</strong></div></div>
          <a href={`${JEONGO_URL}/onboarding`} className="jeongo-link">JEONGO 학습 준비 시작 <ArrowRight size={18} /></a>
          <button type="button" onClick={reset} className="reset-button"><RotateCcw size={14} /> 처음부터 다시 도전</button>
        </main>
      )}
    </div>
  );
}
