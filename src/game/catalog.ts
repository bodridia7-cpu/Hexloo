// Shop items, palettes, limited monthly sets and avatar options. Pure data + helpers.

export type Category = "background" | "hexa" | "base";

export type Finish =
  | "matte"
  | "dots"
  | "stripes"
  | "sand"
  | "wood"
  | "marshmallow"
  | "yarn"
  | "sparkles"
  | "stars"
  | "glass"
  | "neon"
  | "cyber";

export type BaseTexture =
  | "plain"
  | "sand"
  | "clouds"
  | "stump"
  | "lolly"
  | "ocean"
  | "neon"
  | "marble"
  | "cyber"
  | "galaxy"
  | "petals"
  | "aurora"
  | "prism"
  | "leaves";

type Item = { id: string; name: string; price: number; custom?: boolean; limited?: string };
export type BackgroundItem = Item;
export type HexaItem = Item & { finish: Finish; colors: string[] };
export type BaseItem = Item & {
  texture: BaseTexture;
  top: string;
  cellA: string;
  cellB: string;
  cellEdge: string;
  rim: string;
  side: string;
};

export const CUSTOM_ID = "custom";

// ---------- Backgrounds (cheapest first) ----------
export const BACKGROUNDS: BackgroundItem[] = [
  { id: "sage", name: "Sage Leaves", price: 0 },
  { id: "clouds", name: "Fluffy Clouds", price: 50 },
  { id: "desert", name: "Desert", price: 80 },
  { id: "beach", name: "Sunset Beach", price: 120 },
  { id: "ribbons", name: "Cute Ribbons", price: 160 },
  { id: "candy", name: "Candy", price: 200 },
  { id: "forest", name: "Lush Forest", price: 260 },
  { id: "misty", name: "Misty Mountains", price: 320 },
  { id: "snowy", name: "Snowy Mountain", price: 400 },
  { id: "rainy", name: "Rainy Window", price: 500 },
  { id: "midnight", name: "Midnight Sky", price: 650 },
  { id: "cabin", name: "Cozy Cabin", price: 850 },
  { id: "underwater", name: "Underwater", price: 1100 },
  { id: "city", name: "Cityscape", price: 1400 },
  { id: "cyber", name: "Cyber", price: 1800 },
  { id: CUSTOM_ID, name: "Custom Image", price: 10000, custom: true },
];

// ---------- Hexa tiles (cheapest first) ----------
export const FINISHES: { id: Finish; name: string }[] = [
  { id: "matte", name: "Matte" },
  { id: "dots", name: "Dots" },
  { id: "stripes", name: "Stripes" },
  { id: "sand", name: "Sand" },
  { id: "wood", name: "Wood" },
  { id: "marshmallow", name: "Marshmallow" },
  { id: "yarn", name: "Yarn" },
  { id: "sparkles", name: "Sparkles" },
  { id: "stars", name: "Stars" },
  { id: "glass", name: "Glass" },
  { id: "neon", name: "Neon" },
  { id: "cyber", name: "Cyber" },
];

export const DEFAULT_CUSTOM_COLORS = ["#7FB2E5", "#F59BB4", "#F7D35C", "#93D18F", "#F6A877", "#B9A1E6"];

export const HEXAS: HexaItem[] = [
  { id: "pastel", name: "Matte Palette", price: 0, finish: "matte", colors: ["#8DB6DE", "#F2A2B6", "#F6CF5E", "#9FD39A", "#F4AE7E", "#BFA8E0"] },
  { id: "dots", name: "Dots", price: 60, finish: "dots", colors: ["#6FA8DC", "#EE7F9F", "#F4C542", "#7CC576", "#F29A5C", "#A88BD9"] },
  { id: "stripes", name: "Stripes", price: 90, finish: "stripes", colors: ["#5D9CD4", "#E86F8F", "#F0BB3A", "#6BBB6A", "#EE8E4F", "#9B7CD1"] },
  { id: "sand", name: "Sand Blocks", price: 130, finish: "sand", colors: ["#C9A86B", "#D98C6A", "#E8C878", "#A9B47A", "#CF9E5E", "#B7A1A8"] },
  { id: "wood", name: "Warm Wood", price: 180, finish: "wood", colors: ["#D9A35B", "#7A4B2E", "#B5523B", "#8A9150", "#4F8A8B", "#E2CFA6"] },
  { id: "marshmallow", name: "Marshmallow", price: 240, finish: "marshmallow", colors: ["#F9C9D6", "#C9E4F7", "#FFF0B8", "#CDEFD2", "#FFD8BF", "#E2D4F7"] },
  { id: "yarn", name: "Yarn", price: 320, finish: "yarn", colors: ["#D9534F", "#4A90C2", "#E9B949", "#5FA55A", "#E07B39", "#8E6BBF"] },
  { id: "sparkles", name: "Sparkles", price: 420, finish: "sparkles", colors: ["#7DB7F0", "#FF8DB8", "#FFD45E", "#7BDCA8", "#FFA86B", "#B697FF"] },
  { id: "stars", name: "Stars", price: 550, finish: "stars", colors: ["#3E5BA9", "#C2457A", "#E2A93B", "#3F9A73", "#D66F3D", "#7A52B3"] },
  { id: "glass", name: "Glossy Glass", price: 750, finish: "glass", colors: ["#5FBDF5", "#FF85AA", "#FFD84D", "#62E3A6", "#FFA45C", "#A98BFF"] },
  { id: "neon", name: "Neon Glow", price: 1000, finish: "neon", colors: ["#00E0FF", "#FF2E93", "#FFE600", "#39FF6A", "#FF7A00", "#B44CFF"] },
  { id: "cyber", name: "Cyber", price: 1500, finish: "cyber", colors: ["#16C7FF", "#FF3DA8", "#E8F23A", "#2BF5B4", "#FF8A1F", "#9C5CFF"] },
  { id: CUSTOM_ID, name: "Custom Hexa", price: 12000, custom: true, finish: "matte", colors: DEFAULT_CUSTOM_COLORS },
];

// ---------- Bases (cheapest first) ----------
export function makeBase(surface: string, rim: string): Pick<BaseItem, "top" | "cellA" | "cellB" | "cellEdge" | "rim" | "side"> {
  const dark = luminance(surface) < 0.35;
  return {
    top: surface,
    cellA: dark ? lighten(surface, 0.14) : lighten(surface, 0.35),
    cellB: dark ? lighten(surface, 0.06) : lighten(surface, 0.12),
    cellEdge: dark ? shade(surface, 0.7) : shade(surface, 0.84),
    rim,
    side: shade(rim, 0.78),
  };
}

const base = (id: string, name: string, price: number, texture: BaseTexture, surface: string, rim: string, extra: Partial<BaseItem> = {}): BaseItem => ({
  id,
  name,
  price,
  texture,
  ...makeBase(surface, rim),
  ...extra,
});

export const BASE_TEXTURES: { id: BaseTexture; name: string }[] = [
  { id: "plain", name: "Classic" },
  { id: "sand", name: "Sand" },
  { id: "clouds", name: "Clouds" },
  { id: "stump", name: "Tree Rings" },
  { id: "lolly", name: "Swirl" },
  { id: "ocean", name: "Waves" },
  { id: "neon", name: "Neon" },
  { id: "marble", name: "Marble" },
  { id: "cyber", name: "Cyber Grid" },
  { id: "galaxy", name: "Galaxy" },
];

export const DEFAULT_CUSTOM_BASE = { texture: "marble" as BaseTexture, surface: "#F3E6FA", rim: "#C79BE0" };

export const BASES: BaseItem[] = [
  base("cream", "Classic Cream", 0, "plain", "#FBEFD6", "#F5C443", { cellA: "#FFF6E4", cellB: "#F6E3BF", cellEdge: "#EBD3A3", side: "#E2AC34" }),
  base("sand", "Sand", 60, "sand", "#EFD7AE", "#D9A441"),
  base("clouds", "Clouds", 100, "clouds", "#D9ECFA", "#9CC7EA"),
  base("stump", "Tree Stump", 160, "stump", "#D9AE78", "#8A5A35"),
  base("lolly", "Swirly Lolly", 240, "lolly", "#FFE1EC", "#F27FA8"),
  base("ocean", "Deep Ocean", 350, "ocean", "#2E5B7B", "#E9C46A"),
  base("neon", "Neon", 500, "neon", "#1E1838", "#FF3DA8"),
  base("marble", "Golden Marble", 750, "marble", "#F6F0E4", "#D4AF37"),
  base("cyber", "Cyber", 1100, "cyber", "#0F2233", "#16C7FF"),
  base("galaxy", "Galaxy", 1600, "galaxy", "#231A47", "#B697FF"),
  base(CUSTOM_ID, "Custom Base", 12000, DEFAULT_CUSTOM_BASE.texture, DEFAULT_CUSTOM_BASE.surface, DEFAULT_CUSTOM_BASE.rim, { custom: true }),
];

// ---------- Monthly limited sets (spin-wheel mega prizes) ----------
export type LimitedSet = { id: string; name: string; background: BackgroundItem; hexa: HexaItem; base: BaseItem };

export const LIMITED_SETS: LimitedSet[] = [
  {
    id: "cherry",
    name: "Cherry Blossom Set",
    background: { id: "cherry", name: "Cherry Blossom Sky", price: 0, limited: "cherry" },
    hexa: { id: "cherry", name: "Sakura Petals", price: 0, limited: "cherry", finish: "sparkles", colors: ["#F7B8CC", "#E87AA0", "#FFF1F4", "#B7D98B", "#F2D0A9", "#C9A3D9"] },
    base: base("cherry", "Blossom Garden", 0, "petals", "#FDE7EE", "#E58BA8", { limited: "cherry" }),
  },
  {
    id: "aurora",
    name: "Aurora Sky Set",
    background: { id: "aurora", name: "Aurora Night", price: 0, limited: "aurora" },
    hexa: { id: "aurora", name: "Aurora Glass", price: 0, limited: "aurora", finish: "glass", colors: ["#3FE0B5", "#7B6CFF", "#5FC8FF", "#C66BFF", "#9CF57A", "#FF7FD1"] },
    base: base("aurora", "Polar Lights", 0, "aurora", "#132A3A", "#5FE3C0", { limited: "aurora" }),
  },
  {
    id: "crystal",
    name: "Crystal Prism Set",
    background: { id: "crystal", name: "Crystal Cave", price: 0, limited: "crystal" },
    hexa: { id: "crystal", name: "Prism Gems", price: 0, limited: "crystal", finish: "glass", colors: ["#9FE8FF", "#FFB3E6", "#FFF2A6", "#B3FFD9", "#FFCBA6", "#D1B8FF"] },
    base: base("crystal", "Prism Plate", 0, "prism", "#EEF0FF", "#A9B6FF", { limited: "crystal" }),
  },
  {
    id: "autumn",
    name: "Golden Autumn Set",
    background: { id: "autumn", name: "Golden Autumn", price: 0, limited: "autumn" },
    hexa: { id: "autumn", name: "Maple Wood", price: 0, limited: "autumn", finish: "wood", colors: ["#D9822B", "#B5442E", "#E8B33E", "#8C6A2E", "#C9643B", "#7E3B2A"] },
    base: base("autumn", "Fallen Leaves", 0, "leaves", "#F4DDB0", "#D9822B", { limited: "autumn" }),
  },
];

/** The set featured on the Spin Wheel this calendar month (rotates every month). */
export function setForMonth(d: Date): LimitedSet {
  return LIMITED_SETS[d.getMonth() % LIMITED_SETS.length]!;
}

export const LIMITED_BACKGROUNDS = LIMITED_SETS.map((s) => s.background);
export const LIMITED_HEXAS = LIMITED_SETS.map((s) => s.hexa);
export const LIMITED_BASES = LIMITED_SETS.map((s) => s.base);

export const CATEGORY_ITEMS = {
  background: BACKGROUNDS,
  hexa: HEXAS,
  base: BASES,
} as const;

export function findBackground(id: string): BackgroundItem {
  return BACKGROUNDS.find((b) => b.id === id) ?? LIMITED_BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]!;
}
export function findHexa(id: string): HexaItem {
  return HEXAS.find((h) => h.id === id) ?? LIMITED_HEXAS.find((h) => h.id === id) ?? HEXAS[0]!;
}
export function findBase(id: string): BaseItem {
  return BASES.find((b) => b.id === id) ?? LIMITED_BASES.find((b) => b.id === id) ?? BASES[0]!;
}
export function itemPrice(category: Category, id: string): number | undefined {
  const list = CATEGORY_ITEMS[category] as readonly { id: string; price: number }[];
  return list.find((i) => i.id === id)?.price;
}

// ---------- Avatars ----------
export const AVATARS = ["bunny", "bear", "cat", "frog", "chick", "cloud", "star", "sprout"] as const;
export type AvatarId = (typeof AVATARS)[number] | "photo";
export const AVATAR_COLORS = ["1", "2", "3", "4", "5", "6"] as const;

// ---------- Coin rewards ----------
export const STARTING_COINS = 40;
export const DAILY_GIFT = 25;
export const WATCH_AD_REWARD = 50;
export const AD_SECONDS = 5;

export const COIN_BUNDLES = [
  { id: "starter", coins: 1000, price: "$1", label: "Starter Pack" },
  { id: "popular", coins: 10000, price: "$9", label: "Popular" },
  { id: "best", coins: 50000, price: "$45", label: "Best Value" },
] as const;

// ---------- Colour helpers for SVG fills ----------
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0) as [number, number, number];
}
function rgbToHex(rgb: number[]): string {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function shade(hex: string, f: number): string {
  return rgbToHex(hexToRgb(hex).map((v) => v * f));
}
export function lighten(hex: string, f: number): string {
  return rgbToHex(hexToRgb(hex).map((v) => v + (255 - v) * f));
}
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
