import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AVATAR_COLORS, AVATARS } from "@/game/catalog";
import { sfx } from "@/game/audio";
import { compressImage, setImage, useImage } from "@/game/images";
import { updatePlayer, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";
import { Avatar, avatarColorClass } from "./Avatar";
import { GameButton } from "./GameButton";
import { GameModal } from "./GameModal";

export function ProfilePill() {
  const player = usePlayer();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          sfx.tap();
          setOpen(true);
        }}
        className="group relative flex items-center transition-transform active:scale-95"
        aria-label="Edit profile"
      >
        <span className="pill-3d flex h-11 items-center rounded-full pl-14 pr-5 text-lg">
          <span className="max-w-32 truncate">{player.username}</span>
        </span>
        <Avatar
          avatar={player.avatar}
          color={player.avatarColor}
          className="absolute left-0 size-14 border-4 shadow-[0_3px_0_var(--gold-deep)]"
        />
      </button>
      {open && <ProfileModal open={open} onOpenChange={setOpen} />}
    </>
  );
}

function ProfileModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const player = usePlayer();
  const photo = useImage("avatar");
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(player.username);
  const [avatar, setAvatar] = useState(player.avatar);
  const [color, setColor] = useState(player.avatarColor);
  const [busy, setBusy] = useState(false);

  const save = () => {
    const username = name.trim().slice(0, 16) || "Player";
    updatePlayer((s) => ({ ...s, username, avatar: avatar === "photo" && !photo ? "bunny" : avatar, avatarColor: color }));
    sfx.coin();
    onOpenChange(false);
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await compressImage(file, 256, true);
      if (!setImage("avatar", url)) throw new Error("full");
      setAvatar("photo");
      sfx.coin();
    } catch {
      toast("Couldn't use that picture. Try a different one.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <GameModal open={open} onOpenChange={onOpenChange} title="Edit Profile">
      <div className="flex max-h-[72dvh] flex-col items-center gap-4 overflow-y-auto px-1 pb-1">
        <Avatar avatar={avatar} color={color} className="size-24 border-4" />
        <label className="w-full">
          <span className="mb-1 block font-display text-sm font-semibold text-muted-foreground">Username</span>
          <input
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            className="pill-3d h-12 w-full rounded-full px-5 text-lg outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
            placeholder="Your name"
          />
        </label>
        <div className="w-full">
          <span className="mb-2 block font-display text-sm font-semibold text-muted-foreground">Avatar</span>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => {
                  sfx.tap();
                  setAvatar(a);
                }}
                aria-label={`Avatar ${a}`}
                aria-pressed={avatar === a}
                className={cn(
                  "flex justify-center rounded-full p-0.5 transition-transform active:scale-90",
                  avatar === a && "ring-4 ring-gold-deep",
                )}
              >
                <Avatar avatar={a} color={color} className="size-14" />
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <GameButton tone="shop" size="md" className="flex-1" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Camera className="size-5" strokeWidth={2.6} />
              {busy ? "Loading…" : "Upload Photo"}
            </GameButton>
            {photo && (
              <button
                onClick={() => {
                  sfx.tap();
                  setAvatar("photo");
                }}
                aria-label="Use my photo"
                aria-pressed={avatar === "photo"}
                className={cn("rounded-full p-0.5 transition-transform active:scale-90", avatar === "photo" && "ring-4 ring-gold-deep")}
              >
                <Avatar avatar="photo" color={color} className="size-12" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
          <p className="mt-1 text-center text-xs font-bold text-muted-foreground">Saved only on this device</p>
        </div>
        <div className="w-full">
          <span className="mb-2 block font-display text-sm font-semibold text-muted-foreground">Colour</span>
          <div className="flex justify-between p-1">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Colour ${c}`}
                aria-pressed={color === c}
                className={cn(
                  "size-10 rounded-full border-[3px] border-gold transition-transform active:scale-90",
                  avatarColorClass(c),
                  color === c && "ring-4 ring-gold-deep ring-offset-2 ring-offset-cream",
                )}
              />
            ))}
          </div>
        </div>
        <GameButton tone="play" size="md" className="mt-1 w-full" onClick={save}>
          Save
        </GameButton>
      </div>
    </GameModal>
  );
}
