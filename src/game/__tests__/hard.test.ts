import { describe, expect, it, vi } from "vitest";

import { CELLS, mulberry32, type Board } from "../engine";
import {
  HARD_SPAWN_EVERY,
  isBoardFull,
  isGameOver,
  mixedStack,
  newHardRun,
  shouldSpawn,
  spawnStacks,
  spawnTurn,
} from "../hard";
import { vibrate } from "../haptics";
import { BOARD_SIZE, checkMonthly, leaderboard, type PlayerStats } from "../ranks";
import { DEFAULT_PLAYER } from "../store";

const emptyBoard = (): Board => ({ stacks: CELLS.map(() => []) });

describe("hard mode spawning", () => {
  it("new stacks arrive every 3 moves", () => {
    expect(HARD_SPAWN_EVERY).toBe(3);
    expect([1, 2, 3, 4, 5, 6].map(shouldSpawn)).toEqual([false, false, true, false, false, true]);
  });

  it("each spawn adds 1 or 2 stacks, only on empty slots", () => {
    for (let seed = 1; seed < 200; seed++) {
      const run = { ...newHardRun(mulberry32(seed)), moves: 3, spawnedAt: 0 };
      const before = run.board.stacks.map((s) => s.length);
      const { run: next, cells } = spawnTurn(run, mulberry32(seed + 7));
      expect(cells.length === 1 || cells.length === 2).toBe(true);
      for (const c of cells) {
        expect(before[c]).toBe(0);
        expect(next.board.stacks[c]!.length).toBeGreaterThan(0);
      }
      // never spawns twice for the same move
      expect(spawnTurn(next, mulberry32(seed)).cells).toEqual([]);
    }
  });

  it("spawned stacks are mixed colours", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 300; i++) {
      const s = mixedStack([0, 1, 2, 3], rng);
      expect(new Set(s).size).toBeGreaterThanOrEqual(2);
    }
  });

  it("no spawn when every slot is taken", () => {
    const full: Board = { stacks: CELLS.map((_, i) => [i % 2, (i + 1) % 2]) };
    expect(spawnStacks(full, [0, 1], 2, mulberry32(1)).cells).toEqual([]);
  });
});

describe("hard mode game over", () => {
  const n = CELLS.length;
  const full: Board = { stacks: CELLS.map((_, i) => [i % 6, (i + 1) % 6]) };
  const oneEmpty: Board = { stacks: full.stacks.map((s, i) => (i === n - 1 ? [] : s)) };

  it("board counts as full only when 100% of slots hold a stack", () => {
    expect(isBoardFull(full)).toBe(true);
    expect(isBoardFull(oneEmpty)).toBe(false);
    expect(isBoardFull(emptyBoard())).toBe(false);
  });

  it("ends when new stacks are due and there is no empty slot", () => {
    const run = { ...newHardRun(mulberry32(3)), board: full, moves: 3, spawnedAt: 0 };
    const res = spawnTurn(run, mulberry32(4));
    expect(res.blocked).toBe(true);
    expect(isGameOver(res.run.board, res.blocked)).toBe(true);
  });

  it("keeps going while there is still room or before the next spawn", () => {
    expect(isGameOver(oneEmpty, false)).toBe(false);
    expect(isGameOver(full, false)).toBe(false); // merges left, next stacks not due yet
    const run = { ...newHardRun(mulberry32(3)), board: oneEmpty, moves: 3, spawnedAt: 0 };
    expect(spawnTurn(run, mulberry32(4)).blocked).toBe(false);
  });

  it("ends right away when the board is full and nothing can move", () => {
    const stuck: Board = { stacks: CELLS.map((_, i) => [i]) };
    expect(isGameOver(stuck, false)).toBe(true);
  });
});

describe("hard mode leaderboard", () => {
  const me: PlayerStats = { name: "Me", avatar: "bunny", color: "1", time: 0, level: 1, cash: 0, hard: 0 };
  it("shows ranks 1 to 100 by Hard Mode level", () => {
    const rows = leaderboard("hard", me).slice(0, BOARD_SIZE);
    expect(rows).toHaveLength(100);
    expect(rows[0]!.rank).toBe(1);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1]!.value).toBeGreaterThanOrEqual(rows[i]!.value);
  });
  it("a Hard Mode Top-10 spot wins the monthly prize", () => {
    const champ = { ...me, hard: 9999 };
    expect(checkMonthly("2026-11", new Date(2026, 11, 1), champ).prize).toBe(10000);
  });
});

describe("vibration", () => {
  it("is ON by default", () => {
    expect(DEFAULT_PLAYER.vibration).toBe(true);
  });
  it("vibrates only when switched on", () => {
    const nav = { vibrate: vi.fn(() => true) };
    expect(vibrate("pop", false, nav)).toBe(false);
    expect(nav.vibrate).not.toHaveBeenCalled();
    expect(vibrate("pickup", true, nav)).toBe(true);
    expect(nav.vibrate).toHaveBeenCalledTimes(1);
  });
  it("does nothing on devices without vibration", () => {
    expect(vibrate("snap", true, {})).toBe(false);
  });
});
