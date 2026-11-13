// Calm background music: a slow lo-fi pentatonic chord loop made with the Web Audio API.
// No audio files, so it plays offline.
import { audioContext } from "./audio";

const BAR = 4.8; // seconds per chord
// Cmaj7 · Am7 · Fmaj7 · G6 (low voicings)
const CHORDS = [
  [130.81, 196.0, 246.94, 329.63],
  [110.0, 164.81, 196.0, 261.63],
  [87.31, 174.61, 220.0, 329.63],
  [98.0, 146.83, 246.94, 329.63],
];
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

let bus: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let timer: number | null = null;
let nextTime = 0;
let bar = 0;
let playing = false;

function ensureBus(c: AudioContext) {
  if (bus) return bus;
  filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  filter.Q.value = 0.4;
  bus = c.createGain();
  bus.gain.value = 0;
  filter.connect(bus).connect(c.destination);
  return bus;
}

function pad(c: AudioContext, freq: number, t: number, len: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.045, t + 1.2);
  g.gain.setValueAtTime(0.045, t + len - 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.8);
  g.connect(filter!);
  [-6, 6].forEach((detune) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(g);
    o.start(t);
    o.stop(t + len + 1);
  });
}

function pluck(c: AudioContext, freq: number, t: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  g.connect(filter!);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = freq;
  o.connect(g);
  o.start(t);
  o.stop(t + 1.7);
}

function bass(c: AudioContext, freq: number, t: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + BAR * 0.9);
  g.connect(filter!);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = freq / 2;
  o.connect(g);
  o.start(t);
  o.stop(t + BAR);
}

function scheduleBar(c: AudioContext, t: number) {
  const chord = CHORDS[bar % CHORDS.length]!;
  chord.forEach((f) => pad(c, f, t, BAR));
  bass(c, chord[0]!, t);
  // A few sparse melody notes, swung on an 8-step grid.
  const steps = [0, 2, 3, 5, 6];
  steps.forEach((s, i) => {
    if ((bar * 7 + i * 3) % 5 < 2) return;
    const note = PENTA[(bar * 2 + i * 3) % PENTA.length]!;
    pluck(c, note, t + (s * BAR) / 8 + (s % 2 ? 0.08 : 0));
  });
  bar++;
}

function tick() {
  const c = audioContext();
  if (!c || !playing) return;
  while (nextTime < c.currentTime + 1.5) {
    scheduleBar(c, nextTime);
    nextTime += BAR;
  }
}

export const music = {
  start() {
    const c = audioContext();
    if (!c || playing) return;
    playing = true;
    const b = ensureBus(c);
    b.gain.cancelScheduledValues(c.currentTime);
    b.gain.setValueAtTime(b.gain.value, c.currentTime);
    b.gain.linearRampToValueAtTime(0.7, c.currentTime + 2.5);
    nextTime = Math.max(nextTime, c.currentTime + 0.1);
    tick();
    timer = window.setInterval(tick, 400);
  },
  stop() {
    playing = false;
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    const c = audioContext();
    if (c && bus) {
      bus.gain.cancelScheduledValues(c.currentTime);
      bus.gain.setValueAtTime(bus.gain.value, c.currentTime);
      bus.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
    }
  },
  get playing() {
    return playing;
  },
};
