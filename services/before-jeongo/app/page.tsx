'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flame, Headphones, Home, Lightbulb, LockKeyhole, Play, RotateCcw, Sparkles, Star, Trophy, Volume2, Zap } from 'lucide-react';
import { playMandarinClip, playMandarinTone, speakChinese } from '@/lib/browser-speech';
import {
  pinyinRounds, rhythmRounds, stages, toneCatchRounds, toneLessons, wordRounds,
  type ChoiceRound, type PinyinRound, type StageId,
} from '@/lib/game-content';

const STORAGE_KEY = 'jeongo_sound_quest_v2';
const JEONGO_URL = process.env.NEXT_PUBLIC_JEONGO_URL ?? '';
type View = 'map' | StageId | 'clear' | 'complete';
interface SavedProgress { xp: number; unlocked: number; stars: Partial<Record<StageId, number>>; completed: StageId[] }
const initialProgress: SavedProgress = { xp: 0, unlocked: 1, stars: {}, completed: [] };

function speechFailureMessage(reason?: 'unsupported' | 'voice-unavailable' | 'playback-error') {
  if (reason === 'voice-unavailable') return '중국 본토 표준어(zh-CN) 음성이 없어 잘못된 발음은 재생하지 않았어요.';
  if (reason === 'playback-error') return '발음 재생이 시작되지 않았어요. 기기 소리 설정을 확인한 뒤 다시 눌러 주세요.';
  return '이 브라우저에서는 발음을 재생할 수 없어요.';
}

async function playFixedMandarin(audioClip?: string, audioText?: string) {
  if (audioClip) {
    const fixedResult = await playMandarinClip(audioClip);
    if (fixedResult.ok) return fixedResult;
  }
  return audioText ? await speakChinese(audioText) : { ok: false as const, reason: 'unsupported' as const };
}

export default function SoundQuestPage() {
  const [view, setView] = useState<View>('map');
  const [progress, setProgress] = useState<SavedProgress>(initialProgress);
  const [combo, setCombo] = useState(0);
  const [clearedStage, setClearedStage] = useState<StageId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SavedProgress | null;
        if (saved) setProgress({ ...initialProgress, ...saved, stars: saved.stars ?? {}, completed: saved.completed ?? [] });
      } catch { localStorage.removeItem(STORAGE_KEY); }
      finally { setReady(true); }
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress, ready]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [view]);

  const recordCorrect = (base = 10) => {
    setProgress((saved) => ({ ...saved, xp: saved.xp + base + Math.min(combo, 5) * 2 }));
    setCombo((current) => current + 1);
  };
  const recordMiss = () => setCombo(0);
  const finishStage = (stageId: StageId, misses: number, expectedRounds: number) => {
    const stageIndex = stages.findIndex((stage) => stage.id === stageId);
    const starCount = misses === 0 ? 3 : misses <= Math.max(2, Math.floor(expectedRounds * .2)) ? 2 : 1;
    setProgress((saved) => ({
      ...saved, xp: saved.xp + starCount * 25,
      unlocked: Math.max(saved.unlocked, Math.min(stages.length, stageIndex + 2)),
      stars: { ...saved.stars, [stageId]: Math.max(saved.stars[stageId] ?? 0, starCount) },
      completed: saved.completed.includes(stageId) ? saved.completed : [...saved.completed, stageId],
    }));
    setClearedStage(stageId); setView('clear');
  };
  const continueAfterClear = () => {
    const index = stages.findIndex((stage) => stage.id === clearedStage);
    setView(index === stages.length - 1 ? 'complete' : stages[index + 1].id);
  };
  const resetProgress = () => { localStorage.removeItem(STORAGE_KEY); setProgress(initialProgress); setCombo(0); setClearedStage(null); setView('map'); };
  const stageIndex = stages.findIndex((stage) => stage.id === view);
  const overallPercent = view === 'complete' ? 100 : Math.round(progress.completed.length / stages.length * 100);

  return (
    <div className="game-shell sound-quest" data-testid="sound-quest-app">
      <header className="game-topbar">
        <button type="button" className="game-brand" onClick={() => setView('map')} aria-label="BEFORE JEONGO 모험 지도">
          <span className="brand-orb">声</span><span><small>BEFORE JEONGO</small>놀면서 익히는 중국어 소리</span>
        </button>
        <div className="player-stats" aria-label="플레이어 상태"><span><Flame size={16} /> {progress.completed.length}/5</span><span><Zap size={16} /> {combo} 콤보</span><span>{progress.xp} XP</span></div>
      </header>
      {view !== 'map' && view !== 'complete' && view !== 'clear' && <div className="mission-progress" aria-label={`전체 모험 진행률 ${overallPercent}%`}><button type="button" onClick={() => setView('map')} aria-label="모험 지도로 돌아가기"><ArrowLeft size={17} /></button><div><span style={{ width: `${Math.max(overallPercent, stageIndex / stages.length * 100)}%` }} /></div><strong>{stageIndex + 1}/5</strong></div>}
      {view === 'map' && <QuestMap progress={progress} onStart={setView} />}
      {view === 'tone-lab' && <ToneLab onCorrect={recordCorrect} onComplete={(misses) => finishStage('tone-lab', misses, 12)} />}
      {view === 'tone-catch' && <ChoiceGame key="tone-catch" stage={stages[1]} rounds={toneCatchRounds} audioRequired playLabel="성조 듣기" onCorrect={recordCorrect} onMiss={recordMiss} onComplete={(m, t) => finishStage('tone-catch', m, t)} />}
      {view === 'pinyin-forge' && <PinyinForge onCorrect={recordCorrect} onMiss={recordMiss} onComplete={(m, t) => finishStage('pinyin-forge', m, t)} />}
      {view === 'word-sprint' && <ChoiceGame key="word-sprint" stage={stages[3]} rounds={wordRounds} playLabel="단어 소리 듣기" onCorrect={recordCorrect} onMiss={recordMiss} onComplete={(m, t) => finishStage('word-sprint', m, t)} />}
      {view === 'rhythm-run' && <ChoiceGame key="rhythm-run" stage={stages[4]} rounds={rhythmRounds} audioRequired playLabel="표현 듣기" onCorrect={recordCorrect} onMiss={recordMiss} onComplete={(m, t) => finishStage('rhythm-run', m, t)} />}
      {view === 'clear' && clearedStage && <StageClear stageId={clearedStage} stars={progress.stars[clearedStage] ?? 1} onMap={() => setView('map')} onContinue={continueAfterClear} />}
      {view === 'complete' && <WorldComplete progress={progress} onReplay={() => setView('map')} onReset={resetProgress} />}
    </div>
  );
}

function QuestMap({ progress, onStart }: { progress: SavedProgress; onStart: (view: View) => void }) {
  const nextIndex = Math.min(progress.completed.length, stages.length - 1);
  return <main className="campaign-map" data-testid="sound-quest-map">
    <section className="campaign-hero"><div><p className="campaign-eyebrow"><Sparkles size={14} /> 소리 놀이터 · 약 25분</p><h1>듣고, 터뜨리고,<br /><em>조립하며 익혀요</em></h1><p>시험은 없어요. 틀린 소리는 게임 속에 다시 나타나고, 다섯 놀이터를 지나면 HSK 1 모험을 시작할 수 있어요.</p><button type="button" className="campaign-start" onClick={() => onStart(stages[nextIndex].id)}><Play size={20} fill="currentColor" /> {progress.completed.length ? '이어서 놀기' : '첫 게임 시작'} <ArrowRight size={18} /></button></div><div className="sound-orbit" aria-hidden="true"><span>mā</span><span>má</span><span>mǎ</span><span>mà</span><b>声</b></div></section>
    <section className="campaign-summary" aria-label="학습 구성"><div><strong>50+</strong><span>짧은 상호작용</span></div><div><strong>5</strong><span>미니 게임</span></div><div><strong>자동</strong><span>틀린 소리 복습</span></div></section>
    <section className="quest-path" aria-labelledby="quest-path-title"><div className="quest-path-head"><div><small>WORLD 01</small><h2 id="quest-path-title">중국어 소리 놀이터</h2></div><span>{progress.completed.length} / {stages.length} 완료</span></div><div className="quest-stage-list">{stages.map((stage, index) => { const unlocked = index < progress.unlocked; const starCount = progress.stars[stage.id] ?? 0; return <button key={stage.id} type="button" disabled={!unlocked} onClick={() => onStart(stage.id)} className={`quest-stage stage-${stage.color} ${starCount ? 'is-cleared' : ''}`}><span className="quest-stage-number">{stage.number}</span><span className="quest-stage-icon">{unlocked ? stage.icon : <LockKeyhole size={20} />}</span><span className="quest-stage-copy"><strong>{stage.title}</strong><small>{stage.description}</small><em>{stage.mission}</em></span><span className="quest-stars" aria-label={`${starCount}개 별`}>{[1,2,3].map((star) => <Star key={star} size={15} fill={star <= starCount ? 'currentColor' : 'none'} />)}</span></button>; })}</div></section>
  </main>;
}

function ToneLab({ onCorrect, onComplete }: { onCorrect: (base?: number) => void; onComplete: (misses: number) => void }) {
  const [listenCounts, setListenCounts] = useState<Record<string, number>>({});
  const [shadowed, setShadowed] = useState<string[]>([]);
  const [notice, setNotice] = useState('각 소리를 두 번 듣고 선을 손으로 그리며 따라 말해 보세요.');
  const complete = toneLessons.every((tone) => (listenCounts[tone.id] ?? 0) >= 2 && shadowed.includes(tone.id));
  const listen = async (toneId: string, toneIndex: number) => {
    const result = await playMandarinTone(toneIndex);
    if (!result.ok) { setNotice('기기의 소리 재생을 확인해 주세요.'); return; }
    const previousCount = listenCounts[toneId] ?? 0;
    setListenCounts((current) => ({ ...current, [toneId]: Math.min(2, (current[toneId] ?? 0) + 1) }));
    if (previousCount < 2) onCorrect(4);
    setNotice('좋아요! 같은 소리를 한 번 더 듣고 직접 따라 해보세요.');
  };
  const shadow = (toneId: string) => { if ((listenCounts[toneId] ?? 0) < 1 || shadowed.includes(toneId)) return; setShadowed((current) => [...current, toneId]); onCorrect(6); setNotice('멋져요! 손가락 선과 목소리의 높이가 함께 움직였어요.'); };
  const actionCount = Object.values(listenCounts).reduce((sum, count) => sum + count, 0) + shadowed.length;
  return <main className="mini-game" data-testid="tone-lab"><GameHeading stage={stages[0]} progress={`${actionCount}/12`} /><p className="coach-bubble" role="status">🎙️ {notice}</p><div className="tone-lab-grid">{toneLessons.map((tone) => { const count = listenCounts[tone.id] ?? 0; const said = shadowed.includes(tone.id); return <article key={tone.id} className={`tone-lab-card ${said ? 'is-mastered' : ''}`}><span className="tone-line">{tone.gesture}</span><strong>{tone.pinyin}</strong><b>{tone.hanzi}</b><p>{tone.label} · {tone.hint}</p><small>{tone.meaning}</small><div className="listen-pips" aria-label={`${count}회 들음`}>{[1,2].map((pip) => <i key={pip} className={pip <= count ? 'on' : ''} />)}</div><button type="button" onClick={() => void listen(tone.id, tone.toneIndex)}><Volume2 size={15} /> {count >= 2 ? '다시 듣기' : `${count + 1}번째 듣기`}</button><button type="button" disabled={count < 1 || said} onClick={() => shadow(tone.id)} className="shadow-button">{said ? <><Check size={15} /> 따라 말했어요</> : '손으로 그리고 따라 말하기'}</button></article>; })}</div><button type="button" disabled={!complete} onClick={() => onComplete(0)} className="game-next">성조 버블팝 열기 <ArrowRight size={18} /></button></main>;
}

interface PlayableRound extends ChoiceRound { retry?: boolean }
function ChoiceGame({ stage, rounds, audioRequired = false, playLabel, onCorrect, onMiss, onComplete }: { stage: (typeof stages)[number]; rounds: ChoiceRound[]; audioRequired?: boolean; playLabel: string; onCorrect: (base?: number) => void; onMiss: () => void; onComplete: (misses: number, total: number) => void }) {
  const [deck, setDeck] = useState<PlayableRound[]>(() => rounds.map((round) => ({ ...round })));
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState(''); const [feedback, setFeedback] = useState('');
  const [audioPlayed, setAudioPlayed] = useState(!audioRequired); const [misses, setMisses] = useState(0); const [missedCurrent, setMissedCurrent] = useState(false);
  const [audioNotice, setAudioNotice] = useState('');
  const round = deck[index];
  const playRound = async () => {
    const result = round.toneIndex !== undefined
      ? await playMandarinTone(round.toneIndex)
      : await playFixedMandarin(round.audioClip, round.audioText);
    if (!result.ok) { setAudioPlayed(!audioRequired); setAudioNotice(speechFailureMessage(result.reason)); return; }
    setAudioPlayed(true); setAudioNotice('중국 본토 표준 발음을 재생했어요.');
  };
  const choose = (option: string) => {
    if (!audioPlayed || feedback) return; setSelected(option);
    if (option !== round.answer) { setMisses((value) => value + 1); setMissedCurrent(true); setFeedback('한 번 더 들어보면 잡을 수 있어요!'); onMiss(); window.setTimeout(() => { setSelected(''); setFeedback(''); if (audioRequired) setAudioPlayed(false); }, 650); return; }
    onCorrect(10); setFeedback(`잡았다! ${round.reveal ?? round.answer}`); if (!audioRequired && round.audioText) void playRound();
    const nextDeck = missedCurrent && !round.retry ? [...deck, { ...round, id: `${round.id}-retry`, retry: true }] : deck; setDeck(nextDeck);
    window.setTimeout(() => { if (index + 1 >= nextDeck.length) { onComplete(misses, nextDeck.length); return; } setIndex((value) => value + 1); setSelected(''); setFeedback(''); setMissedCurrent(false); setAudioPlayed(!audioRequired); setAudioNotice(''); }, 750);
  };
  return <main className="mini-game choice-game" data-testid={stage.id}><GameHeading stage={stage} progress={`${index + 1}/${deck.length}`} /><section className="challenge-card">{round.retry && <p className="retry-chip">다시 만난 소리 · 이번엔 내 것으로!</p>}<div className="challenge-orb">{stage.icon}</div><h2>{round.prompt}</h2>{round.audioText || round.toneIndex !== undefined ? <button type="button" onClick={() => void playRound()} className={`audio-portal ${audioPlayed ? 'has-played' : ''}`}><Headphones size={20} /> {audioPlayed ? '한 번 더 듣기' : playLabel}</button> : null}{audioRequired && !audioPlayed && <p className="audio-gate">먼저 소리를 재생하면 선택지가 활성화돼요.</p>}{audioNotice && <p className={`audio-notice ${audioPlayed ? 'ok' : 'error'}`} role="status">{audioNotice}</p>}<div className="bubble-options">{round.options.map((option) => <button key={option} type="button" data-correct={option === round.answer ? 'true' : 'false'} disabled={!audioPlayed || Boolean(feedback)} aria-pressed={selected === option} onClick={() => choose(option)}>{option}</button>)}</div><p className={`game-feedback ${feedback.startsWith('잡았다') ? 'correct' : ''}`} role="status">{feedback || '정답을 외우지 말고 소리와 모양을 연결해 보세요.'}</p></section></main>;
}

interface PlayablePinyinRound extends PinyinRound { retry?: boolean }
function PinyinForge({ onCorrect, onMiss, onComplete }: { onCorrect: (base?: number) => void; onMiss: () => void; onComplete: (misses: number, total: number) => void }) {
  const [deck, setDeck] = useState<PlayablePinyinRound[]>(() => pinyinRounds.map((round) => ({ ...round })));
  const [index, setIndex] = useState(0); const [initial, setInitial] = useState(''); const [final, setFinal] = useState(''); const [feedback, setFeedback] = useState(''); const [showHint, setShowHint] = useState(false); const [misses, setMisses] = useState(0); const [missedCurrent, setMissedCurrent] = useState(false);
  const [audioNotice, setAudioNotice] = useState('');
  const round = deck[index]; const assembled = `${initial}${final}`;
  const playRound = async () => {
    const result = round.toneRecordingIndex !== undefined
      ? await playMandarinTone(round.toneRecordingIndex)
      : await playFixedMandarin(round.audioClip, round.audioText);
    setAudioNotice(result.ok ? `${round.pinyin} · 중국 본토 표준 발음을 재생했어요.` : speechFailureMessage(result.reason));
  };
  const submit = () => {
    if (!initial || !final || feedback) return;
    if (initial !== round.initial || final !== round.final) { setMisses((value) => value + 1); setMissedCurrent(true); setFeedback('블록이 살짝 어긋났어요. 소리와 힌트를 다시 확인해요!'); setShowHint(true); onMiss(); window.setTimeout(() => { setInitial(''); setFinal(''); setFeedback(''); }, 750); return; }
    onCorrect(14); void playRound(); setFeedback(`완성! ${round.initial} + ${round.final} = ${round.pinyin} · ${round.tone}`);
    const nextDeck = missedCurrent && !round.retry ? [...deck, { ...round, id: `${round.id}-retry`, retry: true }] : deck; setDeck(nextDeck);
    window.setTimeout(() => { if (index + 1 >= nextDeck.length) { onComplete(misses, nextDeck.length); return; } setIndex((value) => value + 1); setInitial(''); setFinal(''); setFeedback(''); setShowHint(false); setMissedCurrent(false); setAudioNotice(''); }, 850);
  };
  return <main className="mini-game" data-testid="pinyin-forge"><GameHeading stage={stages[2]} progress={`${index + 1}/${deck.length}`} /><section className="forge-card">{round.retry && <p className="retry-chip">복습 블록 · 아까 헷갈린 소리예요</p>}<div className="forge-target"><button type="button" onClick={() => void playRound()} aria-label={`${round.hanzi} 소리 듣기`}><Volume2 size={19} /></button><b>{round.hanzi}</b><span><small>{round.korean}</small><strong>{round.pinyin} · {round.tone}</strong></span></div><p>소리를 듣고 성모와 운모 블록을 하나씩 골라요.</p>{audioNotice && <p className={`audio-notice ${audioNotice.includes('재생했어요') ? 'ok' : 'error'}`} role="status">{audioNotice}</p>}<div className="block-banks"><div><h3><span>1</span> 성모 · 첫소리</h3>{round.initialOptions.map((option) => <button key={option} type="button" data-part="initial" data-correct={option === round.initial ? 'true' : 'false'} aria-pressed={initial === option} onClick={() => setInitial(option)}>{option}</button>)}</div><div><h3><span>2</span> 운모 · 뒷소리</h3>{round.finalOptions.map((option) => <button key={option} type="button" data-part="final" data-correct={option === round.final ? 'true' : 'false'} aria-pressed={final === option} onClick={() => setFinal(option)}>{option}</button>)}</div></div><div className="forge-tray"><span>{initial || '?'}</span><i>+</i><span>{final || '?'}</span><i>=</i><strong>{assembled === `${round.initial}${round.final}` ? round.pinyin : assembled || '?'}</strong></div><button type="button" className="hint-link" onClick={() => setShowHint((value) => !value)}><Lightbulb size={14} /> {showHint ? round.hint : '막히면 힌트 보기'}</button><p className={`game-feedback ${feedback.startsWith('완성') ? 'correct' : ''}`} role="status">{feedback || '블록을 직접 조립하면 소리 구조가 눈에 보여요.'}</p><button type="button" className="forge-submit" disabled={!initial || !final || Boolean(feedback)} onClick={submit}>조립하기 <Zap size={16} /></button></section></main>;
}

function GameHeading({ stage, progress }: { stage: (typeof stages)[number]; progress: string }) { return <header className={`game-heading stage-${stage.color}`}><div><p>STAGE {stage.number}</p><h1>{stage.icon} {stage.title}</h1><span>{stage.description}</span></div><strong>{progress}</strong></header>; }
function StageClear({ stageId, stars: starCount, onMap, onContinue }: { stageId: StageId; stars: number; onMap: () => void; onContinue: () => void }) { const stage = stages.find((item) => item.id === stageId) ?? stages[0]; const last = stage.id === stages.at(-1)?.id; return <main className="stage-clear" data-testid="stage-clear"><div className="clear-burst" aria-hidden="true" /><span className="clear-icon">{stage.icon}</span><p>STAGE CLEAR</p><h1>{stage.title} 완료!</h1><div className="clear-stars">{[1,2,3].map((star) => <Star key={star} size={34} fill={star <= starCount ? 'currentColor' : 'none'} />)}</div><p className="clear-copy">틀린 소리는 다시 만나며 연습했어요. 이제 다음 놀이터에서도 방금 만든 소리 감각을 이어가요.</p><div className="clear-actions"><button type="button" onClick={onMap}><Home size={17} /> 지도 보기</button><button type="button" onClick={onContinue}>{last ? '모험 완료' : '다음 게임'} <ArrowRight size={17} /></button></div></main>; }
function WorldComplete({ progress, onReplay, onReset }: { progress: SavedProgress; onReplay: () => void; onReset: () => void }) { const starCount = useMemo(() => Object.values(progress.stars).reduce((sum, value) => sum + (value ?? 0), 0), [progress.stars]); return <main className="world-complete" data-testid="sound-quest-complete"><div className="victory-rays" /><div className="trophy-orb"><Trophy size={48} /></div><p className="victory-label">WORLD 01 CLEAR!</p><h1>HSK 1 소리 모험을<br />시작할 준비 완료!</h1><p>성조를 듣고, 병음을 조립하고, 첫 단어와 표현의 리듬까지 놀면서 익혔어요. 배치고사 없이 HSK 1부터 천천히 시작합니다.</p><div className="result-grid"><div><small>획득 XP</small><strong>{progress.xp}</strong></div><div><small>완료 게임</small><strong>5 / 5</strong></div><div><small>수집한 별</small><strong>{starCount} / 15</strong></div></div><a href={`${JEONGO_URL}/learn`} className="jeongo-link">JEONGO HSK 1 모험 시작 <ArrowRight size={18} /></a><button type="button" onClick={onReplay} className="free-play-button">자유롭게 다시 놀기</button><button type="button" onClick={onReset} className="reset-button"><RotateCcw size={14} /> 모든 진행 초기화</button></main>; }
