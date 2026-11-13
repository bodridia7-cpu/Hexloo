import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { formatClock } from "@/game/boosts";
import { setForMonth } from "@/game/catalog";
import { sfx } from "@/game/audio";
import { formatCash } from "@/game/ranks";
import {
  applyPrizes,
  rollSpin,
  segmentFor,
  SEGMENTS,
  SPIN10_COST,
  SPIN_COST,
  type SpinOutcome,
  type SpinPrize,
} from "@/game/spin";
import { getPlayer, updatePlayer, usePlayer } from "@/game/store";
import { GameButton } from "./GameButton";
import { GameModal } from "./GameModal";
import { ItemArt } from "./ItemArt";

// Wheel artwork colours, clockwise from the top pointer (matches SEGMENTS).
const SEG_FILL = ["#F7B8CC", "#9FD39A", "#FFD45E", "#8DB6DE", "#B48CF0", "#F6A877", "#FFD45E", "#93C9E8"];
const R = 100;

function polar(a: number, r: number) {
  const rad = (a * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)] as const;
}

function Wheel({ rotation, ms }: { rotation: number; ms: number }) {
  return (
    <div className="relative mx-auto w-[min(72vw,16rem)]">
      <svg viewBox="-112 -112 224 224" className="block w-full" aria-hidden>
        <circle r={110} fill="var(--gold-deep)" />
        <circle r={106} fill="var(--gold)" />
        <g
          className="wheel-spin"
          style={{ transform: `rotate(${rotation}deg)`, ["--spin-ms" as string]: `${ms}ms` }}
        >
          {SEGMENTS.map((s, i) => {
            const a0 = i * 45 - 22.5;
            const a1 = i * 45 + 22.5;
            const [x0, y0] = polar(a0, R);
            const [x1, y1] = polar(a1, R);
            const [lx, ly] = polar(i * 45, 66);
            const mega = s.label === "MEGA";
            return (
              <g key={i}>
                <path d={`M0 0 L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={SEG_FILL[i]} stroke="#FFF8E8" strokeWidth={2.5} />
                <text
                  x={lx}
                  y={ly}
                  transform={`rotate(${i * 45} ${lx} ${ly})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-display)"
                  fontWeight={700}
                  fontSize={mega ? 17 : 16}
                  fill={mega ? "#FFFFFF" : "#5A3B22"}
                  stroke={mega ? "#7A52B3" : "none"}
                  strokeWidth={mega ? 3 : 0}
                  paintOrder="stroke"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const [x, y] = polar(i * 45 + 22.5, 102);
            return <circle key={i} cx={x} cy={y} r={3.2} fill="#FFF8E8" stroke="var(--gold-deep)" strokeWidth={1} />;
          })}
        </g>
        <circle r={20} fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth={4} />
        <circle r={8} cx={-4} cy={-5} fill="#FFF8E8" opacity={0.6} />
      </svg>
      <svg viewBox="0 0 40 40" className="wheel-pointer absolute -top-3 left-1/2 w-10 -translate-x-1/2" aria-hidden>
        <path d="M6 4 H34 L20 34 Z" fill="var(--rank)" stroke="var(--gold-deep)" strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function OutcomeRow({ o }: { o: SpinOutcome }) {
  if (o.kind === "coins") return <span className="font-display text-lg font-bold">+{formatCash(o.amount)}</span>;
  if (o.kind === "boost") return <span className="font-display text-lg font-bold">3x Coins · 24h</span>;
  return (
    <span className="flex items-center gap-2">
      <ItemArt category={o.category} id={o.id} size="sm" />
      <span className="text-left">
        <span className="block font-display text-base font-bold leading-tight">{o.name}</span>
        <span className="block text-xs font-extrabold text-muted-foreground">
          {o.duplicate ? "Duplicate → +$2,500" : "NEW! Equip it in the Collector Book"}
        </span>
      </span>
    </span>
  );
}

export function SpinWheelModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const player = usePlayer();
  const [rotation, setRotation] = useState(0);
  const [ms, setMs] = useState(4200);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinOutcome[] | null>(null);
  const timer = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(id);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const set = setForMonth(new Date());

  const spin = (count: 1 | 10) => {
    if (spinning) return;
    const cost = count === 1 ? SPIN_COST : SPIN10_COST;
    if (getPlayer().coins < cost) {
      sfx.invalid();
      toast(`You need ${formatCash(cost - getPlayer().coins)} more coins.`);
      return;
    }
    updatePlayer((s) => ({ ...s, coins: s.coins - cost }));
    const date = new Date();
    const prizes: SpinPrize[] = Array.from({ length: count }, () => rollSpin(Math.random, date));
    const last = prizes[prizes.length - 1]!;
    const seg = segmentFor(last);
    const duration = count === 1 ? 4200 : 1600;
    const turns = count === 1 ? 6 : 3;
    const jitter = (Math.random() - 0.5) * 30;
    setMs(duration);
    setRotation((cur) => {
      const target = (((-seg * 45 - cur) % 360) + 360) % 360;
      return cur + turns * 360 + target + jitter;
    });
    setSpinning(true);
    setResult(null);
    sfx.tap();
    timer.current = window.setTimeout(() => {
      let outcomes: SpinOutcome[] = [];
      updatePlayer((s) => {
        const r = applyPrizes(s, prizes, Date.now());
        outcomes = r.outcomes;
        return r.state;
      });
      setResult(outcomes);
      setSpinning(false);
      if (outcomes.some((o) => o.kind === "mega")) sfx.levelUp();
      else sfx.coin();
    }, duration + 150);
  };

  const boostLeft = player.boost3Until - now;
  const total = result?.reduce((n, o) => n + (o.kind === "coins" ? o.amount : o.kind === "mega" && o.duplicate ? 2500 : 0), 0) ?? 0;

  return (
    <GameModal open={open} onOpenChange={(o) => !spinning && onOpenChange(o)} title="Lucky Spin">
      <div className="flex max-h-[76dvh] flex-col gap-3 overflow-y-auto px-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="pill-3d inline-flex h-9 items-center rounded-full px-4">{formatCash(player.coins)}</span>
          {boostLeft > 0 && (
            <span className="pill-3d inline-flex h-9 items-center rounded-full bg-gold-light px-3 text-sm">
              3x · {formatClock(boostLeft)}
            </span>
          )}
        </div>
        <Wheel rotation={rotation} ms={ms} />
        {result && (
          <div className="card-3d animate-in zoom-in-90 fade-in px-3 py-2 text-center">
            {result.length === 1 ? (
              <div className="flex flex-col items-center gap-1">
                <span className="title-gold text-2xl">You won!</span>
                <OutcomeRow o={result[0]!} />
              </div>
            ) : (
              <div>
                <p className="title-gold text-2xl">10x Rewards</p>
                <ul className="mt-1 max-h-44 overflow-y-auto">
                  {result.map((o, i) => (
                    <li key={i} className="flex items-center justify-between border-b border-gold/40 py-1">
                      <span className="text-xs font-extrabold text-muted-foreground">#{i + 1}</span>
                      <OutcomeRow o={o} />
                    </li>
                  ))}
                </ul>
                {total > 0 && <p className="mt-1 font-display text-lg font-bold">Total coins: +{formatCash(total)}</p>}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <GameButton tone="play" size="md" className="px-1 text-sm tracking-normal" disabled={spinning} onClick={() => spin(1)}>
            1 Spin ($500)
          </GameButton>
          <GameButton tone="gold" size="md" className="px-1 text-sm tracking-normal" disabled={spinning} onClick={() => spin(10)}>
            10x Spin ($5,000)
          </GameButton>
        </div>
        <div className="rounded-2xl border-[3px] border-gold bg-cream-deep/60 p-3">
          <p className="text-center font-display text-base font-semibold">This month's Mega prizes · {set.name}</p>
          <div className="mt-2 flex justify-around">
            <ItemArt category="background" id={set.background.id} size="sm" />
            <ItemArt category="hexa" id={set.hexa.id} size="sm" />
            <ItemArt category="base" id={set.base.id} size="sm" />
          </div>
          <p className="mt-2 text-center text-[11px] font-bold text-muted-foreground">
            Common 75%: $150–$800 · Rare 20%: 3x Coins 24h · Ultra-rare 5%: Limited item
          </p>
        </div>
      </div>
    </GameModal>
  );
}
