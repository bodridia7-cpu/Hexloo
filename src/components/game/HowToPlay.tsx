import { Bomb, ChevronLeft, ChevronRight, Palette, Shuffle, Snowflake, Zap, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { sfx } from "@/game/audio";
import { CLEAR_BONUS, POP_REWARD, POP_SIZE } from "@/game/engine";
import { HARD_LEVEL_BONUS, HARD_SPAWN_EVERY } from "@/game/hard";
import { POWERS, type PowerId } from "@/game/powers";
import { hexaFor, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";
import { GameButton } from "./GameButton";
import { GameModal } from "./GameModal";
import { neonUrl, TILE_H, TileDefs, TilePrism, useSvgPrefix } from "./hexgeo";

const ICONS: Record<PowerId, LucideIcon> = { shuffle: Shuffle, zap: Zap, freeze: Snowflake, recolour: Palette, bomb: Bomb };

/** Small stacks drawn with the player's own tile style. `stacks` are colour indexes, bottom first. */
function MiniStacks({ stacks, arrow, glow }: { stacks: number[][]; arrow?: boolean; glow?: number }) {
  const player = usePlayer();
  const h = hexaFor(player.equipped.hexa, player);
  const prefix = useSvgPrefix();
  const ts = 16;
  const gap = 58;
  const tallest = Math.max(...stacks.map((s) => s.length));
  const baseY = 14 + tallest * TILE_H;
  const w = gap * stacks.length;
  return (
    <svg viewBox={`${-gap / 2} -18 ${w} ${baseY + 30}`} className="mx-auto h-32 w-auto" aria-hidden>
      <TileDefs finishes={[h.finish]} prefix={prefix}>
        {stacks.map((s, k) => {
          const cx = k * gap;
          return (
            <g key={k} filter={h.finish === "neon" ? neonUrl(prefix) : undefined}>
              <ellipse cx={cx} cy={baseY + 1.5} rx={ts * 1.05} ry={ts * 0.6} fill="var(--foreground)" opacity={0.14} />
              {s.map((c, i) => (
                <TilePrism
                  key={i}
                  cx={cx}
                  cy={baseY}
                  idx={i}
                  size={ts}
                  color={h.colors[c % h.colors.length]!}
                  finish={h.finish}
                  detail={i === s.length - 1}
                  lift={glow === k && i >= s.length - 3 ? 6 : 0}
                />
              ))}
            </g>
          );
        })}
        {arrow && (
          <path
            d={`M 8 ${baseY - tallest * TILE_H - 16} Q ${gap / 2} ${baseY - tallest * TILE_H - 34} ${gap - 10} ${baseY - tallest * TILE_H - 14}`}
            fill="none"
            stroke="var(--gold-deep)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="5 5"
            markerEnd={`url(#${prefix}-arrow)`}
          />
        )}
        <defs>
          <marker id={`${prefix}-arrow`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold-deep)" />
          </marker>
        </defs>
      </TileDefs>
    </svg>
  );
}

const SLIDES = [
  {
    title: "Top-Colour Peeling",
    art: <MiniStacks stacks={[[0, 0, 1, 1, 1], [2, 1]]} arrow glow={0} />,
    text: "Only the matching colours on top of a stack move together. Drag them onto a stack with the same top colour, or onto an empty slot.",
  },
  {
    title: "10-Stack Pops & Level Ups",
    art: (
      <div className="relative">
        <MiniStacks stacks={[Array.from({ length: POP_SIZE }, () => 1)]} />
        <span className="banner-in absolute right-[18%] top-2 rounded-full bg-gold px-3 py-1 font-display text-sm font-bold">POP! +${POP_REWARD}</span>
      </div>
    ),
    text: `Build a tower of ${POP_SIZE} of one colour and it pops for coins. Clear the whole board to level up and earn a +$${CLEAR_BONUS} bonus.`,
  },
  {
    title: "Hard Mode Power-Ups",
    art: (
      <ul className="grid grid-cols-5 gap-1.5 py-2">
        {POWERS.map((p) => {
          const Icon = ICONS[p.id];
          return (
            <li key={p.id} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "pill-3d inline-flex size-11 items-center justify-center rounded-full",
                  p.id === "freeze" && "text-frost-deep",
                  p.id === "bomb" && "text-hard-deep",
                )}
              >
                <Icon className="size-6" strokeWidth={2.4} />
              </span>
              <span className="text-center font-display text-[0.62rem] font-semibold leading-tight">{p.label}</span>
            </li>
          );
        })}
      </ul>
    ),
    text: `In Hard Mode new stacks drop in every ${HARD_SPAWN_EVERY} moves — don't let the board fill up! Spend coins on power-ups to shuffle, zap, freeze, recolour or blast stacks. Every level gives +${HARD_LEVEL_BONUS} bonus coins.`,
  },
];

export function HowToPlayModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  const go = (n: number) => {
    sfx.tap();
    setI(n);
  };
  return (
    <GameModal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setI(0);
      }}
      title="How to Play"
    >
      <div className="flex flex-col gap-3">
        <div key={i} className="pill-3d flex min-h-40 flex-col items-center justify-center rounded-[1.4rem] px-3 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
          {slide.art}
        </div>
        <div key={`t${i}`} className="animate-in fade-in duration-300">
          <p className="text-center font-display text-xl font-semibold">
            {i + 1}. {slide.title}
          </p>
          <p className="mt-1 min-h-[4.5rem] text-center font-sans text-sm font-bold text-muted-foreground">{slide.text}</p>
        </div>
        <div className="flex justify-center gap-2" role="tablist" aria-label="Slides">
          {SLIDES.map((s, n) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={n === i}
              aria-label={s.title}
              onClick={() => go(n)}
              className={cn("h-2.5 rounded-full border-2 border-gold-deep transition-all", n === i ? "w-7 bg-gold" : "w-2.5 bg-transparent")}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <GameButton tone="cream" size="md" className="flex-1 px-3" disabled={i === 0} onClick={() => go(i - 1)}>
            <ChevronLeft className="size-5" strokeWidth={3} /> Back
          </GameButton>
          <GameButton
            tone={last ? "play" : "gold"}
            size="md"
            className="flex-1 px-3"
            onClick={() => (last ? (sfx.tap(), onOpenChange(false), setI(0)) : go(i + 1))}
          >
            {last ? "Got it!" : <>Next <ChevronRight className="size-5" strokeWidth={3} /></>}
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}
