// Pure game rules for Hexloo. No React, no DOM.

export type Cell = { q: number; r: number };
/** Colour indices, bottom -> top. */
export type Stack = number[];
export type Board = { stacks: Stack[] };

export const BOARD_RADIUS = 3;
export const POP_SIZE = 10;
export const MAX_START_HEIGHT = 9;

export const CELLS: Cell[] = makeCells(BOARD_RADIUS);

export function makeCells(radius: number): Cell[] {
  const cells: Cell[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) cells.push({ q, r });
  }
  return cells;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stackAt(board: Board, i: number): Stack {
  return board.stacks[i] ?? [];
}

export function topOf(stack: Stack | undefined): number | undefined {
  return stack && stack.length ? stack[stack.length - 1] : undefined;
}

export function topGroup(stack: Stack | undefined): { color: number; count: number } | null {
  if (!stack || stack.length === 0) return null;
  const color = stack[stack.length - 1]!;
  let count = 0;
  for (let i = stack.length - 1; i >= 0 && stack[i] === color; i--) count++;
  return { color, count };
}

export function canDrop(board: Board, from: number, to: number): boolean {
  if (from === to) return false;
  const src = board.stacks[from];
  const dst = board.stacks[to];
  if (!src || !dst || src.length === 0) return false;
  if (dst.length === 0) return true;
  return topOf(dst) === topOf(src);
}

/** Moves only the contiguous top-colour group from `from` onto `to`. */
export function moveGroup(board: Board, from: number, to: number): Board {
  if (!canDrop(board, from, to)) return board;
  const group = topGroup(board.stacks[from])!;
  const stacks = board.stacks.map((s) => s.slice());
  const src = stacks[from]!;
  const moved = src.splice(src.length - group.count, group.count);
  stacks[to]!.push(...moved);
  return { stacks };
}

export function canPop(stack: Stack | undefined): boolean {
  const g = topGroup(stack);
  return !!g && g.count >= POP_SIZE;
}

/** Removes exactly POP_SIZE tiles from the top of a stack that can pop. */
export function popStack(board: Board, index: number): Board {
  if (!canPop(board.stacks[index])) return board;
  const stacks = board.stacks.map((s) => s.slice());
  const st = stacks[index]!;
  st.splice(st.length - POP_SIZE, POP_SIZE);
  return { stacks };
}

export function isCleared(board: Board): boolean {
  return board.stacks.every((s) => s.length === 0);
}

export function colourCounts(board: Board): Map<number, number> {
  const m = new Map<number, number>();
  for (const s of board.stacks) for (const c of s) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

export function hasMoves(board: Board): boolean {
  const n = board.stacks.length;
  for (let a = 0; a < n; a++) {
    if (stackAt(board, a).length === 0) continue;
    for (let b = 0; b < n; b++) if (canDrop(board, a, b)) return true;
  }
  return false;
}

export function colourCountForLevel(level: number): number {
  return Math.min(3 + Math.floor((level - 1) / 2), 6);
}

/** Tiles per colour: always a multiple of POP_SIZE so every board is clearable. */
export function tilesPerColourForLevel(_level: number): number {
  return POP_SIZE * 2;
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/** Deals the given colour counts into roughly half of the board's slots. */
export function dealBoard(counts: Map<number, number>, rng: Rng, cellCount = CELLS.length): Board {
  const stackCount = Math.round(cellCount / 2);
  const runs: { color: number; len: number }[] = [];
  for (const [color, total] of counts) {
    let left = total;
    while (left > 0) {
      const len = Math.min(left, 1 + Math.floor(rng() * 4));
      runs.push({ color, len });
      left -= len;
    }
  }
  shuffle(runs, rng);

  const slots = shuffle(
    Array.from({ length: cellCount }, (_, i) => i),
    rng,
  ).slice(0, Math.min(stackCount, runs.length));
  const stacks: Stack[] = Array.from({ length: cellCount }, () => []);

  runs.forEach((run, i) => {
    let target: number;
    if (i < slots.length) {
      target = slots[i]!;
    } else {
      const options = slots.filter((s) => {
        const st = stacks[s]!;
        return st.length + run.len <= MAX_START_HEIGHT + 3 && topOf(st) !== run.color;
      });
      const pool = options.length ? options : slots;
      // Prefer shorter stacks so heights stay even.
      pool.sort((a, b) => stacks[a]!.length - stacks[b]!.length);
      target = pool[Math.floor(rng() * Math.min(pool.length, 6))]!;
    }
    for (let k = 0; k < run.len; k++) stacks[target]!.push(run.color);
  });

  // A dealt stack must never start ready to pop.
  for (const s of stacks) {
    while (canPop(s)) {
      const g = topGroup(s)!;
      const idx = s.length - g.count + Math.floor(g.count / 2);
      const other = s.find((c) => c !== g.color);
      if (other === undefined) break;
      const swapAt = s.indexOf(other);
      const tmp = s[idx]!;
      s[idx] = s[swapAt]!;
      s[swapAt] = tmp;
    }
  }
  return { stacks };
}

export function generateLevel(level: number, rng: Rng, paletteSize = 6): Board {
  const k = Math.min(colourCountForLevel(level), paletteSize);
  const colours = shuffle(
    Array.from({ length: paletteSize }, (_, i) => i),
    rng,
  ).slice(0, k);
  const per = tilesPerColourForLevel(level);
  const counts = new Map<number, number>();
  for (const c of colours) counts.set(c, per);
  return dealBoard(counts, rng);
}

/** Re-deals the same tiles when the board has no legal move left. */
export function reshuffle(board: Board, rng: Rng): Board {
  return dealBoard(colourCounts(board), rng, board.stacks.length);
}

// ---------- Coins ----------
export const POP_REWARD = 10;
export const CLEAR_BONUS = 50;
export const BOOST_MULTIPLIER = 2;
export const BOOST_DURATION_MS = 10 * 60 * 1000;

/** `multiplier` comes from the active boost: 1, 2 or 3. */
export function popReward(multiplier: number): number {
  return POP_REWARD * multiplier;
}
export function clearBonus(multiplier: number): number {
  return CLEAR_BONUS * multiplier;
}
