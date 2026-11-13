import { Link } from "@tanstack/react-router";
import { Aperture, Music, Vibrate, Volume2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { audioContext, sfx } from "@/game/audio";
import { haptic } from "@/game/haptics";
import { music } from "@/game/music";
import { updatePlayer, usePlayer, type PlayerData } from "@/game/store";
import { cn } from "@/lib/utils";
import { gameButton } from "./GameButton";
import { GameModal } from "./GameModal";

function ToggleRow({
  icon,
  label,
  hint,
  on,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="pill-3d flex min-h-16 items-center justify-between gap-3 rounded-[1.4rem] px-4 py-2 text-left transition-transform active:scale-[0.98]"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-gold bg-gold-light">
          {icon}
        </span>
        <span>
          <span className="block text-lg leading-tight">{label}</span>
          <span className="block font-sans text-xs font-bold text-muted-foreground">{hint}</span>
        </span>
      </span>
      <span className={cn("toggle-track", on && "toggle-on")}>
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}

const flip = (key: "music" | "sfx" | "blur" | "vibration") => updatePlayer((s: PlayerData) => ({ ...s, [key]: !s[key] }));

export function SettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const player = usePlayer();
  return (
    <GameModal open={open} onOpenChange={onOpenChange} title="Settings">
      <div className="flex flex-col gap-3">
        <ToggleRow
          icon={<Music className="size-5" strokeWidth={2.6} />}
          label="Calm Background Music"
          hint="Gentle lo-fi chords"
          on={player.music}
          onToggle={() => {
            if (player.music) music.stop();
            else music.start();
            flip("music");
            sfx.tap();
          }}
        />
        <ToggleRow
          icon={<Volume2 className="size-5" strokeWidth={2.6} />}
          label="Sound Effects"
          hint="Wooden clicks & marimba chimes"
          on={player.sfx}
          onToggle={() => {
            flip("sfx");
            sfx.tap();
          }}
        />
        <ToggleRow
          icon={<Aperture className="size-5" strokeWidth={2.6} />}
          label="Background Blur"
          hint="Soft-focus background"
          on={player.blur}
          onToggle={() => {
            flip("blur");
            sfx.tap();
          }}
        />
        <ToggleRow
          icon={<Vibrate className="size-5" strokeWidth={2.6} />}
          label="Vibration"
          hint="Gentle taps when you move & pop"
          on={player.vibration}
          onToggle={() => {
            flip("vibration");
            sfx.tap();
            if (!player.vibration) haptic.snap();
          }}
        />
        <Link to="/" className={gameButton({ tone: "rank", size: "md", className: "mt-1 w-full" })}>
          Return to Menu
        </Link>
      </div>
    </GameModal>
  );
}

/** Keeps the background music in step with the setting. Browsers only allow sound after a tap. */
export function MusicController() {
  const { music: on } = usePlayer();
  useEffect(() => {
    if (!on) {
      music.stop();
      return;
    }
    const start = () => {
      if (document.visibilityState === "visible") music.start();
    };
    const ctx = audioContext.peek();
    if (ctx?.state === "running") start();
    const onGesture = () => start();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") music.stop();
      else if (audioContext.peek()?.state === "running") start();
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [on]);
  return null;
}
