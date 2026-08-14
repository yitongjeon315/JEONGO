'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import rawVocabData from '@/data/hsk_1to6.json';
import {
  buildAnalytics,
  calculateSm2,
  type AnalyticsSummary,
  type LearningEvent,
  type PlacementResult,
} from '@/lib/learning';
import {
  DAILY_QUESTS_STORAGE_KEY,
  applyLearningEventToDailyQuests,
  createDailyQuestState,
  refreshDailyQuestState,
  restoreDailyQuestState,
  type DailyQuest,
  type DailyQuestState,
} from '@/lib/daily-quests';
import { totalAllocatedPoints, type StatAllocation } from '@/lib/character-growth';
import {
  DEFAULT_CONTENT_CATALOG,
  type ContentCatalog,
  type VocabItem,
} from '@/lib/content-catalog';

export type { ContentCatalog, ContentQuest, ContentReward, VocabItem } from '@/lib/content-catalog';

interface RawVocabItem {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk: string;
  partOfSpeech?: string;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  isLearned?: boolean;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? '요청을 처리하지 못했습니다.';
  } catch {
    return '요청을 처리하지 못했습니다.';
  }
}

// User Stats Type
export interface UserStats {
  level: number;
  xp: number;
  xpNeeded: number;
  gold: number;
  streak: number;
  avatarSkin: string;
  
  // RPG Stats
  str: number; // 어휘력
  dex: number; // 유창성
  int: number; // 성조
  vit: number; // 연속성
  points: number; // 남은 스탯 포인트
}

// Purchased Skins
export interface SkinsState {
  owned: string[];
  equipped: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'admin';
}

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

interface AppContextType {
  stats: UserStats;
  vocabList: VocabItem[];
  skins: SkinsState;
  addXP: (amount: number) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  allocateStats: (allocation: StatAllocation) => void;
  updateSrsWord: (wordId: number, quality: number) => void;
  toggleLearnWord: (wordId: number) => void;
  equipSkin: (skinId: string) => void;
  buySkin: (skinId: string, cost: number) => boolean;
  claimDailyQuest: (questId: string) => void;
  dailyQuests: DailyQuest[];
  activeLeague: string;
  guildInfo: GuildInfo;
  contributeToGuild: (goldAmount: number) => void;
  session: UserSession | null;
  authStatus: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  learningEvents: LearningEvent[];
  recordLearningEvent: (event: Omit<LearningEvent, 'id' | 'occurredAt'> & { occurredAt?: string }) => void;
  placementResult: PlacementResult | null;
  savePlacementResult: (result: PlacementResult) => void;
  analytics: AnalyticsSummary;
  contentCatalog: ContentCatalog;
  saveContentCatalog: (catalog: ContentCatalog) => Promise<void>;
}

interface GuildInfo {
  name: string;
  level: number;
  exp: number;
  expNeeded: number;
  contribution: number;
  bossHp: number;
  bossMaxHp: number;
}

type VocabProgress = Pick<VocabItem, 'id' | 'isLearned' | 'easiness' | 'repetitions' | 'intervalDays' | 'nextReviewAt'>;

interface AccountSnapshot {
  version: 1;
  stats: UserStats;
  vocabProgress: VocabProgress[];
  skins: SkinsState;
  dailyQuestState: DailyQuestState;
  guildInfo: GuildInfo;
  learningEvents: LearningEvent[];
  placementResult: PlacementResult | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Vocab Data (Mapped from raw HSK JSON)
const INITIAL_VOCAB: VocabItem[] = (rawVocabData as RawVocabItem[]).map((item) => ({
  id: item.id,
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  meaning: item.meaning,
  hsk: item.hsk,
  partOfSpeech: item.partOfSpeech || '명사',
  exampleHanzi: item.exampleHanzi,
  examplePinyin: item.examplePinyin,
  exampleMeaning: item.exampleMeaning,
  isLearned: item.isLearned ?? false,
  easiness: 2.5,
  repetitions: 0,
  intervalDays: 0,
  nextReviewAt: new Date().toISOString(),
}));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states from localStorage if available, otherwise use defaults
  const [stats, setStats] = useState<UserStats>({
    level: 4,
    xp: 65,
    xpNeeded: 150,
    gold: 1450,
    streak: 45,
    avatarSkin: 'default_explorer',
    str: 18,
    dex: 12,
    int: 14,
    vit: 99,
    points: 3, // Starts with some allocation points
  });

  const [vocabList, setVocabList] = useState<VocabItem[]>(INITIAL_VOCAB);
  const [skins, setSkins] = useState<SkinsState>({
    owned: ['default_explorer'],
    equipped: 'default_explorer',
  });

  const [dailyQuestState, setDailyQuestState] = useState<DailyQuestState>(() => createDailyQuestState());
  const claimedQuestIdsRef = useRef(new Set<string>());

  const [guildInfo, setGuildInfo] = useState<GuildInfo>({
    name: '사천 짜장 마법사들',
    level: 3,
    exp: 420,
    expNeeded: 1000,
    contribution: 250,
    bossHp: 6400,
    bossMaxHp: 10000,
  });
  const [session, setSession] = useState<UserSession | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [accountSyncReady, setAccountSyncReady] = useState(false);
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>([]);
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);
  const [contentCatalog, setContentCatalog] = useState<ContentCatalog>(() => ({
    words: [],
    quests: [],
    rewards: [...DEFAULT_CONTENT_CATALOG.rewards],
  }));
  const contentWordIdsRef = useRef(new Set<number>());
  const accountVocabProgressRef = useRef(new Map<number, VocabProgress>());

  const activeLeague = '실버 리그 (Silver League)';

  // Persist state to localStorage on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('jeongo_stats');
      const savedVocab = localStorage.getItem('jeongo_vocab');
      const savedSkins = localStorage.getItem('jeongo_skins');
      const savedEvents = localStorage.getItem('jeongo_learning_events');
      const savedPlacement = localStorage.getItem('jeongo_placement');
      const savedDailyQuests = localStorage.getItem(DAILY_QUESTS_STORAGE_KEY);
      
      if (savedStats) {
        window.setTimeout(() => setStats(JSON.parse(savedStats) as UserStats), 0);
      }
      if (savedVocab) {
        try {
          const parsedSaved = JSON.parse(savedVocab) as Partial<VocabItem>[];
          if (parsedSaved.length < INITIAL_VOCAB.length) {
            const savedMap = new Map(parsedSaved.map((item) => [item.hanzi, item]));
            const migratedVocab = INITIAL_VOCAB.map(item => {
              const savedItem = savedMap.get(item.hanzi);
              if (savedItem) {
                return {
                  ...item,
                  isLearned: savedItem.isLearned ?? item.isLearned,
                  easiness: savedItem.easiness ?? item.easiness,
                  repetitions: savedItem.repetitions ?? item.repetitions,
                  intervalDays: savedItem.intervalDays ?? item.intervalDays,
                  nextReviewAt: savedItem.nextReviewAt ?? item.nextReviewAt
                };
              }
              return item;
            });
            window.setTimeout(() => setVocabList(migratedVocab), 0);
            localStorage.setItem('jeongo_vocab', JSON.stringify(migratedVocab));
          } else {
            window.setTimeout(() => setVocabList(parsedSaved as VocabItem[]), 0);
          }
        } catch (e) {
          console.error('Error migrating vocab list:', e);
          window.setTimeout(() => setVocabList(INITIAL_VOCAB), 0);
        }
      } else {
        window.setTimeout(() => setVocabList(INITIAL_VOCAB), 0);
      }
      if (savedSkins) {
        window.setTimeout(() => setSkins(JSON.parse(savedSkins) as SkinsState), 0);
      }
      localStorage.removeItem('jeongo_session');
      if (savedEvents) window.setTimeout(() => setLearningEvents(JSON.parse(savedEvents) as LearningEvent[]), 0);
      if (savedPlacement) window.setTimeout(() => setPlacementResult(JSON.parse(savedPlacement) as PlacementResult), 0);
      localStorage.removeItem('jeongo_content_catalog');

      const restoredDailyQuests = restoreDailyQuestState(savedDailyQuests);
      window.setTimeout(() => setDailyQuestState(restoredDailyQuests), 0);
      localStorage.setItem(DAILY_QUESTS_STORAGE_KEY, JSON.stringify(restoredDailyQuests));

      // Register PWA Service Worker (only in production / not on localhost)
      if ('serviceWorker' in navigator) {
        if (window.location.hostname === 'localhost') {
          // Unregister any active service worker on localhost to avoid dev caching issues
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
              console.log('Unregistered service worker on localhost');
            }
          });
        } else {
          window.addEventListener('load', () => {
            navigator.serviceWorker
              .register('/sw.js')
              .then((registration) => {
                console.log('PWA ServiceWorker registered with scope: ', registration.scope);
              })
              .catch((err) => {
                console.log('PWA ServiceWorker registration failed: ', err);
              });
          });
        }
      }
    }
  }, []);

  const applyContentCatalog = (catalog: ContentCatalog) => {
    const previousWordIds = contentWordIdsRef.current;
    const incomingWordIds = new Set(catalog.words.map((word) => word.id));
    const incomingWords = catalog.words.map((word) => ({
      ...word,
      ...accountVocabProgressRef.current.get(word.id),
    }));
    setVocabList((current) => [
      ...current.filter((word) => !previousWordIds.has(word.id) && !incomingWordIds.has(word.id)),
      ...incomingWords,
    ]);
    contentWordIdsRef.current = incomingWordIds;
    setContentCatalog(catalog);
  };

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/content', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        const { catalog } = (await response.json()) as { catalog: ContentCatalog };
        if (!cancelled) applyContentCatalog(catalog);
      })
      .catch((error) => console.error('Public content catalog load failed', error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!sessionResponse.ok) throw new Error('SESSION_LOOKUP_FAILED');
        const sessionData = (await sessionResponse.json()) as { user: UserSession | null };
        if (cancelled) return;
        if (!sessionData.user) {
          setAuthStatus('guest');
          return;
        }

        setSession(sessionData.user);
        setAuthStatus('authenticated');
        const snapshotResponse = await fetch('/api/account/snapshot', { cache: 'no-store' });
        if (!snapshotResponse.ok) throw new Error('SNAPSHOT_LOOKUP_FAILED');
        const snapshotData = (await snapshotResponse.json()) as { snapshot: AccountSnapshot | null };
        const snapshot = snapshotData.snapshot;
        if (!cancelled && snapshot?.version === 1) {
          setStats(snapshot.stats);
          setSkins(snapshot.skins);
          setDailyQuestState(refreshDailyQuestState(snapshot.dailyQuestState));
          setGuildInfo(snapshot.guildInfo);
          setLearningEvents(snapshot.learningEvents);
          setPlacementResult(snapshot.placementResult);
          const progress = new Map(snapshot.vocabProgress.map((item) => [item.id, item]));
          accountVocabProgressRef.current = progress;
          setVocabList((current) => current.map((word) => ({ ...word, ...progress.get(word.id) })));
        }
        if (!cancelled) setAccountSyncReady(true);
      } catch (error) {
        console.error('Server session restore failed', error);
        if (!cancelled) {
          setSession(null);
          setAuthStatus('guest');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session || !accountSyncReady) return;

    const timeoutId = window.setTimeout(() => {
      const snapshot: AccountSnapshot = {
        version: 1,
        stats,
        vocabProgress: vocabList.map(({ id, isLearned, easiness, repetitions, intervalDays, nextReviewAt }) => ({
          id,
          isLearned,
          easiness,
          repetitions,
          intervalDays,
          nextReviewAt,
        })),
        skins,
        dailyQuestState,
        guildInfo,
        learningEvents,
        placementResult,
      };
      void fetch('/api/account/snapshot', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      }).then((response) => {
        if (!response.ok) console.error('Account snapshot sync failed', response.status);
      });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [accountSyncReady, dailyQuestState, guildInfo, learningEvents, placementResult, session, skins, stats, vocabList]);

  useEffect(() => {
    const refreshDailyQuests = () => {
      setDailyQuestState((current) => {
        const refreshed = refreshDailyQuestState(current);
        if (refreshed !== current) {
          claimedQuestIdsRef.current.clear();
          localStorage.setItem(DAILY_QUESTS_STORAGE_KEY, JSON.stringify(refreshed));
        }
        return refreshed;
      });
    };

    const intervalId = window.setInterval(refreshDailyQuests, 60_000);
    document.addEventListener('visibilitychange', refreshDailyQuests);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshDailyQuests);
    };
  }, []);

  const saveToLocalStorage = (newStats: UserStats, newVocab: VocabItem[], newSkins: SkinsState) => {
    localStorage.setItem('jeongo_stats', JSON.stringify(newStats));
    localStorage.setItem('jeongo_vocab', JSON.stringify(newVocab));
    localStorage.setItem('jeongo_skins', JSON.stringify(newSkins));
  };

  const addXP = (amount: number) => {
    setStats((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newXpNeeded = prev.xpNeeded;
      let newPoints = prev.points;

      while (newXp >= newXpNeeded) {
        newXp -= newXpNeeded;
        newLevel += 1;
        newXpNeeded = Math.floor(newXpNeeded * 1.5);
        newPoints += 3; // 3 points per level up
      }

      const updated = {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpNeeded: newXpNeeded,
        points: newPoints,
      };
      
      saveToLocalStorage(updated, vocabList, skins);
      return updated;
    });
  };

  const addGold = (amount: number) => {
    setStats((prev) => {
      const updated = { ...prev, gold: prev.gold + amount };
      saveToLocalStorage(updated, vocabList, skins);
      return updated;
    });
  };

  const spendGold = (amount: number): boolean => {
    if (stats.gold < amount) return false;
    setStats((prev) => {
      const updated = { ...prev, gold: prev.gold - amount };
      saveToLocalStorage(updated, vocabList, skins);
      return updated;
    });
    return true;
  };

  const allocateStats = (allocation: StatAllocation) => {
    const allocatedPoints = totalAllocatedPoints(allocation);
    if (allocatedPoints <= 0) return;
    setStats((prev) => {
      const isValid = Object.values(allocation).every((value) => Number.isInteger(value) && value >= 0);
      if (!isValid || allocatedPoints > prev.points) return prev;

      const updated = {
        ...prev,
        str: prev.str + allocation.str,
        dex: prev.dex + allocation.dex,
        int: prev.int + allocation.int,
        vit: prev.vit + allocation.vit,
        points: prev.points - allocatedPoints,
      };
      saveToLocalStorage(updated, vocabList, skins);
      return updated;
    });
  };

  // SuperMemo-2 (SM2) Algorithm
  const updateSrsWord = (wordId: number, quality: number) => {
    setVocabList((prevVocab) => {
      const updatedVocab = prevVocab.map((item) => {
        if (item.id !== wordId) return item;

        const { easiness, repetitions, intervalDays } = calculateSm2(item, quality);

        // Calculate next review date
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

        return {
          ...item,
          easiness,
          repetitions,
          intervalDays,
          nextReviewAt: nextReviewAt.toISOString(),
        };
      });

      saveToLocalStorage(stats, updatedVocab, skins);
      return updatedVocab;
    });
    
    // Add rewards for reviewing a word
    addXP(10);
    addGold(5);
  };

  const equipSkin = (skinId: string) => {
    if (!skins.owned.includes(skinId)) return;
    setSkins((prev) => {
      const updated = { ...prev, equipped: skinId };
      saveToLocalStorage(stats, vocabList, updated);
      return updated;
    });
    setStats((prev) => {
      const updated = { ...prev, avatarSkin: skinId };
      saveToLocalStorage(updated, vocabList, { ...skins, equipped: skinId });
      return updated;
    });
  };

  const buySkin = (skinId: string, cost: number): boolean => {
    if (skins.owned.includes(skinId)) return true;
    if (stats.gold < cost) return false;

    const newSkins = {
      ...skins,
      owned: [...skins.owned, skinId],
    };

    setSkins(newSkins);
    setStats((prev) => {
      const updated = {
        ...prev,
        gold: prev.gold - cost,
      };
      saveToLocalStorage(updated, vocabList, newSkins);
      return updated;
    });
    return true;
  };

  const contributeToGuild = (goldAmount: number) => {
    if (stats.gold < goldAmount) return;
    spendGold(goldAmount);

    setGuildInfo((prev) => {
      let newExp = prev.exp + Math.floor(goldAmount / 2);
      let newLevel = prev.level;
      let newExpNeeded = prev.expNeeded;

      while (newExp >= newExpNeeded) {
        newExp -= newExpNeeded;
        newLevel += 1;
        newExpNeeded = Math.floor(newExpNeeded * 1.5);
      }

      const newBossHp = Math.max(0, prev.bossHp - goldAmount * 3);

      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        expNeeded: newExpNeeded,
        contribution: prev.contribution + goldAmount,
        bossHp: newBossHp,
      };
    });

  };

  const toggleLearnWord = (wordId: number) => {
    setVocabList((prevVocab) => {
      const updatedVocab = prevVocab.map((item) => {
        if (item.id === wordId) {
          const newLearned = !item.isLearned;
          return {
            ...item,
            isLearned: newLearned,
            easiness: 2.5,
            repetitions: 0,
            intervalDays: 0,
            nextReviewAt: new Date().toISOString(),
          };
        }
        return item;
      });
      saveToLocalStorage(stats, updatedVocab, skins);
      return updatedVocab;
    });
  };

  const loadAccountSnapshot = async () => {
    const response = await fetch('/api/account/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(await readApiError(response));
    const { snapshot } = (await response.json()) as { snapshot: AccountSnapshot | null };
    if (!snapshot || snapshot.version !== 1) return;

    setStats(snapshot.stats);
    setSkins(snapshot.skins);
    setDailyQuestState(refreshDailyQuestState(snapshot.dailyQuestState));
    setGuildInfo(snapshot.guildInfo);
    setLearningEvents(snapshot.learningEvents);
    setPlacementResult(snapshot.placementResult);
    const progress = new Map(snapshot.vocabProgress.map((item) => [item.id, item]));
    accountVocabProgressRef.current = progress;
    setVocabList((current) => current.map((word) => ({ ...word, ...progress.get(word.id) })));
  };

  const authenticate = async (path: '/api/auth/login' | '/api/auth/register', payload: Record<string, string>) => {
    setAccountSyncReady(false);
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response));

    const { user } = (await response.json()) as { user: UserSession };
    setSession(user);
    setAuthStatus('authenticated');
    await loadAccountSnapshot();
    setAccountSyncReady(true);
    recordLearningEvent({ type: 'login', correct: 0, total: 0, xp: 0, gold: 0 });
  };

  const login = (email: string, password: string) => authenticate('/api/auth/login', { email, password });

  const register = (email: string, name: string, password: string) =>
    authenticate('/api/auth/register', { email, name, password });

  const logout = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) throw new Error(await readApiError(response));
    for (const key of [
      'jeongo_stats',
      'jeongo_vocab',
      'jeongo_skins',
      'jeongo_learning_events',
      'jeongo_placement',
      DAILY_QUESTS_STORAGE_KEY,
    ]) {
      localStorage.removeItem(key);
    }
    setAccountSyncReady(false);
    accountVocabProgressRef.current.clear();
    setSession(null);
    setAuthStatus('guest');
  };

  const recordLearningEvent = (event: Omit<LearningEvent, 'id' | 'occurredAt'> & { occurredAt?: string }) => {
    setLearningEvents((current) => {
      const next = [...current, {
        ...event,
        id: `${Date.now()}-${current.length}`,
        occurredAt: event.occurredAt ?? new Date().toISOString(),
      }];
      localStorage.setItem('jeongo_learning_events', JSON.stringify(next));
      return next;
    });

    setDailyQuestState((current) => {
      const next = applyLearningEventToDailyQuests(current, event);
      if (next !== current) localStorage.setItem(DAILY_QUESTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const claimDailyQuest = (questId: string) => {
    const quest = dailyQuestState.quests.find((item) => item.id === questId);
    const canClaim = quest && quest.current >= quest.target && !quest.claimed;
    if (!canClaim || claimedQuestIdsRef.current.has(questId)) return;

    claimedQuestIdsRef.current.add(questId);
    setDailyQuestState((current) => {
      const next = {
        ...current,
        quests: current.quests.map((item) => (item.id === questId ? { ...item, claimed: true } : item)),
      };
      localStorage.setItem(DAILY_QUESTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    addGold(quest.gold);
    addXP(quest.xp);
    recordLearningEvent({ type: 'reward', correct: 0, total: 0, xp: quest.xp, gold: quest.gold });
  };

  const savePlacementResult = (result: PlacementResult) => {
    setPlacementResult(result);
    localStorage.setItem('jeongo_placement', JSON.stringify(result));
  };

  const saveContentCatalog = async (catalog: ContentCatalog) => {
    const response = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ catalog }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    const { catalog: savedCatalog } = (await response.json()) as { catalog: ContentCatalog };
    applyContentCatalog(savedCatalog);
  };

  const analytics = buildAnalytics(learningEvents);

  return (
    <AppContext.Provider
      value={{
        stats,
        vocabList,
        skins,
        addXP,
        addGold,
        spendGold,
        allocateStats,
        updateSrsWord,
        toggleLearnWord,
        equipSkin,
        buySkin,
        claimDailyQuest,
        dailyQuests: dailyQuestState.quests,
        activeLeague,
        guildInfo,
        contributeToGuild,
        session,
        authStatus,
        login,
        register,
        logout,
        learningEvents,
        recordLearningEvent,
        placementResult,
        savePlacementResult,
        analytics,
        contentCatalog,
        saveContentCatalog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
