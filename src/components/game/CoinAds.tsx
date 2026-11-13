import { useEffect, useState } from "react";
import { toast } from "sonner";

import { gameButton } from "@/components/game/GameButton";
import { RewardAd } from "@/components/game/RewardAd";
import { sfx } from "@/game/audio";
import { BOOST3_AD_MS, extendBoost, formatClock, goldenVisible, tickGolden } from "@/game/boosts";
import { BOOST_DURATION_MS } from "@/game/engine";
import { updatePlayer, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Counts play time while a game screen is open; every 30 minutes the golden 3x button shows for 60 seconds. */
export function usePlayClock() {
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      updatePlayer((s) => {
        const timePlayed = s.timePlayed + 5;
        const golden = tickGolden({ timePlayed, goldenNextAt: s.goldenNextAt, goldenUntil: s.goldenUntil }, Date.now());
        return { ...s, timePlayed, ...golden };
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);
}

/** Green "AD FOR 2x Coin" + timed golden "AD FOR 3x Coin" buttons and their reward videos. Shared by every game mode. */
export function CoinAdButtons() {
  const [adOpen, setAdOpen] = useState(false);
  const [goldenAdOpen, setGoldenAdOpen] = useState(false);
  return (
    <>
      <BoostButton onWatch={() => setAdOpen(true)} />
      <GoldenButton onWatch={() => setGoldenAdOpen(true)} />
      <RewardAd
        open={adOpen}
        rewardLabel="2x Coins for 10 min"
        onDone={() => {
          updatePlayer((s) => ({ ...s, boostUntil: Date.now() + BOOST_DURATION_MS }));
          setAdOpen(false);
          sfx.coin();
          toast.success("2x Coins active for 10:00!");
        }}
      />
      <RewardAd
        open={goldenAdOpen}
        golden
        rewardLabel="3x Coins for 10 min"
        onDone={() => {
          updatePlayer((s) => ({ ...s, boost3Until: extendBoost(s.boost3Until, Date.now(), BOOST3_AD_MS), goldenUntil: 0 }));
          setGoldenAdOpen(false);
          sfx.coin();
          toast.success("3x Coins active for 10:00!");
        }}
      />
    </>
  );
}

function BoostButton({ onWatch }: { onWatch: () => void }) {
  const { boostUntil } = usePlayer();
  const now = useNow();
  const left = Math.max(0, boostUntil - now);
  const active = left > 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  return (
    <button
      onClick={() => {
        if (active) return;
        sfx.tap();
        onWatch();
      }}
      aria-label={active ? `2x coins active, ${mm}:${ss} left` : "Watch a short ad for 2x coins"}
      className={cn(
        gameButton({ tone: "play", size: "icon" }),
        "absolute right-0 top-16 z-20 size-[4.25rem] flex-col gap-0 text-[0.6875rem] leading-tight tracking-normal normal-case",
        active && "cursor-default",
      )}
    >
      {active ? (
        <>
          <span className="text-xl leading-none">2x</span>
          <span className="text-xs">
            {mm}:{ss}
          </span>
        </>
      ) : (
        <>
          <span className="text-sm">AD</span>
          <span>FOR 2x</span>
          <span>Coin</span>
        </>
      )}
    </button>
  );
}

/** Timed golden button: shows for 60 seconds every 30 minutes of playtime. */
function GoldenButton({ onWatch }: { onWatch: () => void }) {
  const p = usePlayer();
  const now = useNow();
  if (!goldenVisible(p, now)) return null;
  const left = Math.ceil((p.goldenUntil - now) / 1000);
  return (
    <div className="absolute right-0 top-[9.25rem] z-20 flex flex-col items-center animate-in zoom-in-50 duration-300">
      <button
        onClick={() => {
          sfx.tap();
          onWatch();
        }}
        aria-label={`Watch a short ad for 3x coins, ${left} seconds left`}
        className={cn(
          gameButton({ tone: "gold", size: "icon" }),
          "btn-shimmer size-[4.25rem] flex-col gap-0 text-[0.6875rem] leading-tight tracking-normal normal-case",
        )}
      >
        <span className="text-sm">AD</span>
        <span>FOR 3x</span>
        <span>Coin</span>
      </button>
      <span className="pill-3d -mt-1 rounded-full px-2 text-xs leading-5" aria-hidden>
        0:{String(left).padStart(2, "0")}
      </span>
    </div>
  );
}

/** Live countdown while a 3x boost (golden ad or spin wheel) is running. */
export function TripleBadge() {
  const { boost3Until } = usePlayer();
  const now = useNow();
  if (boost3Until <= now) return null;
  return (
    <div className="mt-2 flex justify-center pr-12 min-[400px]:pr-0">
      <span className="pill-3d inline-flex h-8 items-center gap-1.5 rounded-full bg-gold-light px-3 text-sm">
        <span className="title-gold text-lg [-webkit-text-stroke:1.5px_var(--gold-deep)]">3x</span>
        Coins · {formatClock(boost3Until - now)}
      </span>
    </div>
  );
}
