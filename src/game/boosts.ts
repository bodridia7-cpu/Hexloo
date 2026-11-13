// Coin boosts and the timed golden 3x button. Pure logic.

export const BOOST2_MS = 10 * 60 * 1000; // green "AD FOR 2x Coin"
export const BOOST3_AD_MS = 10 * 60 * 1000; // golden "AD FOR 3x Coin"
export const SPIN_BOOST_MS = 24 * 60 * 60 * 1000; // spin wheel rare prize
export const GOLDEN_EVERY_SECONDS = 30 * 60; // of playtime
export const GOLDEN_VISIBLE_MS = 60 * 1000;

export type BoostState = { boostUntil: number; boost3Until: number };

/** 3x beats 2x; they never multiply together. */
export function coinMultiplier(s: BoostState, now: number): 1 | 2 | 3 {
  if (s.boost3Until > now) return 3;
  if (s.boostUntil > now) return 2;
  return 1;
}

/** Adds time to a boost; an active boost is extended rather than restarted. */
export function extendBoost(until: number, now: number, ms: number): number {
  return Math.max(until, now) + ms;
}

export type GoldenState = { timePlayed: number; goldenNextAt: number; goldenUntil: number };

/** Called as playtime grows: shows the golden button every 30 minutes of play for 60 seconds. */
export function tickGolden(s: GoldenState, now: number): Pick<GoldenState, "goldenNextAt" | "goldenUntil"> {
  if (s.timePlayed >= s.goldenNextAt) {
    return { goldenNextAt: s.timePlayed + GOLDEN_EVERY_SECONDS, goldenUntil: now + GOLDEN_VISIBLE_MS };
  }
  return { goldenNextAt: s.goldenNextAt, goldenUntil: s.goldenUntil };
}

export function goldenVisible(s: Pick<GoldenState, "goldenUntil">, now: number): boolean {
  return s.goldenUntil > now;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
