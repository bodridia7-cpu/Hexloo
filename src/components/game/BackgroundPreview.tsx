import { ArrowLeft, Aperture } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { sfx } from "@/game/audio";
import { usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";
import { Scene } from "./Screen";

/** Full-screen look at a background before buying it, with a Blurred / Sharp switch. */
export function BackgroundPreview({ bg, name, onClose }: { bg: string; name: string; onClose: () => void }) {
  const player = usePlayer();
  const [blur, setBlur] = useState(player.blur);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${name} background preview`} className="fixed inset-0 z-[60] isolate animate-in fade-in duration-300">
      <Scene bg={bg} blur={blur} className="absolute z-0" />
      <div className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] flex justify-center px-4">
        <span className="pill-3d inline-flex h-10 items-center gap-2 rounded-full px-4 font-display text-base font-semibold">
          Previewing: {name}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3 px-4">
        <div role="radiogroup" aria-label="Blur" className="pill-3d inline-flex h-11 items-center gap-1 rounded-full p-1">
          {[
            { on: true, label: "Blurred" },
            { on: false, label: "Sharp" },
          ].map((o) => (
            <button
              key={o.label}
              role="radio"
              aria-checked={blur === o.on}
              onClick={() => {
                sfx.tap();
                setBlur(o.on);
              }}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-4 font-display text-sm font-semibold transition-colors",
                blur === o.on ? "bg-gold text-foreground" : "text-muted-foreground",
              )}
            >
              {o.on && <Aperture className="size-4" strokeWidth={2.6} />}
              {o.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            sfx.tap();
            onClose();
          }}
          className="pill-3d inline-flex h-12 items-center gap-2 rounded-full px-6 font-display text-lg font-semibold transition-transform active:scale-95"
        >
          <ArrowLeft className="size-5" strokeWidth={2.8} />
          Back to Shop
        </button>
      </div>
    </div>,
    document.body,
  );
}
