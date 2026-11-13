import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar } from "@/components/game/Avatar";
import { gameButton } from "@/components/game/GameButton";
import { BackToMenu, PageTitle } from "@/components/game/Hud";
import { Screen } from "@/components/game/Screen";
import { sfx } from "@/game/audio";
import { BOARD_SIZE, formatCash, formatTime, leaderboard, type Entry, type RankTab } from "@/game/ranks";
import { usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "Hexloo Ranks — Top 100 Leaderboards" },
      {
        name: "description",
        content: "See the top 100 Hexloo players by time played, level, cash and Hard Mode, and win monthly Top 10 prizes.",
      },
      { property: "og:title", content: "Hexloo Ranks — Top 100 Leaderboards" },
      {
        property: "og:description",
        content: "See the top 100 Hexloo players by time played, level, cash and Hard Mode, and win monthly Top 10 prizes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ranks,
});

const TABS: { id: RankTab; label: string; title: string; main: string; second: string }[] = [
  { id: "time", label: "Top Time Played", title: "Top Time Played", main: "Time", second: "Lvl" },
  { id: "level", label: "Top Level", title: "Top Level", main: "Lvl", second: "Time" },
  { id: "cash", label: "Most Cash", title: "Most Cash", main: "Cash", second: "Lvl" },
  { id: "hard", label: "Hard Mode", title: "Hard Mode Levels", main: "Hard", second: "Lvl" },
];

function fmt(tab: RankTab, which: "main" | "second", v: number) {
  const kind = which === "main" ? tab : tab === "level" ? "time" : "level";
  if (kind === "time") return formatTime(v);
  if (kind === "cash") return formatCash(v);
  return String(v);
}

function Row({ e, tab, pinned }: { e: Entry; tab: RankTab; pinned?: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.6rem_1fr_4.6rem_3.6rem] items-center border-b-2 border-gold/50",
        pinned ? "h-16 border-b-0 bg-gold-light" : "h-12",
        !pinned && e.rank <= 10 && "bg-gold-light/35",
        e.isPlayer && !pinned && "bg-gold-light",
      )}
    >
      <span className={cn("text-center font-display font-bold", pinned ? "text-sm leading-tight" : "text-xl")}>
        {pinned ? (
          <>
            Your
            <br />
            Rank
          </>
        ) : e.rank <= 3 ? (
          <span
            className={cn(
              "mx-auto flex size-8 items-center justify-center rounded-full border-[3px] border-gold-deep text-base",
              e.rank === 1 ? "bg-gold" : e.rank === 2 ? "bg-cream-deep" : "bg-rank",
            )}
          >
            {e.rank}
          </span>
        ) : (
          e.rank
        )}
      </span>
      <span className="flex min-w-0 items-center gap-2 border-l-2 border-gold/50 pl-2">
        <Avatar avatar={e.avatar} color={e.color} className={cn(pinned ? "size-11 text-xl" : "size-9 text-base")} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[0.9375rem] font-semibold leading-tight">{e.name}</span>
          {pinned && <span className="block text-xs font-bold text-muted-foreground">#{e.rank}</span>}
        </span>
      </span>
      <span className="border-l-2 border-gold/50 text-center font-display text-[0.9375rem] font-semibold">
        {fmt(tab, "main", e.value)}
      </span>
      <span className="border-l-2 border-gold/50 text-center font-display text-sm text-muted-foreground">
        {fmt(tab, "second", e.secondary)}
      </span>
    </div>
  );
}

function Ranks() {
  const player = usePlayer();
  const [tab, setTab] = useState<RankTab>("time");
  const meta = TABS.find((t) => t.id === tab)!;
  const rows = leaderboard(tab, {
    name: player.username,
    avatar: player.avatar,
    color: player.avatarColor,
    time: player.timePlayed,
    level: player.highestLevel,
    cash: player.coins,
    hard: player.hardBest,
  });
  const top = rows.slice(0, BOARD_SIZE);
  const me = rows.find((r) => r.isPlayer)!;

  return (
    <Screen>
      <header className="flex items-center">
        <BackToMenu />
      </header>
      <div className="mt-4">
        <PageTitle>RANKS</PageTitle>
      </div>
      <main className="card-3d mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div role="tablist" className="grid grid-cols-4 border-b-[3px] border-gold">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                sfx.tap();
                setTab(t.id);
              }}
              className={cn(
                "h-12 px-1 font-display text-[0.8125rem] font-semibold leading-tight transition-colors",
                i > 0 && "border-l-[3px] border-gold",
                tab === t.id ? "bg-gold-light text-foreground" : "bg-cream-deep/60 text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-b-[3px] border-gold bg-gold px-4 py-2">
          <span className="font-display text-xl font-bold">{meta.title}</span>
          <span className="text-xs font-extrabold">Top 10 win monthly prizes</span>
        </div>
        <div key={tab} className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth" aria-label={`${meta.title}, ranks 1 to ${BOARD_SIZE}`}>
          {top.map((e) => (
            <Row key={`${e.name}-${e.isPlayer}`} e={e} tab={tab} />
          ))}
          <p className="py-3 text-center text-xs font-bold text-muted-foreground">Top {BOARD_SIZE} · scores never reset</p>
        </div>
        <div className="border-t-[3px] border-gold">
          <Row e={me} tab={tab} pinned />
        </div>
      </main>
      <p className="mt-3 text-center text-xs font-bold text-foreground/60">
        1st $10,000 · 2nd $8,000 · 3rd $5,000 · 4th $2,000 · 5th–10th $1,000
      </p>
      <footer className="flex shrink-0 justify-center gap-5 pt-3">
        <Link to="/shop" className={gameButton({ tone: "shop", size: "lg" })}>
          Shop
        </Link>
        <Link to="/play" className={gameButton({ tone: "play", size: "lg" })}>
          Play
        </Link>
      </footer>
    </Screen>
  );
}
