import { ImagePlus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  BASE_TEXTURES,
  BASES,
  CUSTOM_ID,
  DEFAULT_CUSTOM_BASE,
  DEFAULT_CUSTOM_COLORS,
  FINISHES,
  HEXAS,
  type BaseTexture,
  type Finish,
} from "@/game/catalog";
import { sfx } from "@/game/audio";
import { compressImage, setImage, useImage } from "@/game/images";
import { customBaseItem, updatePlayer, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";
import { GameButton } from "./GameButton";
import { GameModal } from "./GameModal";
import { BasePreview, HexStackPreview } from "./HexPreview";

type EditorProps = { open: boolean; onOpenChange: (o: boolean) => void };

const label = "mb-2 block font-display text-sm font-semibold text-muted-foreground";

function ColourDot({ value, onChange, name }: { value: string; onChange: (v: string) => void; name: string }) {
  return (
    <label className="relative block size-11 cursor-pointer overflow-hidden rounded-full border-[3px] border-gold shadow-[0_3px_0_var(--gold-deep)] transition-transform active:scale-90">
      <span className="absolute inset-0" style={{ background: value }} />
      <input
        type="color"
        value={value}
        aria-label={name}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function Choice({ active, onClick, children, name }: { active: boolean; onClick: () => void; children: React.ReactNode; name: string }) {
  return (
    <button
      onClick={() => {
        sfx.tap();
        onClick();
      }}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-center rounded-2xl border-[3px] border-gold/70 bg-cream-deep/60 p-1 transition-transform active:scale-95",
        active && "border-gold-deep bg-gold-light ring-2 ring-gold-deep",
      )}
    >
      {children}
      <span className="mt-0.5 font-display text-[11px] font-semibold leading-tight">{name}</span>
    </button>
  );
}

/** Custom Image background: upload any picture from the device (saved locally). */
export function CustomImageEditor({ open, onOpenChange }: EditorProps) {
  const image = useImage("background");
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await compressImage(file, 1280, false, 0.8);
      if (!setImage("background", url)) throw new Error("full");
      updatePlayer((s) => ({ ...s, equipped: { ...s.equipped, background: CUSTOM_ID } }));
      sfx.coin();
      toast.success("Your background is set!");
    } catch {
      toast("Couldn't use that picture. Try a smaller one.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <GameModal open={open} onOpenChange={onOpenChange} title="Custom Image">
      <div className="flex flex-col items-center gap-4">
        <div className="flex aspect-[9/16] w-36 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-gold bg-cream-deep shadow-[0_4px_0_var(--gold-deep)]">
          {image ? (
            <img src={image} alt="Your custom background" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-10 text-muted-foreground" />
          )}
        </div>
        <GameButton tone="shop" size="md" className="w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
          <ImagePlus className="size-5" strokeWidth={2.6} />
          {busy ? "Loading…" : image ? "Choose Another Image" : "Upload Image"}
        </GameButton>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPick(e.target.files?.[0])} />
        <p className="text-center text-xs font-bold text-muted-foreground">Saved only on this device · works offline</p>
      </div>
    </GameModal>
  );
}

/** Custom Hexa: pick a texture style and six tile colours. */
export function CustomHexaEditor({ open, onOpenChange }: EditorProps) {
  const player = usePlayer();
  const [finish, setFinish] = useState<Finish>(player.customHexa.finish);
  const [colors, setColors] = useState<string[]>(player.customHexa.colors);
  const base = HEXAS.find((h) => h.id === CUSTOM_ID)!;
  const draft = { ...base, finish, colors };
  return (
    <GameModal open={open} onOpenChange={onOpenChange} title="Custom Hexa">
      <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto px-1 pb-1">
        <div className="flex justify-center">
          <HexStackPreview hexa={CUSTOM_ID} item={draft} height={12} size={120} />
        </div>
        <div>
          <span className={label}>Texture style</span>
          <div className="grid grid-cols-4 gap-2">
            {FINISHES.map((f) => (
              <Choice key={f.id} active={finish === f.id} onClick={() => setFinish(f.id)} name={f.name}>
                <HexStackPreview hexa={CUSTOM_ID} item={{ ...draft, finish: f.id }} height={3} size={44} />
              </Choice>
            ))}
          </div>
        </div>
        <div>
          <span className={label}>Your 6 tile colours</span>
          <div className="flex justify-between">
            {colors.map((c, i) => (
              <ColourDot
                key={i}
                name={`Tile colour ${i + 1}`}
                value={c}
                onChange={(v) => setColors((list) => list.map((x, j) => (j === i ? v : x)))}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <GameButton
            tone="cream"
            size="md"
            aria-label="Reset colours"
            onClick={() => {
              setColors(DEFAULT_CUSTOM_COLORS);
              setFinish("matte");
            }}
          >
            <RotateCcw className="size-5" strokeWidth={2.6} />
          </GameButton>
          <GameButton
            tone="play"
            size="md"
            className="flex-1"
            onClick={() => {
              updatePlayer((s) => ({ ...s, customHexa: { finish, colors }, equipped: { ...s.equipped, hexa: CUSTOM_ID } }));
              sfx.coin();
              toast.success("Custom Hexa saved & equipped!");
              onOpenChange(false);
            }}
          >
            Save
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}

/** Custom Base: pick a board texture plus surface and rim colours. */
export function CustomBaseEditor({ open, onOpenChange }: EditorProps) {
  const player = usePlayer();
  const [texture, setTexture] = useState<BaseTexture>(player.customBase.texture);
  const [surface, setSurface] = useState(player.customBase.surface);
  const [rim, setRim] = useState(player.customBase.rim);
  const base = BASES.find((b) => b.id === CUSTOM_ID)!;
  const draft = customBaseItem(base, { texture, surface, rim });
  return (
    <GameModal open={open} onOpenChange={onOpenChange} title="Custom Base">
      <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto px-1 pb-1">
        <div className="flex justify-center">
          <BasePreview base={CUSTOM_ID} item={draft} size={170} />
        </div>
        <div>
          <span className={label}>Base texture</span>
          <div className="grid grid-cols-5 gap-1.5">
            {BASE_TEXTURES.map((t) => (
              <Choice key={t.id} active={texture === t.id} onClick={() => setTexture(t.id)} name={t.name}>
                <BasePreview base={CUSTOM_ID} item={{ ...draft, texture: t.id }} size={44} />
              </Choice>
            ))}
          </div>
        </div>
        <div className="flex justify-around">
          <div className="flex flex-col items-center gap-1">
            <ColourDot name="Surface colour" value={surface} onChange={setSurface} />
            <span className="font-display text-sm font-semibold">Surface</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ColourDot name="Outer rim colour" value={rim} onChange={setRim} />
            <span className="font-display text-sm font-semibold">Outer rim</span>
          </div>
        </div>
        <div className="flex gap-3">
          <GameButton
            tone="cream"
            size="md"
            aria-label="Reset base"
            onClick={() => {
              setTexture(DEFAULT_CUSTOM_BASE.texture);
              setSurface(DEFAULT_CUSTOM_BASE.surface);
              setRim(DEFAULT_CUSTOM_BASE.rim);
            }}
          >
            <RotateCcw className="size-5" strokeWidth={2.6} />
          </GameButton>
          <GameButton
            tone="play"
            size="md"
            className="flex-1"
            onClick={() => {
              updatePlayer((s) => ({ ...s, customBase: { texture, surface, rim }, equipped: { ...s.equipped, base: CUSTOM_ID } }));
              sfx.coin();
              toast.success("Custom Base saved & equipped!");
              onOpenChange(false);
            }}
          >
            Save
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}
