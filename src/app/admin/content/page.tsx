'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp, type ContentCatalog, type ContentQuest, type ContentReward, type VocabItem } from '@/context/AppContext';

type Tab = 'words' | 'quests' | 'rewards';

export default function ContentAdminPage() {
  const { authStatus, session, contentCatalog, saveContentCatalog } = useApp();
  const [tab, setTab] = useState<Tab>('words');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [word, setWord] = useState({ hanzi: '', pinyin: '', meaning: '', hsk: 'HSK 1' });
  const [quest, setQuest] = useState({ title: '', desc: '', target: 1, gold: 100, xp: 20 });
  const [reward, setReward] = useState({ name: '', image: '🎁', cost: 1000, desc: '' });

  if (authStatus === 'loading') {
    return <div className="glass-panel rounded-2xl p-6 text-xs text-gray-400">관리자 권한을 확인하고 있습니다…</div>;
  }
  if (session?.role !== 'admin') {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-lg font-extrabold">관리자 CMS</h1>
        <p className="mt-2 text-xs text-gray-400">MySQL에서 관리자 역할이 부여된 계정이 필요합니다.</p>
        <Link href="/login" className="mt-4 inline-block text-xs font-bold text-neon-cyan">관리자 로그인 →</Link>
      </div>
    );
  }

  const persist = async (catalog: ContentCatalog, label: string) => {
    setPending(true);
    setMessage('');
    try {
      await saveContentCatalog(catalog);
      setMessage(`${label} 저장 완료 · 모든 사용자에게 공용으로 반영되었습니다.`);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '콘텐츠를 저장하지 못했습니다.');
      return false;
    } finally {
      setPending(false);
    }
  };

  const addWord = async () => {
    if (!word.hanzi.trim() || !word.meaning.trim()) {
      setMessage('한자와 뜻을 입력해 주세요.');
      return;
    }
    const item: VocabItem = {
      id: 10_000_000 + Date.now(),
      ...word,
      isLearned: false,
      easiness: 2.5,
      repetitions: 0,
      intervalDays: 0,
      nextReviewAt: new Date().toISOString(),
    };
    if (await persist({ ...contentCatalog, words: [...contentCatalog.words, item] }, '단어')) {
      setWord({ hanzi: '', pinyin: '', meaning: '', hsk: 'HSK 1' });
    }
  };

  const addQuest = async () => {
    if (!quest.title.trim()) {
      setMessage('퀘스트명을 입력해 주세요.');
      return;
    }
    const item: ContentQuest = { id: `custom-q-${Date.now()}`, ...quest };
    if (await persist({ ...contentCatalog, quests: [...contentCatalog.quests, item] }, '퀘스트')) {
      setQuest({ title: '', desc: '', target: 1, gold: 100, xp: 20 });
    }
  };

  const addReward = async () => {
    if (!reward.name.trim()) {
      setMessage('보상명을 입력해 주세요.');
      return;
    }
    const item: ContentReward = { id: `custom-r-${Date.now()}`, ...reward };
    if (await persist({ ...contentCatalog, rewards: [...contentCatalog.rewards, item] }, '보상')) {
      setReward({ name: '', image: '🎁', cost: 1000, desc: '' });
    }
  };

  return (
    <div className="flex flex-col gap-4" data-testid="content-cms">
      <div className="glass-panel rounded-2xl p-5">
        <h1 className="text-lg font-extrabold">콘텐츠 관리 CMS</h1>
        <p className="mt-1 text-xs text-gray-400">단어·퀘스트·보상을 MySQL에 저장하고 모든 사용자에게 반영합니다.</p>
        <Link href="/admin/redemptions" className="mt-3 inline-block text-xs font-bold text-cyber-yellow">현실 보상 신청 관리 →</Link>
        {message && <p className={`mt-2 text-xs ${message.includes('완료') ? 'text-neon-green' : 'text-neon-rose'}`} role="status">{message}</p>}
      </div>

      <div className="flex rounded-xl bg-white/5 p-1">
        {(['words', 'quests', 'rewards'] as Tab[]).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} disabled={pending} className={`flex-1 rounded-lg py-2 text-xs ${tab === item ? 'bg-neon-cyan font-bold text-dark-bg' : 'text-gray-400'}`}>
            {item === 'words' ? '단어' : item === 'quests' ? '퀘스트' : '보상'}
          </button>
        ))}
      </div>

      {tab === 'words' && (
        <Editor title="단어 추가">
          <TextInput label="한자" value={word.hanzi} onChange={(value) => setWord({ ...word, hanzi: value })} />
          <TextInput label="병음" value={word.pinyin} onChange={(value) => setWord({ ...word, pinyin: value })} />
          <TextInput label="뜻" value={word.meaning} onChange={(value) => setWord({ ...word, meaning: value })} />
          <select aria-label="HSK 등급" value={word.hsk} onChange={(event) => setWord({ ...word, hsk: event.target.value })} className="field">
            {[1, 2, 3, 4, 5, 6].map((level) => <option key={level}>HSK {level}</option>)}
          </select>
          <SaveButton onClick={addWord} disabled={pending} />
          {contentCatalog.words.map((item) => <Row key={item.id} label={`${item.hanzi} · ${item.meaning}`} disabled={pending} onDelete={() => persist({ ...contentCatalog, words: contentCatalog.words.filter((entry) => entry.id !== item.id) }, '단어')} />)}
        </Editor>
      )}

      {tab === 'quests' && (
        <Editor title="퀘스트 추가">
          <TextInput label="퀘스트명" value={quest.title} onChange={(value) => setQuest({ ...quest, title: value })} />
          <TextInput label="설명" value={quest.desc} onChange={(value) => setQuest({ ...quest, desc: value })} />
          <NumberInput label="목표" value={quest.target} onChange={(value) => setQuest({ ...quest, target: value })} />
          <NumberInput label="골드" value={quest.gold} onChange={(value) => setQuest({ ...quest, gold: value })} />
          <SaveButton onClick={addQuest} disabled={pending} />
          {contentCatalog.quests.map((item) => <Row key={item.id} label={`${item.title} · ${item.gold}G`} disabled={pending} onDelete={() => persist({ ...contentCatalog, quests: contentCatalog.quests.filter((entry) => entry.id !== item.id) }, '퀘스트')} />)}
        </Editor>
      )}

      {tab === 'rewards' && (
        <Editor title="보상 추가">
          <TextInput label="보상명" value={reward.name} onChange={(value) => setReward({ ...reward, name: value })} />
          <TextInput label="아이콘" value={reward.image} onChange={(value) => setReward({ ...reward, image: value })} />
          <TextInput label="설명" value={reward.desc} onChange={(value) => setReward({ ...reward, desc: value })} />
          <NumberInput label="가격" value={reward.cost} onChange={(value) => setReward({ ...reward, cost: value })} />
          <SaveButton onClick={addReward} disabled={pending} />
          {contentCatalog.rewards.map((item) => <Row key={item.id} label={`${item.image} ${item.name} · ${item.cost}G`} disabled={pending} onDelete={() => persist({ ...contentCatalog, rewards: contentCatalog.rewards.filter((entry) => entry.id !== item.id) }, '보상')} />)}
        </Editor>
      )}
    </div>
  );
}

function Editor({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="glass-panel flex flex-col gap-3 rounded-2xl p-4"><h2 className="text-sm font-bold">{title}</h2>{children}</section>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-[10px] text-gray-400">{label}<input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white" /></label>;
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="text-[10px] text-gray-400">{label}<input aria-label={label} type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white" /></label>;
}

function SaveButton({ onClick, disabled }: { onClick: () => Promise<void>; disabled: boolean }) {
  return <button type="button" onClick={() => void onClick()} disabled={disabled} className="rounded-lg bg-neon-cyan py-2 text-xs font-bold text-dark-bg disabled:opacity-50">{disabled ? '저장 중…' : '저장'}</button>;
}

function Row({ label, onDelete, disabled }: { label: string; onDelete: () => Promise<boolean>; disabled: boolean }) {
  return <div className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs"><span>{label}</span><button type="button" onClick={() => void onDelete()} disabled={disabled} className="text-neon-rose disabled:opacity-50">삭제</button></div>;
}
