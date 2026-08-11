'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp, type ContentCatalog, type ContentQuest, type ContentReward, type VocabItem } from '@/context/AppContext';

type Tab = 'words' | 'quests' | 'rewards';

export default function ContentAdminPage() {
  const { session, contentCatalog, saveContentCatalog } = useApp();
  const [tab, setTab] = useState<Tab>('words');
  const [message, setMessage] = useState('');
  const [word, setWord] = useState({ hanzi: '', pinyin: '', meaning: '', hsk: 'HSK 1' });
  const [quest, setQuest] = useState({ title: '', desc: '', target: 1, gold: 100, xp: 20 });
  const [reward, setReward] = useState({ name: '', image: '🎁', cost: 1000, desc: '' });

  if (session?.role !== 'admin') return <div className="glass-panel rounded-2xl p-6"><h1 className="text-lg font-extrabold">관리자 CMS</h1><p className="text-xs text-gray-400 mt-2">MySQL에서 관리자 역할이 부여된 계정이 필요합니다.</p><Link href="/login" className="inline-block mt-4 text-neon-cyan text-xs font-bold">관리자 로그인 →</Link></div>;

  const persist = (catalog: ContentCatalog, label: string) => { saveContentCatalog(catalog); setMessage(`${label} 저장 완료`); };
  const addWord = () => {
    if (!word.hanzi || !word.meaning) return;
    const item: VocabItem = { id: 100000 + Date.now(), ...word, isLearned: true, easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() };
    persist({ ...contentCatalog, words: [...contentCatalog.words, item] }, '단어'); setWord({ hanzi: '', pinyin: '', meaning: '', hsk: 'HSK 1' });
  };
  const addQuest = () => {
    if (!quest.title) return;
    const item: ContentQuest = { id: `custom-q-${Date.now()}`, ...quest };
    persist({ ...contentCatalog, quests: [...contentCatalog.quests, item] }, '퀘스트'); setQuest({ title: '', desc: '', target: 1, gold: 100, xp: 20 });
  };
  const addReward = () => {
    if (!reward.name) return;
    const item: ContentReward = { id: `custom-r-${Date.now()}`, ...reward };
    persist({ ...contentCatalog, rewards: [...contentCatalog.rewards, item] }, '보상'); setReward({ name: '', image: '🎁', cost: 1000, desc: '' });
  };

  return <div className="flex flex-col gap-4" data-testid="content-cms">
    <div className="glass-panel rounded-2xl p-5"><h1 className="text-lg font-extrabold">콘텐츠 관리 CMS</h1><p className="text-xs text-gray-400 mt-1">단어·퀘스트·보상을 코드 수정 없이 추가하고 즉시 앱에 반영합니다.</p>{message && <p className="text-xs text-neon-green mt-2" role="status">{message}</p>}</div>
    <div className="flex rounded-xl bg-white/5 p-1">{(['words','quests','rewards'] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`flex-1 py-2 text-xs rounded-lg ${tab === item ? 'bg-neon-cyan text-dark-bg font-bold' : 'text-gray-400'}`}>{item === 'words' ? '단어' : item === 'quests' ? '퀘스트' : '보상'}</button>)}</div>
    {tab === 'words' && <Editor title="단어 추가"><TextInput label="한자" value={word.hanzi} onChange={(value) => setWord({ ...word, hanzi: value })}/><TextInput label="병음" value={word.pinyin} onChange={(value) => setWord({ ...word, pinyin: value })}/><TextInput label="뜻" value={word.meaning} onChange={(value) => setWord({ ...word, meaning: value })}/><select aria-label="HSK 등급" value={word.hsk} onChange={(event) => setWord({ ...word, hsk: event.target.value })} className="field">{[1,2,3,4,5,6].map((level) => <option key={level}>HSK {level}</option>)}</select><SaveButton onClick={addWord}/>{contentCatalog.words.map((item) => <Row key={item.id} label={`${item.hanzi} · ${item.meaning}`} onDelete={() => persist({ ...contentCatalog, words: contentCatalog.words.filter((entry) => entry.id !== item.id) }, '단어')}/>)}</Editor>}
    {tab === 'quests' && <Editor title="퀘스트 추가"><TextInput label="퀘스트명" value={quest.title} onChange={(value) => setQuest({ ...quest, title: value })}/><TextInput label="설명" value={quest.desc} onChange={(value) => setQuest({ ...quest, desc: value })}/><NumberInput label="목표" value={quest.target} onChange={(value) => setQuest({ ...quest, target: value })}/><NumberInput label="골드" value={quest.gold} onChange={(value) => setQuest({ ...quest, gold: value })}/><SaveButton onClick={addQuest}/>{contentCatalog.quests.map((item) => <Row key={item.id} label={`${item.title} · ${item.gold}G`} onDelete={() => persist({ ...contentCatalog, quests: contentCatalog.quests.filter((entry) => entry.id !== item.id) }, '퀘스트')}/>)}</Editor>}
    {tab === 'rewards' && <Editor title="보상 추가"><TextInput label="보상명" value={reward.name} onChange={(value) => setReward({ ...reward, name: value })}/><TextInput label="아이콘" value={reward.image} onChange={(value) => setReward({ ...reward, image: value })}/><TextInput label="설명" value={reward.desc} onChange={(value) => setReward({ ...reward, desc: value })}/><NumberInput label="가격" value={reward.cost} onChange={(value) => setReward({ ...reward, cost: value })}/><SaveButton onClick={addReward}/>{contentCatalog.rewards.map((item) => <Row key={item.id} label={`${item.image} ${item.name} · ${item.cost}G`} onDelete={() => persist({ ...contentCatalog, rewards: contentCatalog.rewards.filter((entry) => entry.id !== item.id) }, '보상')}/>)}</Editor>}
  </div>;
}

function Editor({ title, children }: { title: string; children: React.ReactNode }) { return <section className="glass-panel rounded-2xl p-4 flex flex-col gap-3"><h2 className="text-sm font-bold">{title}</h2>{children}</section>; }
function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-[10px] text-gray-400">{label}<input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 p-2 text-xs text-white"/></label>; }
function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="text-[10px] text-gray-400">{label}<input aria-label={label} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 p-2 text-xs text-white"/></label>; }
function SaveButton({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-lg bg-neon-cyan text-dark-bg py-2 text-xs font-bold">저장</button>; }
function Row({ label, onDelete }: { label: string; onDelete: () => void }) { return <div className="flex justify-between items-center bg-white/5 rounded-lg p-2 text-xs"><span>{label}</span><button type="button" onClick={onDelete} className="text-neon-rose">삭제</button></div>; }
