import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { gameButton, GameButton } from "@/components/game/GameButton";
import { HexBoard, type DropFx, type PopFx } from "@/components/game/HexBoard";
import { CoinPill } from "@/components/game/Hud";
import { CoinAdButtons, TripleBadge, usePlayClock } from "@/components/game/CoinAds";
import { Screen } from "@/components/game/Screen";
import { SettingsModal } from "@/components/game/Settings";
import { sfx } from "@/game/audio";
import { haptic } from "@/game/haptics";
import {
  canPop,
  CELLS,
  clearBonus,
  generateLevel,
  hasMoves,
  isCleared,
  moveGroup,
  mulberry32,
  popReward,
  popStack,
  reshuffle,
  stackAt,
  suggestMove,
  topGroup,
} from "@/game/engine";
import { coinMultiplier } from "@/game/boosts";
import { baseFor, finishTutorial, getPlayer, hexaFor, needsTutorial, updatePlayer, usePlayer } from "@/game/store";

export const Route = createFileRoute("/play")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Play Hexloo — Sort the Hexagon Stacks" },
      {
        name: "description",
        content: "Drag the top colour off each stack, build towers of ten and clear the board level after level.",
      },
      { property: "og:title", content: "Play Hexloo — Sort the Hexagon Stacks" },
      {
        property: "og:description",
        content: "Drag the top colour off each stack, build towers of ten and clear the board level after level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Play,
});

const seed = (level: number) => (Date.now() ^ Math.imul(level, 2654435761)) >>> 0;

function Play() {
  const player = usePlayer();
  const [pops, setPops] = useState<PopFx[]>([]);
  const [lastDrop, setLastDrop] = useState<DropFx | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ level: number; bonus: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const fxId = useRef(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const lock = (on: boolean) => {
    busyRef.current = on;
    setBusy(on);
  };

  const newBoard = useCallback((level: number) => {
    updatePlayer((s) => ({ ...s, board: generateLevel(level, mulberry32(seed(level))) }));
  }, []);

  const levelUp = () => {
    const p = getPlayer();
    const bonus = clearBonus(coinMultiplier(p, Date.now()));
    const next = p.level + 1;
    updatePlayer((s) => ({
      ...s,
      coins: s.coins + bonus,
      level: next,
      highestLevel: Math.max(s.highestLevel, next),
    }));
    later(() => {
      setBanner({ level: next, bonus });
      sfx.levelUp();
    }, 450);
    later(() => {
      setBanner(null);
      setLastDrop(null);
      newBoard(next);
      lock(false);
    }, 2900);
  };

  const schedulePop = (cell: number, delay: number) => {
    lock(true);
    later(() => {
      const p = getPlayer();
      const b = p.board;
      if (!b || !canPop(stackAt(b, cell))) {
        lock(false);
        return;
      }
      const color = topGroup(stackAt(b, cell))!.color;
      const nb = popStack(b, cell);
      const amount = popReward(coinMultiplier(p, Date.now()));
      updatePlayer((s) => ({ ...s, board: nb, coins: s.coins + amount }));
      const id = ++fxId.current;
      setPops((list) => [...list, { id, cell, base: stackAt(nb, cell).length, color, amount }]);
      later(() => setPops((list) => list.filter((f) => f.id !== id)), 1100);
      sfx.pop();
      haptic.pop();
      if (canPop(stackAt(nb, cell))) schedulePop(cell, 480);
      else if (isCleared(nb)) levelUp();
      else lock(false);
    }, delay);
  };

  // Start or resume the board.
  useEffect(() => {
    const p = getPlayer();
    const b = p.board;
    if (!b || b.stacks.length !== CELLS.length || isCleared(b)) {
      newBoard(p.level);
    } else {
      const pending = b.stacks.findIndex((s) => canPop(s));
      if (pending >= 0) schedulePop(pending, 400);
    }
    const list = timers.current;
    return () => list.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Total time played (also drives the golden 3x button).
  usePlayClock();

  const handleMove = (from: number, to: number) => {
    if (busyRef.current) return;
    const b = getPlayer().board;
    if (!b) return;
    const g = topGroup(stackAt(b, from));
    if (!g) return;
    const start = stackAt(b, to).length;
    const nb = moveGroup(b, from, to);
    if (nb === b) return;
    updatePlayer((s) => ({ ...s, board: nb }));
    finishTutorial();
    setLastDrop({ cell: to, from: start, stamp: Date.now() });
    sfx.drop(g.count, stackAt(nb, to).length);
    haptic.snap();
    if (canPop(stackAt(nb, to))) schedulePop(to, 340);
  };

  const board = player.board;
  const stuck = !!board && !busy && !isCleared(board) && !hasMoves(board);
  const tutorial = needsTutorial(player) && !!board && !busy;
  const hint = tutorial ? suggestMove(board) : null;

  return (
    <Screen>
      <header className="relative h-32 shrink-0">
        <div className="flex justify-center gap-2 pr-12 pt-1 min-[400px]:pr-0">
          <span className="pill-3d inline-flex h-11 min-w-24 items-center justify-center rounded-full px-4 text-xl">
            Level {player.level}
          </span>
          <CoinPill className="min-w-24" />
        </div>
        <TripleBadge />
        <button
          onClick={() => {
            sfx.tap();
            setSettingsOpen(true);
          }}
          aria-label="Settings"
          className="pill-3d absolute right-0 top-0 inline-flex size-12 items-center justify-center rounded-full transition-transform active:scale-90"
        >
          <Settings className="size-7" strokeWidth={2.6} />
        </button>
        <CoinAdButtons />
      </header>

      <main className="relative flex flex-1 items-center justify-center md:min-h-0">
        {board && (
          <div key={player.level} className="w-full md:absolute md:inset-0 animate-in fade-in zoom-in-95 duration-500">
            <HexBoard
              board={board}
              hexa={hexaFor(player.equipped.hexa, player)}
              base={baseFor(player.equipped.base, player)}
              disabled={busy}
              pops={pops}
              lastDrop={lastDrop}
              onMove={handleMove}
              hint={hint}
            />
          </div>
        )}
        {tutorial && (
          <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center px-2 animate-in fade-in slide-in-from-top-2 duration-500">
            <p role="status" className="tutorial-tip max-w-xs px-4 py-2 text-center font-display text-sm font-semibold leading-snug">
              Drag the top matching colours onto a matching stack or empty space — reach 10 to pop!
            </p>
          </div>
        )}
        {stuck && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <GameButton
              tone="gold"
              size="md"
              onClick={() => {
                sfx.tap();
                updatePlayer((s) => ({ ...s, board: reshuffle(s.board!, mulberry32(seed(s.level))) }));
              }}
            >
              No moves · Shuffle
            </GameButton>
          </div>
        )}
        {banner && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="banner-in card-3d flex flex-col items-center px-8 py-5 text-center">
              <span className="text-2xl" aria-hidden>
                ✨🌿✨
              </span>
              <p className="title-gold text-5xl">Level Up!</p>
              <p className="mt-1 font-display text-xl font-semibold">Board Clear +${banner.bonus}</p>
              <p className="text-sm font-bold text-muted-foreground">Next: Level {banner.level}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="flex shrink-0 justify-center gap-5 pt-2">
        <Link to="/shop" className={gameButton({ tone: "shop", size: "lg" })}>
          Shop
        </Link>
        <Link to="/ranks" className={gameButton({ tone: "rank", size: "lg" })}>
          Rank
        </Link>
      </footer>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

    </Screen>
  );
}
