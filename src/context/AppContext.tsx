'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Vocabulary Item Type
export interface VocabItem {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk: string;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleMeaning?: string;
  
  // SRS parameters
  easiness: number;
  repetitions: number;
  intervalDays: number;
  nextReviewAt: string; // ISO string
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

interface AppContextType {
  stats: UserStats;
  vocabList: VocabItem[];
  skins: SkinsState;
  addXP: (amount: number) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  allocateStat: (stat: 'str' | 'dex' | 'int' | 'vit') => void;
  updateSrsWord: (wordId: number, quality: number) => void;
  equipSkin: (skinId: string) => void;
  buySkin: (skinId: string, cost: number) => boolean;
  completeDailyQuest: (questId: string, goldReward: number, xpReward: number) => void;
  dailyQuests: DailyQuest[];
  activeLeague: string;
  guildInfo: GuildInfo;
  contributeToGuild: (goldAmount: number) => void;
}

interface DailyQuest {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  completed: boolean;
  gold: number;
  xp: number;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Vocab Data (HSK 1-3)
const INITIAL_VOCAB: VocabItem[] = [
  { id: 1, hanzi: '苹果', pinyin: 'píngguǒ', meaning: '사과', hsk: 'HSK 1', exampleHanzi: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleMeaning: '나는 사과를 먹는 것을 좋아한다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 2, hanzi: '汉堡包', pinyin: 'hànbǎobāo', meaning: '햄버거', hsk: 'HSK 3', exampleHanzi: '这个汉堡包很好吃。', examplePinyin: 'Zhège hànbǎobāo hěn hǎochī.', exampleMeaning: '이 햄버거는 정말 맛있다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 3, hanzi: '电脑', pinyin: 'diànnǎo', meaning: '컴퓨터', hsk: 'HSK 1', exampleHanzi: '我的电脑坏了。', examplePinyin: 'Wǒ de diànnǎo huài le.', exampleMeaning: '내 컴퓨터가 고장 났다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 4, hanzi: '谢谢', pinyin: 'xièxie', meaning: '감사합니다', hsk: 'HSK 1', exampleHanzi: '谢谢你的帮助。', examplePinyin: 'Xièxie nǐ de bāngzhù.', exampleMeaning: '도와줘서 고마워.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 5, hanzi: '学习', pinyin: 'xuéxí', meaning: '공부하다', hsk: 'HSK 2', exampleHanzi: '我们在学校学习中文。', examplePinyin: 'Wǒmen zài xuéxiào xuéxí Zhōngwén.', exampleMeaning: '우리는 학교에서 중국어를 공부한다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 6, hanzi: '咖啡', pinyin: 'kāfēi', meaning: '커피', hsk: 'HSK 1', exampleHanzi: '我要一杯热咖啡。', examplePinyin: 'Wǒ yào yī bēi rè kāfēi.', exampleMeaning: '뜨거운 커피 한 잔 주세요.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 7, hanzi: '手机', pinyin: 'shǒujī', meaning: '휴대폰', hsk: 'HSK 2', exampleHanzi: '你想买新手机吗？', examplePinyin: 'Nǐ xiǎng mǎi xīn shǒujī ma?', exampleMeaning: '새 휴대폰 사고 싶니?', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
  { id: 8, hanzi: '朋友', pinyin: 'péngyou', meaning: '친구', hsk: 'HSK 1', exampleHanzi: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleMeaning: '그는 내 좋은 친구이다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date(Date.now() - 3600000 * 24).toISOString() }, // Yesterday (Review ready)
  { id: 9, hanzi: '漂亮', pinyin: 'piàoliang', meaning: '예쁘다', hsk: 'HSK 2', exampleHanzi: '这里的景色很漂亮。', examplePinyin: 'Zhèlǐ de jǐngsè hěn piàoliang.', exampleMeaning: '이곳의 풍경이 아주 예쁘다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date(Date.now() - 3600000 * 12).toISOString() }, // 12 hours ago (Review ready)
  { id: 10, hanzi: '饺子', pinyin: 'jiǎozi', meaning: '만두', hsk: 'HSK 3', exampleHanzi: '中国人过年吃饺子。', examplePinyin: 'Zhōngguórén guònián chī jiǎozi.', exampleMeaning: '중국인은 새해에 만두를 먹는다.', easiness: 2.5, repetitions: 0, intervalDays: 0, nextReviewAt: new Date().toISOString() },
];

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

  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([
    { id: 'q1', title: '일일 던전 클리어', desc: '어휘 던전 전투에서 승리하세요.', target: 1, current: 0, completed: false, gold: 150, xp: 30 },
    { id: 'q2', title: '성조 마스터', desc: 'AI 튜터에게 80점 이상의 발음 판정을 받으세요.', target: 1, current: 0, completed: false, gold: 200, xp: 50 },
    { id: 'q3', title: '골드 기여', desc: '길드 퀘스트 보스 물리치기를 위해 100 골드를 기부하세요.', target: 100, current: 0, completed: false, gold: 100, xp: 20 },
  ]);

  const [guildInfo, setGuildInfo] = useState<GuildInfo>({
    name: '사천 짜장 마법사들',
    level: 3,
    exp: 420,
    expNeeded: 1000,
    contribution: 250,
    bossHp: 6400,
    bossMaxHp: 10000,
  });

  const activeLeague = '실버 리그 (Silver League)';

  // Persist state to localStorage on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('jeongo_stats');
      const savedVocab = localStorage.getItem('jeongo_vocab');
      const savedSkins = localStorage.getItem('jeongo_skins');
      
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedVocab) setVocabList(JSON.parse(savedVocab));
      if (savedSkins) setSkins(JSON.parse(savedSkins));
    }
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

  const allocateStat = (stat: 'str' | 'dex' | 'int' | 'vit') => {
    if (stats.points <= 0) return;
    setStats((prev) => {
      const updated = {
        ...prev,
        [stat]: prev[stat] + 1,
        points: prev.points - 1,
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

        let { easiness, repetitions, intervalDays } = item;

        // Correct answer
        if (quality >= 3) {
          if (repetitions === 0) {
            intervalDays = 1;
          } else if (repetitions === 1) {
            intervalDays = 6;
          } else {
            intervalDays = Math.round(intervalDays * easiness);
          }
          repetitions += 1;
        } else {
          // Incorrect answer, reset interval
          repetitions = 0;
          intervalDays = 1;
        }

        // Adjust Easiness Factor
        easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easiness < 1.3) easiness = 1.3;

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

  const completeDailyQuest = (questId: string, goldReward: number, xpReward: number) => {
    setDailyQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, current: q.target, completed: true } : q))
    );
    addGold(goldReward);
    addXP(xpReward);
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

    // Mark Daily Quest 3 progress
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'q3') {
          const newCurrent = Math.min(q.target, q.current + goldAmount);
          return {
            ...q,
            current: newCurrent,
            completed: newCurrent >= q.target,
          };
        }
        return q;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        stats,
        vocabList,
        skins,
        addXP,
        addGold,
        spendGold,
        allocateStat,
        updateSrsWord,
        equipSkin,
        buySkin,
        completeDailyQuest,
        dailyQuests,
        activeLeague,
        guildInfo,
        contributeToGuild,
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
