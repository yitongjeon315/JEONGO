export type CharacterStatKey = 'str' | 'dex' | 'int' | 'vit';
export type DungeonMode = 'vocab' | 'writing';

export interface CharacterStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
}

export interface StatAllocation {
  str: number;
  dex: number;
  int: number;
  vit: number;
}

export interface GrowthTier {
  title: string;
  minLevel: number;
  nextLevel: number | null;
  nextTitle: string | null;
  auraClass: string;
}

const GROWTH_TIERS = [
  { minLevel: 1, title: '초보 모험가', auraClass: 'shadow-sky-500/20' },
  { minLevel: 5, title: '숙련 모험가', auraClass: 'shadow-emerald-400/30' },
  { minLevel: 10, title: '중국어 전사', auraClass: 'shadow-cyan-400/30' },
  { minLevel: 20, title: '성조 마스터', auraClass: 'shadow-violet-400/30' },
  { minLevel: 30, title: 'HSK 정복자', auraClass: 'shadow-amber-300/40' },
] as const;

export const EMPTY_STAT_ALLOCATION: StatAllocation = { str: 0, dex: 0, int: 0, vit: 0 };

export function getGrowthTier(level: number): GrowthTier {
  let currentIndex = 0;
  for (let index = GROWTH_TIERS.length - 1; index >= 0; index -= 1) {
    if (level >= GROWTH_TIERS[index].minLevel) {
      currentIndex = index;
      break;
    }
  }
  const current = GROWTH_TIERS[Math.max(0, currentIndex)];
  const next = GROWTH_TIERS[currentIndex + 1];
  return {
    ...current,
    nextLevel: next?.minLevel ?? null,
    nextTitle: next?.title ?? null,
  };
}

export function getAttackDamage(strength: number, mode: DungeonMode, critical = false): number {
  const baseDamage = mode === 'vocab' ? 10 : 15;
  return Math.max(1, baseDamage + strength + (critical ? 10 : 0));
}

export function getDungeonMaxHp(mode: DungeonMode, questionCount: number, strength: number): number {
  const normalDamage = getAttackDamage(strength, mode);
  const expectedCriticalCount = Math.floor(questionCount / 3);
  return questionCount * normalDamage + expectedCriticalCount * 10;
}

export function getStrengthBonusDamage(strength: number): number {
  return Math.max(0, strength - 15);
}

export function totalAllocatedPoints(allocation: StatAllocation): number {
  return Object.values(allocation).reduce((sum, value) => sum + value, 0);
}

export function previewStats(stats: CharacterStats, allocation: StatAllocation): CharacterStats {
  return {
    str: stats.str + allocation.str,
    dex: stats.dex + allocation.dex,
    int: stats.int + allocation.int,
    vit: stats.vit + allocation.vit,
  };
}
