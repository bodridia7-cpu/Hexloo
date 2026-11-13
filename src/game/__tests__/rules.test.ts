import { describe, expect, it } from "vitest";

import {
  CELLS,
  canDrop,
  clearBonus,
  colourCounts,
  generateLevel,
  isCleared,
  moveGroup,
  mulberry32,
  popReward,
  popStack,
  type Board,
} from "../engine";
import { BACKGROUNDS, BASES, HEXAS, STARTING_COINS, DAILY_GIFT, WATCH_AD_REWARD } from "../catalog";
import { checkMonthly, prizeForRank, type PlayerStats } from "../ranks";

const empty = (): Board => ({ stacks: CELLS.map(() => []) });

describe("board generation", () => {
  it("spawns every colour as an exact multiple of 10 tiles", () => {
    for (let level = 1; level <= 30; level++) {
      const b = generateLevel(level, mulberry32(level * 99));
      for (const n of colourCounts(b).values()) expect(n % 10).toBe(0);
    }
  });

  it("fills roughly half of the hexagon slots", () => {
    const b = generateLevel(1, mulberry32(7));
    const filled = b.stacks.filter((s) => s.length > 0).length;
    expect(filled).toBeGreaterThanOrEqual(Math.floor(CELLS.length / 2) - 1);
    expect(filled).toBeLessThanOrEqual(Math.ceil(CELLS.length / 2) + 1);
  });
});

describe("top-colour dragging", () => {
  it("moves only the contiguous top colour group", () => {
    const b = empty();
    b.stacks[0] = [0, 0, 0, 0, 1, 1, 2, 2, 2, 2]; // 4 blue, 2 pink, 4 yellow on top
    const nb = moveGroup(b, 0, 1);
    expect(nb.stacks[0]).toEqual([0, 0, 0, 0, 1, 1]);
    expect(nb.stacks[1]).toEqual([2, 2, 2, 2]);
  });

  it("allows dropping only on an empty slot or a matching top colour", () => {
    const b = empty();
    b.stacks[0] = [1, 2];
    b.stacks[1] = [2];
    b.stacks[2] = [1];
    expect(canDrop(b, 0, 1)).toBe(true);
    expect(canDrop(b, 0, 2)).toBe(false);
    expect(canDrop(b, 0, 3)).toBe(true);
  });

  it("pops exactly 10 matching tiles off the top", () => {
    const b = empty();
    b.stacks[0] = [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    const nb = popStack(b, 0);
    expect(nb.stacks[0]).toEqual([3, 4]);
  });

  it("detects a cleared board", () => {
    expect(isCleared(empty())).toBe(true);
  });
});

describe("coins", () => {
  it("pays +10 per pop, +20 with the 2x boost", () => {
    expect(popReward(1)).toBe(10);
    expect(popReward(2)).toBe(20);
  });
  it("pays a +50 board clear bonus, +100 with the 2x boost", () => {
    expect(clearBonus(1)).toBe(50);
    expect(clearBonus(2)).toBe(100);
  });
  it("uses the agreed gift and ad rewards and starting balance", () => {
    expect(STARTING_COINS).toBe(40);
    expect(DAILY_GIFT).toBe(25);
    expect(WATCH_AD_REWARD).toBe(50);
  });
});

describe("shop prices", () => {
  const price = (list: { name: string; price: number }[]) =>
    Object.fromEntries(list.map((i) => [i.name, i.price]));
  it("prices backgrounds cheapest first", () => {
    expect(price(BACKGROUNDS)).toEqual({
      "Sage Leaves": 0, "Fluffy Clouds": 50, Desert: 80, "Sunset Beach": 120, "Cute Ribbons": 160,
      Candy: 200, "Lush Forest": 260, "Misty Mountains": 320, "Snowy Mountain": 400, "Rainy Window": 500,
      "Midnight Sky": 650, "Cozy Cabin": 850, Underwater: 1100, Cityscape: 1400, Cyber: 1800, "Custom Image": 10000,
    });
  });
  it("prices hexa tiles cheapest first", () => {
    expect(price(HEXAS)).toEqual({
      "Matte Palette": 0, Dots: 60, Stripes: 90, "Sand Blocks": 130, "Warm Wood": 180, Marshmallow: 240,
      Yarn: 320, Sparkles: 420, Stars: 550, "Glossy Glass": 750, "Neon Glow": 1000, Cyber: 1500, "Custom Hexa": 12000,
    });
  });
  it("prices bases cheapest first", () => {
    expect(price(BASES)).toEqual({
      "Classic Cream": 0, Sand: 60, Clouds: 100, "Tree Stump": 160, "Swirly Lolly": 240, "Deep Ocean": 350,
      Neon: 500, "Golden Marble": 750, Cyber: 1100, Galaxy: 1600, "Custom Base": 12000,
    });
  });
});

describe("monthly top-10 prize", () => {
  it("pays by rank", () => {
    expect([1, 2, 3, 4, 5, 10, 11].map(prizeForRank)).toEqual([10000, 8000, 5000, 2000, 1000, 1000, 0]);
  });

  const champ: PlayerStats = { name: "Me", avatar: "person", color: "1", time: 0, level: 9999, cash: 0 };

  it("only pays when a new calendar month starts", () => {
    expect(checkMonthly(null, new Date(2026, 10, 12), champ).prize).toBe(0);
    expect(checkMonthly("2026-11", new Date(2026, 10, 30), champ).prize).toBe(0);
    expect(checkMonthly("2026-11", new Date(2026, 11, 1), champ).prize).toBe(10000);
  });

  it("pays nothing outside the top 10", () => {
    const newbie = { ...champ, level: 1 };
    expect(checkMonthly("2026-11", new Date(2026, 11, 1), newbie).prize).toBe(0);
  });
});
