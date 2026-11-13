// Hard Mode power-ups. Pure rules: which slots each one can target and what it does to the board.
import { CELLS, stackAt, type Board, type Rng, type Stack } from "./engine";
import type { HardRun } from "./hard";

export type PowerId = "shuffle" | "zap" | "freeze" | "recolour" | "bomb";

export type Power = {
  id: PowerId;
  label: string;
  cost: number;
  /** "stack": tap a stack, "cell": tap any slot, "now": works the moment it is tapped. */
  aim: "stack" | "cell" | "now";
  hint: string;
};

export const POWERS: Power[] = [
  { id: "shuffle", label: "Shuffle", cost: 350, aim: "stack", hint: "Tap a mixed stack to shuffle it" },
  { id: "zap", label: "Zap Stack", cost: 750, aim: "stack", hint: "Tap a stack to zap it away" },
  { id: "freeze", label: "Freeze", cost: 1200, aim: "now", hint: "No new stacks for 3 moves" },
  { id: "recolour", label: "One-Colour", cost: 2000, aim: "stack", hint: "Tap a mixed stack to make it one colour" },
  { id: "bomb", label: "Mega Bomb", cost: 3500, aim: "cell", hint: "Tap any slot to blast it" },
];

export const powerById = (id: PowerId) => POWERS.find((p) => p.id === id)!;

/** Freeze stops new stacks for this many moves. */
export const FREEZE_MOVES = 3;
/** Mega Bomb clears the tapped slot plus this many rings around it (19 slots, about half the board). */
export const BOMB_RADIUS = 2;

export const canAfford = (coins: number, id: PowerId) => coins >= powerById(id).cost;

const isMixed = (s: Stack) => new Set(s).size > 1;

export function hexDistance(a: number, b: number): number {
  const p = CELLS[a]!;
  const q = CELLS[b]!;
  const dq = p.q - q.q;
  const dr = p.r - q.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** Every slot the Mega Bomb clears when it lands on `cell`. */
export function blastCells(cell: number, radius = BOMB_RADIUS): number[] {
  return CELLS.flatMap((_, i) => (hexDistance(cell, i) <= radius ? [i] : []));
}

/** Slots the player may tap for an aimed power-up. */
export function powerTargets(board: Board, id: PowerId): number[] {
  return board.stacks.flatMap((s, i) => {
    if (id === "zap") return s.length ? [i] : [];
    if (id === "shuffle" || id === "recolour") return isMixed(s) ? [i] : [];
    if (id === "bomb") return blastCells(i).some((c) => stackAt(board, c).length) ? [i] : [];
    return [];
  });
}

function shuffled<T>(arr: T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Re-orders a stack so tiles of the same colour sit together and a colour that was
 * buried comes to the top. Tile counts never change.
 */
export function shuffleStack(stack: Stack, rng: Rng): Stack {
  const colours = [...new Set(stack)];
  if (colours.length < 2) return stack.slice();
  const oldTop = stack[stack.length - 1]!;
  const buried = colours.filter((c) => c !== oldTop);
  const top = buried[Math.floor(rng() * buried.length)]!;
  const below = shuffled(
    colours.filter((c) => c !== top),
    rng,
  );
  const count = (c: number) => stack.filter((x) => x === c).length;
  return [...below, top].flatMap((c) => Array.from({ length: count(c) }, () => c));
}

function withStack(board: Board, cell: number, stack: Stack): Board {
  const stacks = board.stacks.map((s, i) => (i === cell ? stack : s.slice()));
  return { stacks };
}

/**
 * Applies an aimed power-up to `cell`. Returns the new board, or null when that slot
 * isn't a valid target (so no coins should be spent).
 */
export function applyPower(board: Board, id: PowerId, cell: number, rng: Rng): Board | null {
  if (!powerTargets(board, id).includes(cell)) return null;
  const stack = stackAt(board, cell);
  switch (id) {
    case "shuffle":
      return withStack(board, cell, shuffleStack(stack, rng));
    case "zap":
      return withStack(board, cell, []);
    case "recolour":
      return withStack(board, cell, stack.map(() => stack[stack.length - 1]!));
    case "bomb": {
      const hit = new Set(blastCells(cell));
      return { stacks: board.stacks.map((s, i) => (hit.has(i) ? [] : s.slice())) };
    }
    default:
      return null;
  }
}

/** Freeze: no new stacks for the next FREEZE_MOVES moves (stacks on top of a running freeze). */
export function freezeRun(run: HardRun): HardRun {
  const from = Math.max(run.frozenUntil ?? 0, run.moves);
  return { ...run, frozenUntil: from + FREEZE_MOVES };
}

/** Moves still covered by Freeze. */
export function frozenMovesLeft(run: HardRun): number {
  return Math.max(0, (run.frozenUntil ?? 0) - run.moves);
}
