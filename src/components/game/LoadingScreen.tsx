import { useEffect, useState } from "react";

import { HEXAS } from "@/game/catalog";
import { cn } from "@/lib/utils";
import { TileDefs, TilePrism, useSvgPrefix } from "./hexgeo";
import { SageScene } from "./Screen";

/** How long the bar takes to fill, then how long the fade into the Home Screen lasts. */
export const LOADING_MS = 2000;
const FADE_MS = 500;

const COLOURS = HEXAS[0]!.colors;

/** Three game tiles that keep dropping onto a little stack. */
function StackingHex() {
  const prefix = useSvgPrefix();
  return (
    <svg viewBox="-40 -58 80 80" className="size-24" aria-hidden>
      <TileDefs finishes={["matte"]} prefix={prefix}>
        <ellipse cx={1} cy={4} rx={30} ry={17} fill="var(--gold-deep)" opacity={0.18} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <g key={k} className="loader-hex" style={{ animationDelay: `${k * 0.12}s` }}>
            <TilePrism cx={0} cy={0} idx={k} size={26} color={COLOURS[k % COLOURS.length]!} finish="matte" detail={k === 5} />
          </g>
        ))}
      </TileDefs>
    </svg>
  );
}

/** Branded splash shown once when the app opens: fills to 100%, then fades into the Home Screen. */
export function LoadingScreen() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"show" | "fade" | "done">("show");

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / LOADING_MS);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const fade = window.setTimeout(() => setPhase("fade"), LOADING_MS + 120);
    const done = window.setTimeout(() => setPhase("done"), LOADING_MS + 120 + FADE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      role="status"
      aria-label={`Loading Hexloo, ${pct}%`}
      className={cn(
        "loader-fade fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background",
        phase === "fade" && "pointer-events-none scale-105 opacity-0",
      )}
    >
      <SageScene />
      <div className="absolute inset-0 bg-cream/55" aria-hidden />
      <div className="relative flex w-full max-w-xs flex-col items-center px-6">
        <StackingHex />
        <h1 className="title-gold mt-3 text-[4.25rem] leading-none tracking-tight">Hexloo</h1>
        <p className="mt-2 font-display text-lg font-semibold tracking-wide text-foreground/80">— Vidia Studios —</p>
        <div className="pill-3d mt-8 h-7 w-full overflow-hidden rounded-full p-1">
          <div
            className="h-full rounded-full bg-gradient-to-b from-gold-light via-gold to-gold-deep"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-display text-base font-semibold text-foreground/70">{pct}%</p>
      </div>
    </div>
  );
}
