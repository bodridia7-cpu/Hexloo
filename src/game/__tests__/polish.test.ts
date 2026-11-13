import { describe, expect, it } from "vitest";

import { CELLS, canDrop, suggestMove, type Board } from "../engine";
import { HARD_LEVEL_BONUS, hardLevelBonus } from "../hard";
import { DEFAULT_PLAYER, migrate, needsTutorial } from "../store";

const board = (fill: Record<number, number[]>): Board => ({ stacks: CELLS.map((_, i) => fill[i] ?? []) });

describe("hard mode level bonus", () => {
  it("is +50 coins per level up", () => {
    expect(HARD_LEVEL_BONUS).toBe(50);
    expect(hardLevelBonus(1)).toBe(50);
  });
  it("is multiplied by 2x and 3x coin boosts", () => {
    expect(hardLevelBonus(2)).toBe(100);
    expect(hardLevelBonus(3)).toBe(150);
  });
});

describe("first-game tutorial", () => {
  it("shows for a brand-new player", () => {
    expect(needsTutorial(DEFAULT_PLAYER)).toBe(true);
    expect(needsTutorial(migrate({}))).toBe(true);
  });
  it("is skipped for players who already played before the update", () => {
    expect(needsTutorial(migrate({ level: 4, timePlayed: 600 }))).toBe(false);
  });
  it("never shows again once finished", () => {
    expect(needsTutorial(migrate({ tutorialDone: true }))).toBe(false);
  });
});

describe("tutorial move suggestion", () => {
  it("prefers dropping onto a matching stack", () => {
    const b = board({ 0: [1, 2, 2], 5: [3, 2], 9: [4] });
    const m = suggestMove(b)!;
    expect(canDrop(b, m.from, m.to)).toBe(true);
    expect([m.from, m.to].sort()).toEqual([0, 5]);
  });
  it("returns null when nothing can move", () => {
    expect(suggestMove(board({}))).toBeNull();
  });
});
