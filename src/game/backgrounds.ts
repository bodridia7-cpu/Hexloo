// Illustrated background pictures bundled with the app (cached for offline play).
import { CUSTOM_ID } from "./catalog";

const files = import.meta.glob("../assets/bg/*.webp", { eager: true, import: "default" }) as Record<string, string>;

const file = (name: string): string | undefined => files[`../assets/bg/${name}.webp`];

/** Full-screen picture for a background id. Sage Leaves (default) and Custom have none. */
export function bgImage(id: string): string | undefined {
  if (id === CUSTOM_ID) return undefined;
  return file(id);
}

/** Small picture for shop and collector book tiles. */
export function bgThumb(id: string): string | undefined {
  if (id === CUSTOM_ID) return undefined;
  return file(`${id}-thumb`) ?? file(id);
}
