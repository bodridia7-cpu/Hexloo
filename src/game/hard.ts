// Hard Mode rules: new mixed stacks keep arriving until the board is full. Pure logic.
import { CELLS, dealBoard, hasMoves, POP_SIZE, type Board, type Rng, type Stack } from "./engine";

/** New stacks arrive after every this many moves. */
export const HARD_SPAWN_EVERY = 3;
/** Hard Mode level goes up after this many 10-tile pops. */
export const HARD_POPS_PER_LEVEL = 2;
export const SPAWN_MIN_TILES = 2;
export const SPAWN_MAX_TILES = 4;
export const PALETTE_SIZE = 6;

export type HardRun = {
  board: Board;
  colors: number[];
  level: number;
  pops: number;
  moves: number;
  coins: number; // coins earned this run
  spawnedAt: number; // move count of the last spawn, so it never spawns twice for one move
  bestBefore?: number; // best Hard Mode level when this run started
  over?: boolean; // board filled up; waiting to show the summary
  frozenUntil?: number; // Freeze power-up: no spawns up to and including this move count
};

export function hardColourCount(level: number): number {
  return Math.min(4 + Math.floor((level - 1) / 3), PALETTE_SIZE);
}

export function hardLevelForPops(pops: number): number {
  return 1 + Math.floor(pops / HARD_POPS_PER_LEVEL);
}

export function shouldSpawn(moves: number): boolean {
  return moves > 0 && moves % HARD_SPAWN_EVERY === 0;
}

export function movesUntilSpawn(moves: number): number {
  return HARD_SPAWN_EVERY - (moves % HARD_SPAWN_EVERY);
}

/** Chance that a spawn brings 2 stacks instead of 1; grows with level. */
export function twoStackChance(level: number): number {
  return Math.min(0.2 + 0.06 * (level - 1), 0.7);
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Adds palette colours until the level's colour count is reached. */
export function growColours(colors: number[], level: number, rng: Rng): number[] {
  const out = colors.slice();
  while (out.length < hardColourCount(level)) {
    const unused = Array.from({ length: PALETTE_SIZE }, (_, i) => i).filter((c) => !out.includes(c));
    if (!unused.length) break;
    out.push(pick(unused, rng));
  }
  return out;
}

/** A small stack with at least two different colours. */
export function mixedStack(colors: number[], rng: Rng): Stack {
  const len = SPAWN_MIN_TILES + Math.floor(rng() * (SPAWN_MAX_TILES - SPAWN_MIN_TILES + 1));
  const stack = Array.from({ length: len }, () => pick(colors, rng));
  if (colors.length > 1 && new Set(stack).size < 2) {
    const others = colors.filter((c) => c !== stack[0]);
    stack[len - 1] = pick(others, rng);
  }
  return stack;
}

export function emptyCells(board: Board): number[] {
  return board.stacks.flatMap((s, i) => (s.length === 0 ? [i] : []));
}

/** Puts `count` mixed stacks on random empty slots (fewer if the board has less room). */
export function spawnStacks(board: Board, colors: number[], count: number, rng: Rng): { board: Board; cells: number[] } {
  const free = emptyCells(board);
  const cells: number[] = [];
  while (cells.length < count && free.length) {
    cells.push(free.splice(Math.floor(rng() * free.length), 1)[0]!);
  }
  if (!cells.length) return { board, cells };
  const stacks = board.stacks.map((s) => s.slice());
  for (const c of cells) stacks[c] = mixedStack(colors, rng);
  return { board: { stacks }, cells };
}

/**
 * Runs the spawn step after a move has settled. `blocked` means new stacks were due
 * but every slot was already taken: the board is full and the run is over.
 */
export function spawnTurn(run: HardRun, rng: Rng): { run: HardRun; cells: number[]; blocked: boolean } {
  if (!shouldSpawn(run.moves) || run.spawnedAt === run.moves) return { run, cells: [], blocked: false };
  if (run.moves <= (run.frozenUntil ?? 0)) return { run: { ...run, spawnedAt: run.moves }, cells: [], blocked: false };
  if (isBoardFull(run.board)) return { run: { ...run, spawnedAt: run.moves }, cells: [], blocked: true };
  const colors = growColours(run.colors, run.level, rng);
  const count = rng() < twoStackChance(run.level) ? 2 : 1;
  const { board, cells } = spawnStacks(run.board, colors, count, rng);
  return { run: { ...run, board, colors, spawnedAt: run.moves }, cells, blocked: false };
}

/** 100% of the slots hold a stack. */
export function isBoardFull(board: Board): boolean {
  return board.stacks.every((s) => s.length > 0);
}

/**
 * Game over: the board is full and either new stacks have nowhere to land, or no
 * stack can be moved at all. The player gets the moves between spawns to free a slot.
 */
export function isGameOver(board: Board, spawnBlocked: boolean): boolean {
  return isBoardFull(board) && (spawnBlocked || !hasMoves(board));
}

/** A fresh deal using the run's colours, two pops' worth of each. */
export function dealHardBoard(colors: number[], rng: Rng): Board {
  const counts = new Map<number, number>();
  for (const c of colors) counts.set(c, POP_SIZE * 2);
  return dealBoard(counts, rng, CELLS.length);
}

export function newHardRun(rng: Rng): HardRun {
  const colors = growColours([], 1, rng);
  return { board: dealHardBoard(colors, rng), colors, level: 1, pops: 0, moves: 0, coins: 0, spawnedAt: 0 };
}
