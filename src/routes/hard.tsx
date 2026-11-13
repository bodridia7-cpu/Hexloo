import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Snowflake } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { gameButton, GameButton } from "@/components/game/GameButton";
import { GameModal } from "@/components/game/GameModal";
import { HexBoard, type Aim, type BlastFx, type DropFx, type PopFx } from "@/components/game/HexBoard";
import { PowerBar } from "@/components/game/PowerBar";
import { CoinAdButtons, TripleBadge, usePlayClock } from "@/components/game/CoinAds";
import { CoinPill } from "@/components/game/Hud";
import { Screen } from "@/components/game/Screen";
import { SettingsModal } from "@/components/game/Settings";
import { sfx } from "@/game/audio";
import { coinMultiplier } from "@/game/boosts";
import { canPop, CELLS, clearBonus, isCleared, moveGroup, mulberry32, popReward, popStack, stackAt, topGroup } from "@/game/engine";
import { haptic } from "@/game/haptics";
import { dealHardBoard, hardLevelForPops, isGameOver, movesUntilSpawn, newHardRun, spawnTurn, type HardRun } from "@/game/hard";
import { applyPower, blastCells, canAfford, freezeRun, frozenMovesLeft, FREEZE_MOVES, powerById, powerTargets, type PowerId } from "@/game/powers";
import { formatCash } from "@/game/ranks";
import { baseFor, getPlayer, hexaFor, updatePlayer, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hexloo Hard Mode — Beat the Filling Board" },
      {
        name: "description",
        content: "New mixed stacks keep arriving every few moves. Pop towers of ten before the board fills up and climb the Hard Mode ranks.",
      },
      { property: "og:title", content: "Hexloo Hard Mode — Beat the Filling Board" },
      {
        property: "og:description",
        content: "New mixed stacks keep arriving every few moves. Pop towers of ten before the board fills up and climb the Hard Mode ranks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hard,
});

const seed = () => (Date.now() ^ Math.imul(Math.floor(Math.random() * 1e9), 2654435761)) >>> 0;

const setRun = (fn: (r: HardRun) => HardRun) =>
  updatePlayer((s) => (s.hardRun ? { ...s, hardRun: fn(s.hardRun) } : s));

function Hard() {
  const player = usePlayer();
  const run = player.hardRun;
  const [pops, setPops] = useState<PopFx[]>([]);
  const [lastDrop, setLastDrop] = useState<DropFx | null>(null);
  const [spawns, setSpawns] = useState<DropFx[]>([]);
  const [incoming, setIncoming] = useState(0);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<number | null>(null);
  const [over, setOver] = useState<{ level: number; coins: number; best: boolean } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [round, setRound] = useState(0);
  const [armed, setArmed] = useState<PowerId | null>(null);
  const [blasts, setBlasts] = useState<BlastFx[]>([]);
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

  const startRun = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPops([]);
    setLastDrop(null);
    setSpawns([]);
    setBanner(null);
    setOver(null);
    setArmed(null);
    setBlasts([]);
    setRound((r) => r + 1);
    updatePlayer((s) => ({ ...s, hardRun: { ...newHardRun(mulberry32(seed())), bestBefore: s.hardBest } }));
    lock(false);
  };

  const endRun = (r: HardRun) => {
    const prevBest = r.bestBefore ?? getPlayer().hardBest;
    updatePlayer((s) => ({ ...s, hardBest: Math.max(s.hardBest, r.level), hardRun: null }));
    setOver({ level: r.level, coins: r.coins, best: r.level > prevBest });
    sfx.invalid();
    haptic.pop();
  };

  /** After a move and any pops: maybe drop in new stacks, then check for a full board. */
  const settle = () => {
    const r = getPlayer().hardRun;
    if (!r) return lock(false);
    const { run: next, cells, blocked } = spawnTurn(r, mulberry32(seed()));
    if (next !== r) updatePlayer((s) => ({ ...s, hardRun: next }));
    if (cells.length) {
      const stamp = Date.now();
      setSpawns(cells.map((cell) => ({ cell, from: 0, stamp })));
      setIncoming(cells.length);
      sfx.drop(cells.length, 3);
      later(() => setIncoming(0), 1400);
    }
    if (isGameOver(next.board, blocked)) {
      updatePlayer((s) => ({ ...s, hardRun: { ...next, over: true } }));
      lock(true);
      later(() => endRun(next), 750);
      return;
    }
    lock(false);
  };

  const schedulePop = (cell: number, delay: number) => {
    lock(true);
    later(() => {
      const p = getPlayer();
      const r = p.hardRun;
      if (!r || !canPop(stackAt(r.board, cell))) return settle();
      const color = topGroup(stackAt(r.board, cell))!.color;
      let board = popStack(r.board, cell);
      const amount = popReward(coinMultiplier(p, Date.now()));
      const popCount = r.pops + 1;
      const level = hardLevelForPops(popCount);
      const cleared = isCleared(board);
      const bonus = cleared ? clearBonus(coinMultiplier(p, Date.now())) : 0;
      if (cleared) board = dealHardBoard(r.colors, mulberry32(seed()));
      updatePlayer((s) => ({
        ...s,
        coins: s.coins + amount + bonus,
        hardBest: Math.max(s.hardBest, level),
        hardRun: { ...r, board, pops: popCount, level, coins: r.coins + amount + bonus },
      }));
      const id = ++fxId.current;
      setPops((list) => [...list, { id, cell, base: stackAt(board, cell).length, color, amount }]);
      later(() => setPops((list) => list.filter((f) => f.id !== id)), 1100);
      sfx.pop();
      haptic.pop();
      if (level > r.level) {
        later(() => {
          setBanner(level);
          sfx.levelUp();
        }, 350);
        later(() => setBanner(null), 2000);
      }
      if (!cleared && canPop(stackAt(board, cell))) schedulePop(cell, 480);
      else settle();
    }, delay);
  };

  // Start or resume a run.
  useEffect(() => {
    const r = getPlayer().hardRun;
    if (!r || r.board.stacks.length !== CELLS.length) {
      updatePlayer((s) => ({ ...s, hardRun: { ...newHardRun(mulberry32(seed())), bestBefore: s.hardBest } }));
    } else if (r.over) {
      lock(true);
      later(() => endRun(r), 500);
    } else {
      const pending = r.board.stacks.findIndex((s) => canPop(s));
      if (pending >= 0) schedulePop(pending, 400);
      else settle();
    }
    const list = timers.current;
    return () => list.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hard Mode counts towards total time played and the golden 3x button, same as normal Play.
  usePlayClock();

  const handleMove = (from: number, to: number) => {
    if (busyRef.current) return;
    const r = getPlayer().hardRun;
    if (!r) return;
    const g = topGroup(stackAt(r.board, from));
    if (!g) return;
    const start = stackAt(r.board, to).length;
    const nb = moveGroup(r.board, from, to);
    if (nb === r.board) return;
    setRun((x) => ({ ...x, board: nb, moves: x.moves + 1 }));
    setSpawns([]);
    setLastDrop({ cell: to, from: start, stamp: Date.now() });
    sfx.drop(g.count, stackAt(nb, to).length);
    haptic.snap();
    if (canPop(stackAt(nb, to))) schedulePop(to, 340);
    else {
      lock(true);
      later(settle, 260);
    }
  };

  const left = run ? movesUntilSpawn(run.moves) : 3;
  const frozen = run ? frozenMovesLeft(run) : 0;

  /** Tapping a power-up: Freeze works straight away, the others wait for a tap on the board. */
  const pickPower = (id: PowerId) => {
    if (busyRef.current) return;
    const p = getPlayer();
    const r = p.hardRun;
    if (!r) return;
    const power = powerById(id);
    if (!canAfford(p.coins, id)) {
      sfx.invalid();
      return;
    }
    if (power.aim === "now") {
      updatePlayer((s) => (s.hardRun ? { ...s, coins: s.coins - power.cost, hardRun: freezeRun(s.hardRun) } : s));
      setArmed(null);
      sfx.power();
      haptic.power();
      toast(`Freeze! No new stacks for ${FREEZE_MOVES} moves`);
      return;
    }
    if (!powerTargets(r.board, id).length) {
      sfx.invalid();
      toast(id === "zap" || id === "bomb" ? "There's nothing on the board to use that on." : "No mixed stacks to use that on right now.");
      return;
    }
    sfx.tap();
    haptic.pickup();
    setArmed(id);
  };

  /** Uses the armed power-up on a slot. Coins are only spent here, once it actually lands. */
  const aimAt = (cell: number) => {
    const id = armed;
    if (!id || busyRef.current) return;
    const p = getPlayer();
    const r = p.hardRun;
    if (!r) return;
    const power = powerById(id);
    if (!canAfford(p.coins, id)) {
      setArmed(null);
      sfx.invalid();
      return;
    }
    let board = applyPower(r.board, id, cell, mulberry32(seed()));
    if (!board) {
      sfx.invalid();
      return;
    }
    const hit = id === "bomb" ? blastCells(cell) : [cell];
    if (isCleared(board)) board = dealHardBoard(r.colors, mulberry32(seed()));
    const next = board;
    updatePlayer((s) => (s.hardRun ? { ...s, coins: s.coins - power.cost, hardRun: { ...s.hardRun, board: next } } : s));
    setArmed(null);
    setSpawns([]);
    const id2 = ++fxId.current;
    setBlasts((list) => [...list, { id: id2, cells: hit, centre: cell, kind: id === "bomb" ? "bomb" : id === "zap" ? "zap" : "sparkle" }]);
    later(() => setBlasts((list) => list.filter((f) => f.id !== id2)), 1000);
    if (id === "bomb") {
      sfx.boom();
      haptic.bomb();
    } else {
      sfx.power();
      haptic.power();
    }
    if (id === "shuffle" || id === "recolour") setLastDrop({ cell, from: 0, stamp: Date.now() });
    if (canPop(stackAt(next, cell))) schedulePop(cell, 420);
    else {
      lock(true);
      later(settle, 200);
    }
  };

  const aim = useMemo<Aim | null>(() => {
    if (!armed || !run) return null;
    const p = powerById(armed);
    if (p.aim === "now") return null;
    return {
      kind: p.aim,
      targets: powerTargets(run.board, armed),
      preview: armed === "bomb" ? (c: number) => blastCells(c) : undefined,
    };
  }, [armed, run]);

  return (
    <Screen>
      <header className="relative min-h-32 shrink-0">
        <div className="flex justify-center gap-2 pr-12 pt-1 min-[400px]:pr-0">
          <span className="pill-3d inline-flex h-11 min-w-24 items-center justify-center gap-1.5 rounded-full px-4 text-xl">
            <span className="rounded-full bg-hard px-2 text-xs leading-5 text-on-color">HARD</span>
            Lv {run?.level ?? 1}
          </span>
          <CoinPill className="min-w-24" />
        </div>
        <div className="mt-2 flex justify-center pr-12 min-[400px]:pr-0">
          <span
            className={cn(
              "pill-3d inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm transition-transform",
              incoming > 0 && "scale-110 bg-gold-light",
              frozen > 0 && incoming === 0 && "bg-frost text-frost-deep",
            )}
            aria-live="polite"
          >
            {frozen > 0 && incoming === 0 ? (
              <>
                Frozen
                <span className="flex gap-0.5" aria-label={`${frozen} frozen moves left`}>
                  {Array.from({ length: FREEZE_MOVES }, (_, i) => (
                    <Snowflake key={i} className={cn("size-4", i < frozen ? "opacity-100" : "opacity-25")} strokeWidth={2.6} />
                  ))}
                </span>
              </>
            ) : incoming > 0 ? (
              <>+{incoming} new {incoming === 1 ? "stack" : "stacks"}!</>
            ) : (
              <>
                New stacks in
                <span className="flex gap-1" aria-label={`${left} moves`}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span
                      key={i}
                      className={cn("size-2.5 rounded-full border-2 border-hard-deep", i < left ? "bg-hard" : "bg-transparent")}
                    />
                  ))}
                </span>
              </>
            )}
          </span>
        </div>
        <TripleBadge />
        <p className="scene-text mt-1 pr-12 text-center font-display text-xs font-semibold min-[400px]:pr-0">Best: Level {player.hardBest}</p>
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
        {run && (
          <div key={round} className="relative w-full md:absolute md:inset-0 animate-in fade-in zoom-in-95 duration-500">
            <HexBoard
              board={run.board}
              hexa={hexaFor(player.equipped.hexa, player)}
              base={baseFor(player.equipped.base, player)}
              disabled={busy || !!over}
              pops={pops}
              lastDrop={lastDrop}
              spawns={spawns}
              onMove={handleMove}
              aim={aim}
              onAim={aimAt}
              blasts={blasts}
            />
            {frozen > 0 && <div className="frost-edge pointer-events-none absolute inset-0 animate-in fade-in duration-500" aria-hidden />}
          </div>
        )}
        {banner && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="banner-in card-3d flex flex-col items-center px-8 py-5 text-center">
              <p className="title-gold text-5xl">Level {banner}!</p>
              <p className="mt-1 font-display text-lg font-semibold">Hard Mode</p>
            </div>
          </div>
        )}
      </main>

      <PowerBar
        coins={player.coins}
        armed={armed}
        disabled={busy || !!over || !run}
        onPick={pickPower}
        onCancel={() => {
          sfx.tap();
          setArmed(null);
        }}
      />

      <footer className="flex shrink-0 justify-center gap-5 pt-3">
        <Link to="/shop" className={gameButton({ tone: "shop", size: "lg" })}>
          Shop
        </Link>
        <Link to="/ranks" className={gameButton({ tone: "rank", size: "lg" })}>
          Rank
        </Link>
      </footer>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <GameModal open={!!over} onOpenChange={() => {}} locked title="Board Full — Game Over!">
        {over && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="pill-3d flex flex-col items-center rounded-[1.4rem] py-3">
                <span className="font-sans text-xs font-extrabold text-muted-foreground">Hard Mode Level</span>
                <span className="title-gold text-4xl">{over.level}</span>
              </div>
              <div className="pill-3d flex flex-col items-center rounded-[1.4rem] py-3">
                <span className="font-sans text-xs font-extrabold text-muted-foreground">Coins Earned</span>
                <span className="title-gold text-3xl">{formatCash(over.coins)}</span>
              </div>
            </div>
            <p className="text-center font-display text-sm font-semibold text-muted-foreground">
              {over.best ? "New personal best!" : `Your best: Level ${Math.max(player.hardBest, over.level)}`}
            </p>
            <GameButton
              tone="hard"
              size="lg"
              className="w-full"
              onClick={() => {
                sfx.tap();
                startRun();
              }}
            >
              Play Again
            </GameButton>
            <Link to="/" className={gameButton({ tone: "cream", size: "md", className: "w-full" })}>
              Menu
            </Link>
          </div>
        )}
      </GameModal>
    </Screen>
  );
}
