import { levelFromXp, XP_PER_LEVEL, type Progress } from '@/game/progress';
import { masterGames } from '@shared/data/masters';

/**
 * Progression gates. Harder engine levels and grandmaster opponents unlock as
 * the player earns XP (i.e. climbs levels) — so beginners meet a gentle ladder
 * and stronger play is a reward. Everything is derived from the synced progress
 * (XP), so unlock state follows the account with no extra storage.
 */
export type Unlock = { unlocked: boolean; needLevel: number; requirement: string };

export const xpForLevel = (lvl: number) => (lvl - 1) * XP_PER_LEVEL;

function gate(needLevel: number, xp: number): Unlock {
  return {
    unlocked: levelFromXp(xp) >= needLevel,
    needLevel,
    requirement: `Reach level ${needLevel} · ${xpForLevel(needLevel)} XP`,
  };
}

export type EngineLevelId = 'easy' | 'medium' | 'hard' | 'gm';

/** Every difficulty is open — players pick freely (Grandmaster included). */
export function computerLevelUnlock(_levelId: EngineLevelId, _p: Progress): Unlock {
  return { unlocked: true, needLevel: 1, requirement: '' };
}

/**
 * Grandmaster *play* tiers (watching/reviewing a classic is always free). The
 * library is bucketed into four tiers by position, so a mix opens early and the
 * rest ladders up: L1 → L2 → L3 → L4.
 */
export function masterPlayUnlock(masterId: string, p: Progress): Unlock {
  const idx = masterGames.findIndex((g) => g.id === masterId);
  const need = idx < 0 ? 1 : idx < 3 ? 1 : idx < 6 ? 2 : idx < 9 ? 3 : 4;
  return gate(need, p.xp);
}
