// Player-uploaded pictures (profile photo, custom background), kept in their own
// localStorage keys so the main save stays small. Works fully offline.
import { useSyncExternalStore } from "react";

export type ImageSlot = "avatar" | "background";
const key = (slot: ImageSlot) => `hexloo:img:${slot}`;
const cache: Partial<Record<ImageSlot, string | null>> = {};
const listeners = new Set<() => void>();

export function getImage(slot: ImageSlot): string | null {
  if (typeof window === "undefined") return null;
  if (!(slot in cache)) {
    try {
      cache[slot] = window.localStorage.getItem(key(slot));
    } catch {
      cache[slot] = null;
    }
  }
  return cache[slot] ?? null;
}

export function setImage(slot: ImageSlot, dataUrl: string | null): boolean {
  try {
    if (dataUrl) window.localStorage.setItem(key(slot), dataUrl);
    else window.localStorage.removeItem(key(slot));
  } catch {
    return false;
  }
  cache[slot] = dataUrl;
  listeners.forEach((l) => l());
  return true;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useImage(slot: ImageSlot): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getImage(slot),
    () => null,
  );
}

/** Shrinks a picked photo to a JPEG data URL. `square` centre-crops (for avatars). */
export async function compressImage(file: File, maxSize: number, square = false, quality = 0.78): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that picture."));
      el.src = url;
    });
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (square) {
      const side = Math.min(sw, sh);
      sx = (sw - side) / 2;
      sy = (sh - side) / 2;
      sw = sh = side;
    }
    const scale = Math.min(1, maxSize / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
