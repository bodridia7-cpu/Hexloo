import { describe, expect, it } from "vitest";

import { COIN_BUNDLES, LIMITED_SETS, setForMonth } from "../catalog";
import {
  BOOST3_AD_MS,
  coinMultiplier,
  extendBoost,
  GOLDEN_EVERY_SECONDS,
  GOLDEN_VISIBLE_MS,
  goldenVisible,
  SPIN_BOOST_MS,
  tickGolden,
} from "../boosts";
import { applyPrizes, COIN_PRIZES, DUPLICATE_BONUS, ODDS, rollSpin, SPIN10_COST, SPIN_COST } from "../spin";
import { BOARD_SIZE, getRivals, leaderboard } from "../ranks";
import { mulberry32 } from "../engine";

describe("coin boosts", () => {
  it("3x beats 2x and they never stack", () => {
    expect(coinMultiplier({ boostUntil: 100, boost3Until: 100 }, 50)).toBe(3);
    expect(coinMultiplier({ boostUntil: 100, boost3Until: 0 }, 50)).toBe(2);
    expect(coinMultiplier({ boostUntil: 0, boost3Until: 0 }, 50)).toBe(1);
  });
  it("golden ad boost lasts 10 minutes, spin boost 24 hours and adds on", () => {
    expect(BOOST3_AD_MS).toBe(10 * 60 * 1000);
    expect(SPIN_BOOST_MS).toBe(24 * 60 * 60 * 1000);
    const now = 1_000_000;
    const once = extendBoost(0, now, SPIN_BOOST_MS);
    expect(once).toBe(now + SPIN_BOOST_MS);
    expect(extendBoost(once, now, SPIN_BOOST_MS)).toBe(now + 2 * SPIN_BOOST_MS);
  });
});

describe("golden 3x button", () => {
  it("appears every 30 minutes of playtime for 60 seconds", () => {
    expect(GOLDEN_EVERY_SECONDS).toBe(1800);
    expect(GOLDEN_VISIBLE_MS).toBe(60_000);
    const before = tickGolden({ timePlayed: 1795, goldenNextAt: 1800, goldenUntil: 0 }, 0);
    expect(goldenVisible(before, 0)).toBe(false);
    const now = 5_000;
    const at = tickGolden({ timePlayed: 1800, goldenNextAt: 1800, goldenUntil: 0 }, now);
    expect(at.goldenNextAt).toBe(3600);
    expect(goldenVisible(at, now + 59_000)).toBe(true);
    expect(goldenVisible(at, now + 60_000)).toBe(false);
  });
});

describe("spin wheel", () => {
  it("costs $500 for one spin and $5,000 for ten", () => {
    expect(SPIN_COST).toBe(500);
    expect(SPIN10_COST).toBe(5000);
  });
  it("rolls roughly 75% coins, 20% boost, 5% mega", () => {
    expect(ODDS).toEqual({ coins: 0.75, boost: 0.2, mega: 0.05 });
    const rng = mulberry32(42);
    const n = 20000;
    const counts = { coins: 0, boost: 0, mega: 0 };
    for (let i = 0; i < n; i++) counts[rollSpin(rng, new Date(2026, 0, 1)).kind]++;
    expect(counts.coins / n).toBeCloseTo(0.75, 1);
    expect(counts.boost / n).toBeCloseTo(0.2, 1);
    expect(counts.mega / n).toBeCloseTo(0.05, 1);
  });
  it("pays only the agreed coin prizes", () => {
    expect([...COIN_PRIZES]).toEqual([150, 300, 500, 800]);
  });
  it("turns a duplicate limited item into +$2,500", () => {
    const prize = { kind: "mega", category: "hexa", id: "cherry", name: "Sakura Petals" } as const;
    const first = applyPrizes({ coins: 0, boost3Until: 0, unlocked: [] }, [prize], 0);
    expect(first.state.unlocked).toContain("hexa:cherry");
    const again = applyPrizes(first.state, [prize], 0);
    expect(DUPLICATE_BONUS).toBe(2500);
    expect(again.state.coins).toBe(2500);
    expect(again.outcomes[0]).toMatchObject({ duplicate: true });
  });
  it("rotates the limited set every calendar month across at least 4 sets", () => {
    expect(LIMITED_SETS.length).toBeGreaterThanOrEqual(4);
    const ids = Array.from({ length: 4 }, (_, m) => setForMonth(new Date(2026, m, 5)).id);
    expect(new Set(ids).size).toBe(4);
  });
});

describe("leaderboard", () => {
  it("shows 100 ranks per tab", () => {
    expect(BOARD_SIZE).toBe(100);
    expect(getRivals().length).toBeGreaterThanOrEqual(100);
    const rows = leaderboard("cash", { name: "Me", avatar: "bunny", color: "1", time: 0, level: 1, cash: 0 });
    expect(rows.slice(0, BOARD_SIZE).map((r) => r.rank)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });
});

describe("coin bundles", () => {
  it("sells 1,000 for $1, 10,000 for $9 and 50,000 for $45", () => {
    expect(COIN_BUNDLES.map((b) => [b.coins, b.price])).toEqual([
      [1000, "$1"],
      [10000, "$9"],
      [50000, "$45"],
    ]);
  });
});
