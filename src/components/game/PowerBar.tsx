import { Bomb, Palette, Shuffle, Snowflake, Zap, type LucideIcon } from "lucide-react";

import { formatCash } from "@/game/ranks";
import { POWERS, powerById, type PowerId } from "@/game/powers";
import { cn } from "@/lib/utils";

const ICONS: Record<PowerId, LucideIcon> = {
  shuffle: Shuffle,
  zap: Zap,
  freeze: Snowflake,
  recolour: Palette,
  bomb: Bomb,
};

/** Hard Mode only: a row of 5 round, golden-bordered power-up buttons. */
export function PowerBar({
  coins,
  armed,
  disabled,
  onPick,
  onCancel,
}: {
  coins: number;
  armed: PowerId | null;
  disabled: boolean;
  onPick: (id: PowerId) => void;
  onCancel: () => void;
}) {
  const current = armed ? powerById(armed) : null;
  return (
    <section aria-label="Power-ups" className="relative shrink-0 pt-2">
      {current && (
        <div className="absolute inset-x-0 -top-9 z-10 flex justify-center">
          <div className="pill-3d banner-in inline-flex h-9 items-center gap-2 rounded-full pl-4 pr-1 text-sm">
            <span>{current.hint}</span>
            <button
              onClick={onCancel}
              className="rounded-full bg-hard px-3 py-1 text-xs uppercase tracking-wide text-on-color transition-transform active:scale-90"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ul className="flex justify-center gap-2 sm:gap-3">
        {POWERS.map((p) => {
          const Icon = ICONS[p.id];
          const afford = coins >= p.cost;
          const on = armed === p.id;
          return (
            <li key={p.id} className="flex w-[4.1rem] flex-col items-center">
              <button
                onClick={() => (on ? onCancel() : onPick(p.id))}
                disabled={disabled || (!afford && !on)}
                aria-pressed={on}
                aria-label={`${p.label}, ${formatCash(p.cost)}`}
                className={cn(
                  "pill-3d relative inline-flex size-[3.4rem] items-center justify-center rounded-full transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-55 disabled:grayscale-[0.5]",
                  on && "power-selected scale-105 bg-gold-light",
                  p.id === "freeze" && "text-frost-deep",
                  p.id === "bomb" && "text-hard-deep",
                )}
              >
                <Icon className="size-7" strokeWidth={2.4} />
              </button>
              <span className="mt-1 flex flex-col items-center rounded-xl border-2 border-gold bg-cream/90 px-1.5 py-0.5 leading-none">
                <span className="whitespace-nowrap font-display text-[0.62rem] font-semibold text-foreground">{p.label}</span>
                <span className={cn("mt-0.5 font-display text-[0.7rem] font-bold", afford ? "text-gold-deep" : "text-muted-foreground")}>
                  {formatCash(p.cost)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
