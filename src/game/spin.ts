// Lucky Spin Wheel. Pure logic: odds, prizes and applying them to the player.
import { setForMonth, type Category } from "./catalog";
import { extendBoost, SPIN_BOOST_MS } from "./boosts";
import type { Rng } from "./engine";

export const SPIN_COST = 500;
export const SPIN10_COST = 5000;
export const COIN_PRIZES = [150, 300, 500, 800] as const;
export const DUPLICATE_BONUS = 2500;
export const ODDS = { coins: 0.75, boost: 0.2, mega: 0.05 } as const;

export type SpinPrize =
  | { kind: "coins"; amount: number }
  | { kind: "boost" }
  | { kind: "mega"; category: Category; id: string; name: string };

export function rollSpin(rng: Rng, date: Date): SpinPrize {
  const r = rng();
  if (r < ODDS.coins) {
    return { kind: "coins", amount: COIN_PRIZES[Math.floor(rng() * COIN_PRIZES.length)]! };
  }
  if (r < ODDS.coins + ODDS.boost) return { kind: "boost" };
  const set = setForMonth(date);
  const cats: Category[] = ["background", "hexa", "base"];
  const category = cats[Math.floor(rng() * cats.length)]!;
  const item = set[category];
  return { kind: "mega", category, id: item.id, name: item.name };
}

export type SpinTarget = { coins: number; boost3Until: number; unlocked: string[] };
export type SpinOutcome = SpinPrize & { duplicate?: boolean };

/** Applies prizes in order. A limited item already owned turns into +2,500 coins. */
export function applyPrizes<T extends SpinTarget>(s: T, prizes: SpinPrize[], now: number): { state: T; outcomes: SpinOutcome[] } {
  let coins = s.coins;
  let boost3Until = s.boost3Until;
  const unlocked = s.unlocked.slice();
  const outcomes: SpinOutcome[] = [];
  for (const p of prizes) {
    if (p.kind === "coins") {
      coins += p.amount;
      outcomes.push(p);
    } else if (p.kind === "boost") {
      boost3Until = extendBoost(boost3Until, now, SPIN_BOOST_MS);
      outcomes.push(p);
    } else {
      const key = `${p.category}:${p.id}`;
      if (unlocked.includes(key)) {
        coins += DUPLICATE_BONUS;
        outcomes.push({ ...p, duplicate: true });
      } else {
        unlocked.push(key);
        outcomes.push(p);
      }
    }
  }
  return { state: { ...s, coins, boost3Until, unlocked }, outcomes };
}

/** Wheel segments, clockwise from the top pointer. */
export const SEGMENTS: { label: string; match: (p: SpinPrize) => boolean }[] = [
  { label: "$150", match: (p) => p.kind === "coins" && p.amount === 150 },
  { label: "$500", match: (p) => p.kind === "coins" && p.amount === 500 },
  { label: "3x 24h", match: (p) => p.kind === "boost" },
  { label: "$300", match: (p) => p.kind === "coins" && p.amount === 300 },
  { label: "MEGA", match: (p) => p.kind === "mega" },
  { label: "$800", match: (p) => p.kind === "coins" && p.amount === 800 },
  { label: "3x 24h", match: (p) => p.kind === "boost" },
  { label: "$300", match: (p) => p.kind === "coins" && p.amount === 300 },
];

export function segmentFor(p: SpinPrize): number {
  const i = SEGMENTS.findIndex((s) => s.match(p));
  return i < 0 ? 0 : i;
}
