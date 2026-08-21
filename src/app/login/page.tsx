'use client';

import { useEffect, useRef, useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

interface GoogleCredentialResponse { credential?: string }

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { authStatus, session, logout } = useApp();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch('/api/auth/google/config', { cache: 'no-store' })
      .then(async (response) => response.json() as Promise<{ configured?: boolean; clientId?: string | null }>)
      .then((config) => {
        setGoogleConfigured(Boolean(config.configured && config.clientId));
        setGoogleClientId(config.clientId ?? '');
      })
      .catch(() => setGoogleConfigured(false));
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    let cancelled = false;
    const initialize = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (!response.credential) return;
          setPending(true);
          setError('');
          void fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ credential: response.credential }),
          }).then(async (result) => {
            const body = (await result.json().catch(() => null)) as { error?: string; created?: boolean } | null;
            if (!result.ok) throw new Error(body?.error ?? 'Google 로그인을 처리하지 못했습니다.');
            window.location.assign(body?.created ? '/onboarding' : '/home');
          }).catch((cause) => {
            setError(cause instanceof Error ? cause.message : 'Google 로그인을 처리하지 못했습니다.');
            setPending(false);
          });
        },
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard', theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 320,
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-jeongo-google-signin]');
    if (existing) {
      if (window.google) initialize();
      else existing.addEventListener('load', initialize, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.dataset.jeongoGoogleSignin = 'true';
      script.addEventListener('load', initialize, { once: true });
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [googleClientId]);

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
        <LogIn />
      </div>
      <div>
        <h1 className="text-xl font-extrabold">Google 로그인·회원가입</h1>
        <p className="text-xs text-gray-400 mt-1">Google 계정 하나로 가입하거나 로그인하고, 학습 기록과 캐릭터 성장을 회원 DB에 보관합니다.</p>
      </div>

      <div className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-black p-1">
        {googleConfigured ? <div ref={googleButtonRef} aria-label="Google 계정으로 계속하기" /> : (
          <span className="text-xs font-bold text-gray-500">
            {googleConfigured === null ? 'Google 로그인 확인 중…' : 'Google 로그인 설정 준비 중'}
          </span>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-neon-rose/10 border border-neon-rose/20 p-3 text-xs text-neon-rose">{error}</p>}
      {pending && <p className="text-center text-xs font-bold text-neon-cyan">Google 계정 확인 중...</p>}
      <a href="/home" role="button" className="rounded-xl border border-white/10 py-3 text-center text-sm font-bold text-gray-300">게스트로 계속하기</a>
      <p className="text-[10px] text-gray-500">게스트 기록은 기존 규칙대로 이 브라우저에만 저장됩니다. Google 회원으로 로그인하면 회원 DB 기록을 사용합니다.</p>
    </section>
  );
}
