import type { ReactNode } from "react";

import { bgImage } from "@/game/backgrounds";
import { CUSTOM_ID } from "@/game/catalog";
import { useImage } from "@/game/images";
import { usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";

type LeafSpec = {
  pos: React.CSSProperties;
  size: number;
  rot: number;
  blur: number;
  dur: number;
  delay: number;
  tone: "a" | "b";
  opacity: number;
};

// Clusters hugging the outer edges, matching the mockups.
const LEAVES: LeafSpec[] = [
  { pos: { left: "-6%", top: "-3%" }, size: 190, rot: 35, blur: 6, dur: 9, delay: 0, tone: "a", opacity: 0.75 },
  { pos: { left: "8%", top: "6%" }, size: 120, rot: 70, blur: 3, dur: 11, delay: 1, tone: "b", opacity: 0.6 },
  { pos: { right: "-8%", top: "-2%" }, size: 210, rot: 150, blur: 7, dur: 10, delay: 0.5, tone: "a", opacity: 0.7 },
  { pos: { right: "6%", top: "14%" }, size: 110, rot: 190, blur: 2, dur: 8, delay: 2, tone: "b", opacity: 0.55 },
  { pos: { left: "-10%", top: "34%" }, size: 170, rot: 10, blur: 5, dur: 12, delay: 1.5, tone: "b", opacity: 0.6 },
  { pos: { right: "-10%", top: "40%" }, size: 180, rot: 200, blur: 6, dur: 10, delay: 0.2, tone: "a", opacity: 0.6 },
  { pos: { left: "-4%", top: "60%" }, size: 140, rot: -20, blur: 3, dur: 9, delay: 3, tone: "a", opacity: 0.55 },
  { pos: { right: "-6%", top: "64%" }, size: 150, rot: 220, blur: 4, dur: 11, delay: 1, tone: "b", opacity: 0.6 },
  { pos: { left: "-8%", bottom: "-4%" }, size: 220, rot: -40, blur: 7, dur: 10, delay: 0.8, tone: "b", opacity: 0.7 },
  { pos: { left: "22%", bottom: "-6%" }, size: 130, rot: -70, blur: 4, dur: 9, delay: 2.2, tone: "a", opacity: 0.5 },
  { pos: { right: "-6%", bottom: "-5%" }, size: 230, rot: 240, blur: 6, dur: 12, delay: 0, tone: "a", opacity: 0.75 },
  { pos: { right: "24%", bottom: "-7%" }, size: 120, rot: 260, blur: 3, dur: 8, delay: 1.4, tone: "b", opacity: 0.45 },
];

const DRIFT = [
  { left: "18%", size: 34, dur: 26, delay: 0 },
  { left: "62%", size: 28, dur: 31, delay: 9 },
  { left: "40%", size: 22, dur: 23, delay: 15 },
  { left: "80%", size: 30, dur: 34, delay: 4 },
];

function Leaf({ size, tone }: { size: number; tone: "a" | "b" }) {
  const fill = tone === "a" ? "var(--leaf-a)" : "var(--leaf-b)";
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 55" aria-hidden>
      <path d="M2 30 C 22 2, 70 -4, 98 18 C 76 46, 30 58, 2 30 Z" fill={fill} />
      <path
        d="M4 30 C 35 24, 65 20, 96 19"
        stroke="var(--scene-glow)"
        strokeOpacity="0.35"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}

function Leaves({ sharp = false }: { sharp?: boolean }) {
  return (
    <>
      <div className="scene-light absolute inset-0" />
      {LEAVES.map((l, i) => (
        <div
          key={i}
          className="leaf"
          style={
            {
              ...l.pos,
              filter: sharp ? undefined : `blur(${l.blur}px)`,
              opacity: l.opacity,
              "--rot": `${l.rot}deg`,
              "--dur": `${l.dur}s`,
              "--delay": `-${l.delay}s`,
            } as React.CSSProperties
          }
        >
          <Leaf size={l.size} tone={l.tone} />
        </div>
      ))}
      {DRIFT.map((d, i) => (
        <div
          key={`d${i}`}
          className="leaf-drift"
          style={
            {
              left: d.left,
              top: 0,
              filter: sharp ? undefined : "blur(1px)",
              "--dur": `${d.dur}s`,
              "--delay": `-${d.delay}s`,
            } as React.CSSProperties
          }
        >
          <Leaf size={d.size} tone={i % 2 ? "a" : "b"} />
        </div>
      ))}
    </>
  );
}

/** The default blurred sage-leaf scene, used by the loading screen. */
export function SageScene() {
  return (
    <div className="scene pointer-events-none absolute inset-0 overflow-hidden">
      <div className="scene-art scene-art-blur absolute inset-0">
        <Leaves />
      </div>
      <div className="scene-veil absolute inset-0" />
    </div>
  );
}

/** Full-screen background: the equipped picture (or the player's own), softly blurred when Blur is on. */
export function Scene({ bg, blur: blurOverride, className }: { bg: string; blur?: boolean; className?: string }) {
  const player = usePlayer();
  const blur = blurOverride ?? player.blur;
  const custom = useImage("background");
  const src = bg === CUSTOM_ID ? custom : bgImage(bg);
  return (
    <div data-bg={bg} className={cn("scene pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className={cn("scene-art absolute inset-0", blur && "scene-art-blur")}>
        {src ? (
          <img src={src} alt="" decoding="async" draggable={false} className="absolute inset-0 size-full object-cover object-center" />
        ) : (
          <Leaves sharp={!blur} />
        )}
      </div>
      <div className="scene-veil absolute inset-0" />
    </div>
  );
}

/** Page shell: themed scene + a phone-width column. */
export function Screen({ children }: { children: ReactNode }) {
  const player = usePlayer();
  return (
    <div data-bg={player.equipped.background} className="relative isolate min-h-[100dvh]">
      <Scene bg={player.equipped.background} />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col md:max-w-xl lg:max-w-2xl overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </div>
  );
}
