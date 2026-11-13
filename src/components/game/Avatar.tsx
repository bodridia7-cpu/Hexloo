import type { ReactNode } from "react";

import { useImage } from "@/game/images";
import { cn } from "@/lib/utils";

const COLOR_CLASS: Record<string, string> = {
  "1": "bg-avatar-1",
  "2": "bg-avatar-2",
  "3": "bg-avatar-3",
  "4": "bg-avatar-4",
  "5": "bg-avatar-5",
  "6": "bg-avatar-6",
};

export function avatarColorClass(color: string) {
  return COLOR_CLASS[color] ?? COLOR_CLASS["1"];
}

// Illustration colours (part of the artwork, like the tile palettes).
const INK = "#5A3B22";
const BLUSH = "#F59BB0";

function Face({ y = 36, gap = 9, smile = true, x = 32 }: { y?: number; gap?: number; smile?: boolean; x?: number }) {
  return (
    <g>
      <ellipse cx={x - gap} cy={y} rx={2.6} ry={3.2} fill={INK} />
      <ellipse cx={x + gap} cy={y} rx={2.6} ry={3.2} fill={INK} />
      <circle cx={x - gap + 1} cy={y - 1.2} r={0.9} fill="#fff" />
      <circle cx={x + gap + 1} cy={y - 1.2} r={0.9} fill="#fff" />
      <ellipse cx={x - gap - 4} cy={y + 5} rx={3.6} ry={2.2} fill={BLUSH} opacity={0.7} />
      <ellipse cx={x + gap + 4} cy={y + 5} rx={3.6} ry={2.2} fill={BLUSH} opacity={0.7} />
      {smile && (
        <path
          d={`M ${x - 3.2} ${y + 4.5} Q ${x} ${y + 7.5} ${x + 3.2} ${y + 4.5}`}
          stroke={INK}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}

const ART: Record<string, ReactNode> = {
  bunny: (
    <g>
      <ellipse cx={22} cy={16} rx={6.5} ry={15} fill="#FFF7F0" stroke="#E9D6C6" strokeWidth={1.2} />
      <ellipse cx={42} cy={16} rx={6.5} ry={15} fill="#FFF7F0" stroke="#E9D6C6" strokeWidth={1.2} />
      <ellipse cx={22} cy={17} rx={3} ry={10} fill="#F8BFCD" />
      <ellipse cx={42} cy={17} rx={3} ry={10} fill="#F8BFCD" />
      <circle cx={32} cy={40} r={18} fill="#FFF7F0" stroke="#E9D6C6" strokeWidth={1.2} />
      <Face y={38} gap={8} smile={false} />
      <path d="M30 43.5 L34 43.5 L32 45.6 Z" fill="#EF8FA6" />
      <path d="M32 45.6 Q30 48 28 47 M32 45.6 Q34 48 36 47" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </g>
  ),
  bear: (
    <g>
      <circle cx={16} cy={20} r={8} fill="#C9935E" />
      <circle cx={48} cy={20} r={8} fill="#C9935E" />
      <circle cx={16} cy={20} r={4.2} fill="#EBC79E" />
      <circle cx={48} cy={20} r={4.2} fill="#EBC79E" />
      <circle cx={32} cy={36} r={20} fill="#D4A06A" />
      <ellipse cx={32} cy={43} rx={9} ry={7} fill="#F0D5B4" />
      <Face y={34} gap={9} smile={false} />
      <ellipse cx={32} cy={40.5} rx={3.2} ry={2.3} fill={INK} />
      <path d="M32 42.5 V45 M32 45 Q29.5 47.5 27.5 46 M32 45 Q34.5 47.5 36.5 46" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </g>
  ),
  cat: (
    <g>
      <path d="M12 30 L15 9 L28 20 Z" fill="#F2B67E" />
      <path d="M52 30 L49 9 L36 20 Z" fill="#F2B67E" />
      <path d="M16 23 L17 14 L23 19 Z" fill="#F8C9D2" />
      <path d="M48 23 L47 14 L41 19 Z" fill="#F8C9D2" />
      <ellipse cx={32} cy={38} rx={21} ry={18} fill="#F5C08C" />
      <path d="M26 22 Q32 26 38 22" stroke="#E39A5B" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Face y={37} gap={9} smile={false} />
      <path d="M30.4 42 L33.6 42 L32 43.8 Z" fill="#EF8FA6" />
      <path d="M32 43.8 Q30 46.4 28 45 M32 43.8 Q34 46.4 36 45" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <path d="M8 40 L19 41 M8 45 L19 43.5 M56 40 L45 41 M56 45 L45 43.5" stroke={INK} strokeWidth={1} strokeLinecap="round" opacity={0.6} />
    </g>
  ),
  frog: (
    <g>
      <circle cx={20} cy={22} r={9} fill="#97CF8C" />
      <circle cx={44} cy={22} r={9} fill="#97CF8C" />
      <ellipse cx={32} cy={40} rx={22} ry={17} fill="#A6D99A" />
      <circle cx={20} cy={22} r={5.6} fill="#fff" />
      <circle cx={44} cy={22} r={5.6} fill="#fff" />
      <circle cx={20.6} cy={22.6} r={3.2} fill={INK} />
      <circle cx={44.6} cy={22.6} r={3.2} fill={INK} />
      <circle cx={21.6} cy={21.4} r={1} fill="#fff" />
      <circle cx={45.6} cy={21.4} r={1} fill="#fff" />
      <ellipse cx={17} cy={42} rx={4} ry={2.4} fill={BLUSH} opacity={0.7} />
      <ellipse cx={47} cy={42} rx={4} ry={2.4} fill={BLUSH} opacity={0.7} />
      <path d="M22 40 Q32 50 42 40" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  ),
  chick: (
    <g>
      <path d="M30 12 Q32 4 35 11 Q38 6 37 14" stroke="#F2B53A" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={32} cy={36} rx={21} ry={20} fill="#FFD966" />
      <ellipse cx={14} cy={40} rx={5} ry={8} fill="#FBC94A" transform="rotate(20 14 40)" />
      <ellipse cx={50} cy={40} rx={5} ry={8} fill="#FBC94A" transform="rotate(-20 50 40)" />
      <Face y={33} gap={8} smile={false} />
      <path d="M28 39 L36 39 L32 44 Z" fill="#F59A3C" stroke="#E07F22" strokeWidth={0.8} strokeLinejoin="round" />
    </g>
  ),
  cloud: (
    <g>
      <path
        d="M14 46 Q5 46 6 37 Q7 29 16 30 Q17 18 30 18 Q41 17 44 27 Q55 25 57 35 Q59 46 49 46 Z"
        fill="#FFFFFF"
        stroke="#CFE2F3"
        strokeWidth={1.6}
      />
      <path d="M14 46 Q30 50 49 46" stroke="#CFE2F3" strokeWidth={1.6} fill="none" />
      <Face y={35} gap={8} />
    </g>
  ),
  star: (
    <g>
      <path
        d="M32 6 L39.6 22.4 L57.4 24.4 L44.2 36.6 L47.8 54.2 L32 45.4 L16.2 54.2 L19.8 36.6 L6.6 24.4 L24.4 22.4 Z"
        fill="#FFD45E"
        stroke="#F0B53A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M22 26 L26 24" stroke="#FFF2C2" strokeWidth={2.4} strokeLinecap="round" />
      <Face y={33} gap={6.5} />
    </g>
  ),
  sprout: (
    <g>
      <path d="M32 26 V16" stroke="#6FAE5E" strokeWidth={3} strokeLinecap="round" />
      <path d="M32 18 Q20 18 18 8 Q30 6 32 18 Z" fill="#8CCB7A" />
      <path d="M32 16 Q42 16 46 6 Q34 4 32 16 Z" fill="#9FD88B" />
      <path d="M14 30 H50 L46 54 Q32 58 18 54 Z" fill="#E7B98A" />
      <rect x={11} y={26} width={42} height={8} rx={4} fill="#D9A06A" />
      <Face y={42} gap={8} />
    </g>
  ),
};

export function AvatarArt({ avatar }: { avatar: string }) {
  return (
    <svg viewBox="0 0 64 64" className="size-[86%]" aria-hidden>
      {ART[avatar] ?? ART["bunny"]}
    </svg>
  );
}

export function Avatar({ avatar, color, className }: { avatar: string; color: string; className?: string }) {
  const photo = useImage("avatar");
  const showPhoto = avatar === "photo" && photo;
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-gold shadow-[inset_0_-3px_0_color-mix(in_oklab,var(--foreground)_12%,transparent)]",
        avatarColorClass(color),
        className,
      )}
    >
      {showPhoto ? (
        <img src={photo} alt="" className="size-full object-cover" />
      ) : (
        <AvatarArt avatar={avatar === "photo" ? "bunny" : avatar} />
      )}
    </span>
  );
}
