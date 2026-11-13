// Player data, saved automatically to localStorage (works offline).
import { useSyncExternalStore } from "react";

import type { Board } from "./engine";
import {
  AVATARS,
  CUSTOM_ID,
  DEFAULT_CUSTOM_BASE,
  DEFAULT_CUSTOM_COLORS,
  STARTING_COINS,
  findBase,
  findHexa,
  makeBase,
  type BaseItem,
  type BaseTexture,
  type Category,
  type Finish,
  type HexaItem,
} from "./catalog";
import { GOLDEN_EVERY_SECONDS } from "./boosts";
import type { HardRun } from "./hard";

export type CustomHexa = { finish: Finish; colors: string[] };
export type CustomBase = { texture: BaseTexture; surface: string; rim: string };

export type PlayerData = {
  username: string;
  avatar: string; // one of AVATARS, or "photo"
  avatarColor: string;
  coins: number;
  level: number;
  highestLevel: number;
  timePlayed: number; // seconds
  unlocked: string[]; // "category:id"
  equipped: Record<Category, string>;
  monthlyRewardMonth: string | null; // "YYYY-MM" last checked for the monthly prize
  dailyGiftDate: string | null; // "YYYY-MM-DD"
  boostUntil: number; // 2x, epoch ms
  boost3Until: number; // 3x, epoch ms
  goldenNextAt: number; // timePlayed (s) when the golden 3x button next appears
  goldenUntil: number; // epoch ms the golden button stays visible until
  sfx: boolean;
  music: boolean;
  blur: boolean;
  vibration: boolean;
  hardBest: number; // best Hard Mode level reached
  hardRun: HardRun | null; // Hard Mode game in progress
  customHexa: CustomHexa;
  customBase: CustomBase;
  board: Board | null;
};

export const DEFAULT_PLAYER: PlayerData = {
  username: "Player",
  avatar: "bunny",
  avatarColor: "1",
  coins: STARTING_COINS,
  level: 1,
  highestLevel: 1,
  timePlayed: 0,
  unlocked: ["background:sage", "hexa:pastel", "base:cream"],
  equipped: { background: "sage", hexa: "pastel", base: "cream" },
  monthlyRewardMonth: null,
  dailyGiftDate: null,
  boostUntil: 0,
  boost3Until: 0,
  goldenNextAt: GOLDEN_EVERY_SECONDS,
  goldenUntil: 0,
  sfx: true,
  music: true,
  blur: true,
  vibration: true,
  hardBest: 0,
  hardRun: null,
  customHexa: { finish: "matte", colors: DEFAULT_CUSTOM_COLORS },
  customBase: DEFAULT_CUSTOM_BASE,
  board: null,
};

const KEY = "hexa-flow:player:v1"; // kept so existing saves carry over after the rename
let state: PlayerData = DEFAULT_PLAYER;
let loaded = false;
const listeners = new Set<() => void>();

// Items renamed in the Hexloo update.
const RENAMED: Record<string, string> = { "background:peach": "background:beach", "background:mint": "background:clouds" };

export function migrate(parsed: Partial<PlayerData> & { sound?: boolean }): PlayerData {
  const unlocked = Array.from(new Set((parsed.unlocked ?? DEFAULT_PLAYER.unlocked).map((k) => RENAMED[k] ?? k)));
  const equipped = { ...DEFAULT_PLAYER.equipped, ...(parsed.equipped ?? {}) };
  for (const cat of Object.keys(equipped) as Category[]) {
    const mapped = RENAMED[`${cat}:${equipped[cat]}`];
    if (mapped) equipped[cat] = mapped.split(":")[1]!;
  }
  const avatar =
    parsed.avatar === "photo" || (AVATARS as readonly string[]).includes(parsed.avatar ?? "")
      ? parsed.avatar!
      : DEFAULT_PLAYER.avatar;
  const { sound, ...rest } = parsed;
  return {
    ...DEFAULT_PLAYER,
    ...rest,
    sfx: parsed.sfx ?? sound ?? true,
    avatar,
    unlocked,
    equipped,
    customHexa: { ...DEFAULT_PLAYER.customHexa, ...(parsed.customHexa ?? {}) },
    customBase: { ...DEFAULT_PLAYER.customBase, ...(parsed.customBase ?? {}) },
  };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = migrate(JSON.parse(raw));
  } catch {
    state = DEFAULT_PLAYER;
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked */
  }
}

export function getPlayer(): PlayerData {
  load();
  return state;
}

export function updatePlayer(fn: (s: PlayerData) => PlayerData) {
  load();
  state = fn(state);
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePlayer(): PlayerData {
  return useSyncExternalStore(subscribe, getPlayer, () => DEFAULT_PLAYER);
}

// ---------- Actions ----------
export function addCoins(amount: number) {
  updatePlayer((s) => ({ ...s, coins: s.coins + amount }));
}

export function buyItem(category: Category, id: string, price: number): boolean {
  const s = getPlayer();
  const key = `${category}:${id}`;
  if (s.unlocked.includes(key)) return true;
  if (s.coins < price) return false;
  updatePlayer((p) => ({
    ...p,
    coins: p.coins - price,
    unlocked: [...p.unlocked, key],
    equipped: { ...p.equipped, [category]: id },
  }));
  return true;
}

export function equipItem(category: Category, id: string) {
  updatePlayer((p) =>
    p.unlocked.includes(`${category}:${id}`)
      ? { ...p, equipped: { ...p.equipped, [category]: id } }
      : p,
  );
}

export function owns(p: PlayerData, category: Category, id: string) {
  return p.unlocked.includes(`${category}:${id}`);
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- Custom item looks ----------
/** The tile style for an item id, with the player's own colours and finish for Custom Hexa. */
export function hexaFor(id: string, p: Pick<PlayerData, "customHexa">): HexaItem {
  const h = findHexa(id);
  if (h.id !== CUSTOM_ID) return h;
  return { ...h, finish: p.customHexa.finish, colors: p.customHexa.colors };
}

/** The board style for an item id, with the player's own texture and colours for Custom Base. */
export function baseFor(id: string, p: Pick<PlayerData, "customBase">): BaseItem {
  const b = findBase(id);
  if (b.id !== CUSTOM_ID) return b;
  return customBaseItem(b, p.customBase);
}

export function customBaseItem(b: BaseItem, c: CustomBase): BaseItem {
  return { ...b, texture: c.texture, ...makeBase(c.surface, c.rim) };
}
