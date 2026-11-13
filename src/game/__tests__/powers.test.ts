import { describe, expect, it } from "vitest";

import { CELLS, mulberry32, type Board } from "../engine";
import { newHardRun, spawnTurn } from "../hard";
import { applyPower, blastCells, canAfford, freezeRun, frozenMovesLeft, POWERS, powerTargets, shuffleStack } from "../powers";

const empty = (): Board => ({ stacks: CELLS.map(() => []) });
const rng = () => mulberry32(7);

describe("Hard Mode power-ups", () => {
  it("has the five abilities at the agreed prices, cheapest first", () => {
    expect(POWERS.map((p) => [p.label, p.cost])).toEqual([
      ["Shuffle", 350],
      ["Zap Stack", 750],
      ["Freeze", 1200],
      ["One-Colour", 2000],
      ["Mega Bomb", 3500],
    ]);
  });

  it("only lets the player use an ability they can pay for", () => {
    expect(canAfford(349, "shuffle")).toBe(false);
    expect(canAfford(350, "shuffle")).toBe(true);
    expect(canAfford(3499, "bomb")).toBe(false);
  });

  it("Shuffle brings a buried colour to the top and keeps every tile", () => {
    const stack = [1, 2, 1, 2, 0, 0];
    const out = shuffleStack(stack, rng());
    expect(out[out.length - 1]).not.toBe(0);
    expect(out.slice().sort()).toEqual(stack.slice().sort());
  });

  it("Zap Stack removes the whole tapped stack", () => {
    const b = empty();
    b.stacks[3] = [1, 2, 3];
    b.stacks[4] = [1];
    const out = applyPower(b, "zap", 3, rng())!;
    expect(out.stacks[3]).toEqual([]);
    expect(out.stacks[4]).toEqual([1]);
  });

  it("One-Colour turns a mixed stack into its top colour", () => {
    const b = empty();
    b.stacks[5] = [0, 1, 0, 2, 2];
    expect(applyPower(b, "recolour", 5, rng())!.stacks[5]).toEqual([2, 2, 2, 2, 2]);
  });

  it("does nothing (and costs nothing) on an invalid slot", () => {
    const b = empty();
    b.stacks[5] = [2, 2];
    expect(applyPower(b, "recolour", 5, rng())).toBeNull(); // not mixed
    expect(applyPower(b, "zap", 6, rng())).toBeNull(); // empty slot
    expect(powerTargets(empty(), "bomb")).toEqual([]);
  });

  it("Mega Bomb clears the tapped slot and two rings around it, about half the board", () => {
    const centre = CELLS.findIndex((c) => c.q === 0 && c.r === 0);
    expect(blastCells(centre)).toHaveLength(19);
    const full: Board = { stacks: CELLS.map(() => [1]) };
    const out = applyPower(full, "bomb", centre, rng())!;
    expect(out.stacks.filter((s) => s.length === 0)).toHaveLength(19);
  });

  it("Freeze stops new stacks for the next 3 moves, then they come back", () => {
    let run = { ...newHardRun(mulberry32(1)), moves: 2, spawnedAt: 0 };
    run.board.stacks[0] = [];
    run = freezeRun(run);
    expect(frozenMovesLeft(run)).toBe(3);
    // Move 3 would normally spawn, but it is frozen.
    const frozen = spawnTurn({ ...run, moves: 3 }, mulberry32(2));
    expect(frozen.cells).toEqual([]);
    expect(frozenMovesLeft({ ...run, moves: 5 })).toBe(0);
    // Move 6 is after the freeze: stacks arrive again.
    const after = spawnTurn({ ...run, moves: 6, board: empty() }, mulberry32(2));
    expect(after.cells.length).toBeGreaterThan(0);
  });
});
