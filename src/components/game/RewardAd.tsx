import { useEffect, useState } from "react";

import { AD_SECONDS } from "@/game/catalog";
import { GameModal } from "./GameModal";
import { HexStackPreview } from "./HexPreview";
import { cn } from "@/lib/utils";

/** Simulated 5-second reward video. Only ever opened by the player's own tap. */
export function RewardAd({
  open,
  rewardLabel,
  onDone,
  golden = false,
}: {
  open: boolean;
  rewardLabel: string;
  onDone: () => void;
  golden?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    const start = performance.now();
    let raf = 0;
    let finished = false;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      setElapsed(Math.min(t, AD_SECONDS));
      if (t >= AD_SECONDS + 0.6) {
        if (!finished) {
          finished = true;
          onDone();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const done = elapsed >= AD_SECONDS;
  const left = Math.max(0, Math.ceil(AD_SECONDS - elapsed));

  return (
    <GameModal open={open} onOpenChange={() => {}} title="Reward Video" locked>
      <div className="relative overflow-hidden rounded-2xl border-[3px] border-gold-light bg-cream-deep">
        <div className="scene relative flex h-44 flex-col items-center justify-center">
          <div className="ad-bounce">
            <HexStackPreview hexa={golden ? "sparkles" : "glass"} height={6} size={64} />
          </div>
          <p className="mt-2 font-display text-lg font-semibold text-foreground">
            Relax. Sort. Flow.
          </p>
        </div>
        <span className="pill-3d absolute right-2 top-2 rounded-full px-3 py-0.5 text-sm">
          {done ? "✓" : `${left}s`}
        </span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-gold bg-cream-deep">
        <div
          className={cn("h-full rounded-full transition-[width] duration-100", golden ? "bg-gold" : "bg-play")}
          style={{ width: `${(elapsed / AD_SECONDS) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-center font-display text-lg font-semibold">
        {done ? `Reward unlocked: ${rewardLabel}!` : `Watch to earn ${rewardLabel}`}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">Simulated ad · plays offline</p>
    </GameModal>
  );
}
