import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import { CollectorBookModal } from "@/components/game/CollectorBook";
import { gameButton } from "@/components/game/GameButton";
import { ProfilePill } from "@/components/game/Profile";
import { Screen } from "@/components/game/Screen";
import { SpinWheelModal } from "@/components/game/SpinWheel";
import { sfx } from "@/game/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hexloo — Relaxing Hexagon Sorting Puzzle" },
      {
        name: "description",
        content: "Sort colourful hexagon stacks in a calm, endless puzzle. Plays offline, no pop-up ads.",
      },
      { property: "og:title", content: "Hexloo — Relaxing Hexagon Sorting Puzzle" },
      {
        property: "og:description",
        content: "Sort colourful hexagon stacks in a calm, endless puzzle. Plays offline, no pop-up ads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Logo() {
  return (
    <div className="relative flex flex-col items-center">
      <h1 className="title-gold relative text-[clamp(3.6rem,17vw,5rem)] md:text-[6rem] leading-none tracking-tight">
        Hexloo
      </h1>
      <svg viewBox="0 0 300 40" className="-mt-1 w-[82%]" aria-hidden>
        <path
          d="M8 14 C 80 40, 220 40, 292 10"
          fill="none"
          stroke="var(--gold-deep)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M8 12 C 80 38, 220 38, 292 8"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M-2 0 C 4 -8, 14 -4, 12 4 C 6 6, 0 4, -2 0 Z" transform="translate(0 6) rotate(-30)" fill="var(--gold)" />
      </svg>
      <p className="-mt-1 font-display text-lg font-semibold tracking-wide text-foreground/80">
        — Vidia Studios —
      </p>
    </div>
  );
}

function WheelIcon() {
  return (
    <svg viewBox="0 0 40 40" className="size-8" aria-hidden>
      {["#F7B8CC", "#9FD39A", "#FFD45E", "#8DB6DE", "#B48CF0", "#F6A877"].map((c, i) => {
        const a0 = ((i * 60 - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * 60 - 90) * Math.PI) / 180;
        return (
          <path
            key={i}
            d={`M20 20 L${20 + 16 * Math.cos(a0)} ${20 + 16 * Math.sin(a0)} A16 16 0 0 1 ${20 + 16 * Math.cos(a1)} ${20 + 16 * Math.sin(a1)} Z`}
            fill={c}
            stroke="#FFF8E8"
            strokeWidth={1.2}
          />
        );
      })}
      <circle cx={20} cy={20} r={4} fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth={1.5} />
      <path d="M15 1 H25 L20 9 Z" fill="var(--rank)" stroke="var(--gold-deep)" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={() => {
        sfx.tap();
        onClick();
      }}
      aria-label={label}
      className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
    >
      <span className="pill-3d inline-flex size-14 items-center justify-center rounded-full border-4">{children}</span>
      <span className="scene-text font-display text-xs font-semibold leading-none">{label}</span>
    </button>
  );
}

function Home() {
  const [spinOpen, setSpinOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  return (
    <Screen>
      <header className="flex items-start justify-between gap-2">
        <ProfilePill />
        <div className="flex gap-2">
          <RoundButton label="Spin Wheel" onClick={() => setSpinOpen(true)}>
            <WheelIcon />
          </RoundButton>
          <RoundButton label="Collector Book" onClick={() => setBookOpen(true)}>
            <BookOpen className="size-7 text-rank-deep" strokeWidth={2.6} />
          </RoundButton>
        </div>
      </header>
      {spinOpen && <SpinWheelModal open={spinOpen} onOpenChange={setSpinOpen} />}
      {bookOpen && <CollectorBookModal open={bookOpen} onOpenChange={setBookOpen} />}
      <main className="flex flex-1 flex-col items-center justify-center gap-14 pb-16">
        <Logo />
        <nav className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-3">
            <Link to="/play" className={gameButton({ tone: "play", size: "xl" })}>
              Play
            </Link>
            <Link to="/hard" className={gameButton({ tone: "hard", size: "xl", className: "h-[3.75rem] text-[1.875rem]" })}>
              Hard Mode
            </Link>
          </div>
          <Link to="/shop" className={gameButton({ tone: "shop", size: "xl" })}>
            Shop
          </Link>
          <Link to="/ranks" className={gameButton({ tone: "rank", size: "xl" })}>
            Ranks
          </Link>
        </nav>
      </main>
      <p className="text-center text-xs font-bold text-foreground/55">Plays offline · No pop-up ads</p>
    </Screen>
  );
}
