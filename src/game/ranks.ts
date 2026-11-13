// Leaderboards and the monthly Top-10 prize. Pure logic.

export type RankTab = "time" | "level" | "cash" | "hard";

export type Rival = {
  name: string;
  avatar: string;
  color: string;
  time: number; // seconds
  level: number;
  cash: number;
  hard: number; // best Hard Mode level
};

import { AVATARS } from "./catalog";
import { mulberry32 } from "./engine";

const H = 3600;
const PREFIX = ["Mossy", "Honey", "Pebble", "Sunny", "Clover", "Willow", "Tofu", "Mari", "Bramble", "Nori", "Fern", "Biscuit", "Poppy", "Hazel", "Juniper", "Maple", "Peachy", "Misty", "Cocoa", "Minty", "Lulu", "Bean", "Pip", "Olive", "Sprout", "Dewdrop", "Toffee", "Cozy", "Ember", "Lotus"];
const SUFFIX = ["Fox", "Bun", "Bee", "Leaf", "Paws", "Tiles", "Hex", "Puff", "Drop", "Moon", "Star", "Bloom", "Sage", "Moss", "Cloud", "", "_K", ".L"];

export const RIVAL_COUNT = 120;
export const BOARD_SIZE = 100;

let cached: Rival[] | null = null;

/** 120 fixed rivals (same every visit), strongest first. Scores are never reset. */
export function getRivals(): Rival[] {
  if (cached) return cached;
  const rng = mulberry32(20261113);
  const used = new Set<string>();
  const list: Rival[] = [];
  for (let i = 0; i < RIVAL_COUNT; i++) {
    let name = "";
    do {
      name = PREFIX[Math.floor(rng() * PREFIX.length)]! + SUFFIX[Math.floor(rng() * SUFFIX.length)]!;
      if (used.has(name)) name += Math.floor(rng() * 90 + 10);
    } while (used.has(name));
    used.add(name);
    const skill = Math.exp(-i / 15); // 1 -> ~0.0003
    const j = () => 0.7 + rng() * 0.6;
    list.push({
      name,
      avatar: AVATARS[Math.floor(rng() * AVATARS.length)]!,
      color: String(1 + Math.floor(rng() * 6)),
      time: Math.max(600, Math.round(480 * H * skill * j())),
      level: Math.max(2, Math.round(460 * skill * j())),
      cash: Math.max(60, Math.round(62000 * skill * j())),
      hard: 1,
    });
  }
  // Hard Mode levels use their own sequence so the other boards stay exactly as before.
  const hrng = mulberry32(20261114);
  list.forEach((r, i) => {
    r.hard = Math.max(1, Math.round(1 + 44 * Math.exp(-i / 28) * (0.75 + hrng() * 0.5)));
  });
  cached = list;
  return list;
}

export type Entry = {
  name: string;
  avatar: string;
  color: string;
  value: number;
  secondary: number;
  isPlayer: boolean;
  rank: number;
};

export type PlayerStats = {
  name: string;
  avatar: string;
  color: string;
  time: number;
  level: number;
  cash: number;
  hard?: number;
};

const SECONDARY: Record<RankTab, keyof Rival> = { time: "level", level: "time", cash: "level", hard: "level" };

/** Full ranking, best first. The player ranks below rivals with an equal score. */
export function leaderboard(tab: RankTab, player: PlayerStats, rivals = getRivals()): Entry[] {
  const rows = [
    ...rivals.map((r) => ({ ...r, isPlayer: false })),
    { ...player, isPlayer: true },
  ].map((r) => ({
    name: r.name,
    avatar: r.avatar,
    color: r.color,
    value: (r[tab] ?? 0) as number,
    secondary: (r[SECONDARY[tab]] ?? 0) as number,
    isPlayer: r.isPlayer,
  }));
  rows.sort((a, b) => b.value - a.value || Number(a.isPlayer) - Number(b.isPlayer));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function playerRank(tab: RankTab, player: PlayerStats, rivals = getRivals()): number {
  return leaderboard(tab, player, rivals).find((e) => e.isPlayer)!.rank;
}

export function bestRank(player: PlayerStats, rivals = getRivals()) {
  const tabs: RankTab[] = ["time", "level", "cash", "hard"];
  return tabs
    .map((tab) => ({ tab, rank: playerRank(tab, player, rivals) }))
    .sort((a, b) => a.rank - b.rank)[0]!;
}

export function prizeForRank(rank: number): number {
  if (rank === 1) return 10000;
  if (rank === 2) return 8000;
  if (rank === 3) return 5000;
  if (rank === 4) return 2000;
  if (rank >= 5 && rank <= 10) return 1000;
  return 0;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Called on app start. The first check only records the month; when a new calendar
 * month begins, a player in the Top 10 on any board wins the prize for their best rank.
 */
export function checkMonthly(
  lastMonth: string | null,
  now: Date,
  player: PlayerStats,
  rivals = getRivals(),
): { month: string; prize: number; rank: number; tab: RankTab } | { month: string; prize: 0 } {
  const month = monthKey(now);
  if (lastMonth === null || lastMonth === month) return { month, prize: 0 };
  const best = bestRank(player, rivals);
  const prize = prizeForRank(best.rank);
  if (prize === 0) return { month, prize: 0 };
  return { month, prize, rank: best.rank, tab: best.tab };
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}

export function formatCash(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
