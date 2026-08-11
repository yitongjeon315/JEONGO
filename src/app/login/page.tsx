'use client';

import { useState } from 'react';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

type LoginMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { authStatus, session, login, register, logout } = useApp();
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setPending(true);
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, name, password);
      router.push('/home');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했습니다.');
    } finally {
      setPending(false);
    }
  };

  if (authStatus === 'authenticated' && session) {
    return (
      <section className="glass-panel rounded-3xl p-6 border-white/10 flex flex-col gap-5" data-testid="login-page">
        <div className="w-14 h-14 rounded-2xl bg-neon-green/15 text-neon-green flex items-center justify-center"><ShieldCheck /></div>
        <div>
          <h1 className="text-xl font-extrabold">로그인되어 있습니다</h1>
          <p className="text-sm text-gray-300 mt-2">{session.name}</p>
          <p className="text-xs text-gray-500">{session.email}</p>
        </div>
        <button type="button" onClick={() => router.push('/home')} className="rounded-xl bg-neon-cyan text-dark-bg font-extrabold py-3">본진으로 이동</button>
        <button
          type="button"
          onClick={() => void logout().then(() => window.location.assign('/login')).catch((cause) => setError(cause instanceof Error ? cause.message : '로그아웃하지 못했습니다.'))}
          className="rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-300"
        >
          로그아웃
        </button>
        {error && <p role="alert" className="text-xs text-neon-rose">{error}</p>}
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-3xl p-6 border-white/10 flex flex-col gap-5" data-testid="login-page">
      <div className="w-14 h-14 rounded-2xl bg-neon-cyan/15 text-neon-cyan flex items-center justify-center">
        {mode === 'login' ? <LogIn /> : <UserPlus />}
      </div>
      <div>
        <h1 className="text-xl font-extrabold">JEONGO 계정</h1>
        <p className="text-xs text-gray-400 mt-1">학습 기록과 캐릭터 성장을 MySQL 계정에 안전하게 보관합니다.</p>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1" aria-label="계정 방식">
        <button type="button" onClick={() => { setMode('login'); setError(''); }} aria-pressed={mode === 'login'} className={`rounded-lg py-2 text-xs font-bold ${mode === 'login' ? 'bg-neon-cyan text-dark-bg' : 'text-gray-400'}`}>로그인</button>
        <button type="button" onClick={() => { setMode('register'); setError(''); }} aria-pressed={mode === 'register'} className={`rounded-lg py-2 text-xs font-bold ${mode === 'register' ? 'bg-neon-cyan text-dark-bg' : 'text-gray-400'}`}>회원가입</button>
      </div>

      {mode === 'register' && (
        <label className="text-xs font-bold text-gray-300">
          이름
          <input aria-label="이름" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" />
        </label>
      )}
      <label className="text-xs font-bold text-gray-300">
        이메일
        <input aria-label="이메일" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" />
      </label>
      <label className="text-xs font-bold text-gray-300">
        비밀번호
        <input aria-label="비밀번호" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submit(); }} className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" />
        {mode === 'register' && <span className="block mt-1 text-[10px] font-normal text-gray-500">8자 이상 입력해 주세요.</span>}
      </label>

      {error && <p role="alert" className="rounded-xl bg-neon-rose/10 border border-neon-rose/20 p-3 text-xs text-neon-rose">{error}</p>}
      <button type="button" disabled={pending || authStatus === 'loading'} onClick={() => void submit()} className="rounded-xl bg-neon-cyan text-dark-bg font-extrabold py-3 disabled:opacity-50">
        {pending ? '처리 중...' : mode === 'login' ? '로그인하고 학습 시작' : '계정 만들고 학습 시작'}
      </button>
      <button type="button" onClick={() => router.push('/home')} className="rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-300">게스트로 계속하기</button>
      <p className="text-[10px] text-gray-500">게스트 기록은 이 브라우저에만 저장됩니다. 계정으로 로그인하면 서버 기록을 불러옵니다.</p>
    </section>
  );
}
