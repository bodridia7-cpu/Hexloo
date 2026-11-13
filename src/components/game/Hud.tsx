import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { formatCash } from "@/game/ranks";
import { usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";

export function CoinPill({ className }: { className?: string }) {
  const { coins } = usePlayer();
  return (
    <span
      key={coins}
      className={cn("pill-3d bump inline-flex h-11 min-w-28 items-center justify-center rounded-full px-5 text-xl", className)}
      aria-label={`${coins} coins`}
    >
      {formatCash(coins)}
    </span>
  );
}

export function BackToMenu() {
  return (
    <Link
      to="/"
      className="scene-text inline-flex items-center gap-2 font-display text-xl font-semibold transition-transform active:scale-95"
    >
      <ArrowLeft className="size-6" strokeWidth={3.5} />
      Back to Menu
    </Link>
  );
}

function Burst({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", flip && "-scale-x-100")} aria-hidden>
      <path d="M30 6 C 34 10, 32 18, 26 20 C 24 14, 26 8, 30 6 Z" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1.5" />
      <path d="M36 22 C 38 27, 32 30, 26 28 C 28 24, 32 21, 36 22 Z" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1.5" />
    </svg>
  );
}

export function PageTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Burst flip />
      <h1 className="title-gold text-6xl tracking-wide">{children}</h1>
      <Burst />
    </div>
  );
}
