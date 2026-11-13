// Short, crisp device vibrations. Silently does nothing where vibration isn't supported.
import { getPlayer } from "./store";

export type HapticKind = "pickup" | "snap" | "pop" | "power" | "bomb";

/** Milliseconds of vibration (or on/off pattern) for each moment. */
export const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  pickup: 8,
  snap: 14,
  pop: [18, 40, 28],
  power: 20,
  bomb: [40, 30, 70, 40, 110],
};

type Vibrator = { vibrate?: (pattern: number | number[]) => boolean };

/** Vibrates only when the setting is on and the device supports it. Returns whether it vibrated. */
export function vibrate(kind: HapticKind, enabled: boolean, nav: Vibrator | undefined = globalThis.navigator): boolean {
  if (!enabled || !nav || typeof nav.vibrate !== "function") return false;
  try {
    return nav.vibrate(HAPTIC_PATTERNS[kind]);
  } catch {
    return false;
  }
}

const fire = (kind: HapticKind) => vibrate(kind, getPlayer().vibration);

export const haptic = {
  pickup: () => fire("pickup"),
  snap: () => fire("snap"),
  pop: () => fire("pop"),
  power: () => fire("power"),
  bomb: () => fire("bomb"),
};
