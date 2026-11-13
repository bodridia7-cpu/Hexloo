// Synthesised sounds with the Web Audio API — no audio files.
import { getPlayer } from "./store";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Shared Web Audio context for sound effects and music (created lazily, browser only). */
export function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

/** The context if one exists, without creating or resuming it. */
audioContext.peek = (): AudioContext | null => ctx;

function ac(): AudioContext | null {
  if (!getPlayer().sfx) return null;
  const c = audioContext();
  if (!c) return null;
  if (!master) {
    master = c.createGain();
    master.gain.value = 0.55;
    master.connect(c.destination);
  }
  return c;
}

function marimba(freq: number | undefined, when = 0, vol = 0.35, decay = 0.9) {
  const c = ac();
  if (!c || !master || freq === undefined) return;
  const t = c.currentTime + when;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  out.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  out.connect(master);
  // Marimba bars: strong fundamental + a quick 4x partial.
  (
    [
      [1, 1],
      [4, 0.18],
      [10, 0.04],
    ] as const
  ).forEach(([mult, g]) => {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    og.gain.setValueAtTime(g, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + (mult === 1 ? decay : 0.12));
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  });
}

function woodClick(when = 0, vol = 0.5) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * 0.05);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1700;
  bp.Q.value = 4;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(bp).connect(g).connect(master);
  src.start(t);
  // Low body knock
  const o = c.createOscillator();
  const og = c.createGain();
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.06);
  og.gain.setValueAtTime(vol * 0.6, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(og).connect(master);
  o.start(t);
  o.stop(t + 0.1);
}

const SCALE: readonly number[] = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]; // C pentatonic-ish

export const sfx = {
  pickup() {
    woodClick(0, 0.25);
    marimba(SCALE[4], 0.01, 0.12, 0.35);
  },
  drop(groupSize: number, stackHeight: number) {
    woodClick(0, 0.5);
    const base = Math.min(stackHeight, 7);
    marimba(SCALE[Math.max(0, base - Math.min(groupSize, 3))], 0.02, 0.22, 0.6);
    marimba(SCALE[base], 0.09, 0.2, 0.7);
  },
  invalid() {
    woodClick(0, 0.3);
    marimba(392, 0.02, 0.12, 0.3);
  },
  pop() {
    [0, 2, 4, 5, 7].forEach((n, i) => marimba(SCALE[n], i * 0.06, 0.26, 0.8));
  },
  levelUp() {
    [0, 2, 4, 5, 7, 5, 7].forEach((n, i) => marimba(SCALE[n], i * 0.09, 0.3, 1.1));
    marimba(261.63, 0, 0.2, 1.6);
  },
  coin() {
    marimba(SCALE[5], 0, 0.22, 0.5);
    marimba(SCALE[7], 0.07, 0.22, 0.7);
  },
  tap() {
    woodClick(0, 0.22);
  },
  power() {
    [7, 5, 4].forEach((n, i) => marimba(SCALE[n], i * 0.05, 0.2, 0.5));
  },
  boom() {
    woodClick(0, 0.9);
    marimba(130.81, 0, 0.35, 1.2);
    marimba(196, 0.04, 0.3, 0.9);
    [4, 5, 7].forEach((n, i) => marimba(SCALE[n], 0.12 + i * 0.06, 0.2, 0.7));
  },
};
