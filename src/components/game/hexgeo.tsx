import { createContext, memo, useContext, useId, type ReactNode } from "react";

import { lighten, shade, type Finish } from "@/game/catalog";

export const ISO = 0.6;
export const TILE_H = 5.2;

export function flatHex(cx: number, cy: number, size: number, iso = ISO): [number, number][] {
  return [0, 60, 120, 180, 240, 300].map((a) => {
    const r = (a * Math.PI) / 180;
    return [cx + size * Math.cos(r), cy + size * Math.sin(r) * iso];
  });
}

export function pts(p: [number, number][]) {
  return p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

// ---------- Shared SVG paint (gradients + surface textures), unique per <svg> ----------
const PrefixCtx = createContext("hx");
const usePrefix = () => useContext(PrefixCtx);

const TEXTURED: Partial<Record<Finish, true>> = {
  matte: true,
  dots: true,
  stripes: true,
  sand: true,
  wood: true,
  marshmallow: true,
  yarn: true,
  sparkles: true,
  stars: true,
  cyber: true,
};

function finishPattern(id: string, finish: Finish, flat: boolean): ReactNode {
  const t = flat ? `scale(1 ${ISO})` : undefined;
  const P = ({ w, h, rot, children }: { w: number; h: number; rot?: number; children: ReactNode }) => (
    <pattern
      id={id}
      width={w}
      height={h}
      patternUnits="userSpaceOnUse"
      patternTransform={[t, rot ? `rotate(${rot})` : ""].filter(Boolean).join(" ") || undefined}
    >
      {children}
    </pattern>
  );
  switch (finish) {
    case "matte":
      return (
        <P w={5} h={5}>
          <circle cx={1} cy={1} r={0.35} fill="#000" opacity={0.06} />
          <circle cx={3.5} cy={3} r={0.4} fill="#fff" opacity={0.12} />
        </P>
      );
    case "dots":
      return (
        <P w={6} h={6}>
          <circle cx={3} cy={3} r={1.25} fill="#fff" opacity={0.55} />
          <circle cx={3} cy={3.5} r={1.25} fill="#000" opacity={0.08} />
        </P>
      );
    case "stripes":
      return (
        <P w={5} h={5} rot={45}>
          <rect width={2} height={5} fill="#fff" opacity={0.4} />
        </P>
      );
    case "sand":
      return (
        <P w={7} h={7}>
          <circle cx={1} cy={2} r={0.45} fill="#000" opacity={0.18} />
          <circle cx={4.5} cy={1} r={0.35} fill="#fff" opacity={0.4} />
          <circle cx={3} cy={5} r={0.5} fill="#000" opacity={0.12} />
          <circle cx={6} cy={4} r={0.3} fill="#fff" opacity={0.35} />
          <circle cx={5.5} cy={6.4} r={0.35} fill="#000" opacity={0.15} />
        </P>
      );
    case "wood":
      return (
        <P w={24} h={3.2}>
          <path d="M0 1 Q6 0.2 12 1.1 T24 1" stroke="#000" strokeOpacity={0.16} strokeWidth={0.5} fill="none" />
          <path d="M0 2.6 Q8 3.2 14 2.4 T24 2.7" stroke="#fff" strokeOpacity={0.14} strokeWidth={0.4} fill="none" />
        </P>
      );
    case "marshmallow":
      return (
        <P w={4} h={4}>
          <circle cx={1} cy={1} r={0.5} fill="#fff" opacity={0.35} />
          <circle cx={3} cy={2.8} r={0.4} fill="#fff" opacity={0.25} />
        </P>
      );
    case "yarn":
      return (
        <P w={4} h={4}>
          <path d="M0 1 H2 M2 3 H4" stroke="#fff" strokeOpacity={0.4} strokeWidth={0.9} />
          <path d="M3 0 V2 M1 2 V4" stroke="#000" strokeOpacity={0.18} strokeWidth={0.9} />
        </P>
      );
    case "sparkles":
      return (
        <P w={11} h={11}>
          <path d="M3 1 L3.5 2.5 L5 3 L3.5 3.5 L3 5 L2.5 3.5 L1 3 L2.5 2.5 Z" fill="#fff" opacity={0.9} />
          <circle cx={8} cy={8} r={0.6} fill="#fff" opacity={0.8} />
          <circle cx={9} cy={2.5} r={0.35} fill="#fff" opacity={0.7} />
        </P>
      );
    case "stars":
      return (
        <P w={12} h={12}>
          <path
            d="M6 2.2 L6.9 4.4 L9.2 4.5 L7.4 6 L8 8.3 L6 7 L4 8.3 L4.6 6 L2.8 4.5 L5.1 4.4 Z"
            fill="#fff"
            opacity={0.6}
          />
          <circle cx={11} cy={10.5} r={0.5} fill="#fff" opacity={0.7} />
        </P>
      );
    case "cyber":
      return (
        <P w={9} h={9}>
          <path d="M0 4.5 H3 V1 H9 M4.5 9 V6.5 H9" stroke="#fff" strokeOpacity={0.45} strokeWidth={0.5} fill="none" />
          <circle cx={3} cy={1} r={0.7} fill="#fff" opacity={0.6} />
          <circle cx={4.5} cy={6.5} r={0.7} fill="#fff" opacity={0.6} />
        </P>
      );
    default:
      return null;
  }
}

/** Gradients and textures for every finish. Wrap tiles in this once per <svg>. */
export function TileDefs({ finishes, children, prefix }: { finishes: Finish[]; children: ReactNode; prefix?: string }) {
  const own = useSvgPrefix();
  const p = prefix ?? own;
  const uniq = Array.from(new Set(finishes)).filter((f) => TEXTURED[f]);
  return (
    <PrefixCtx.Provider value={p}>
      <defs>
        <linearGradient id={`${p}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.42} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.14} />
        </linearGradient>
        <linearGradient id={`${p}-sidex`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.22} />
          <stop offset="0.42" stopColor="#fff" stopOpacity={0.12} />
          <stop offset="0.6" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={`${p}-ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
          <stop offset="0.35" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.34} />
        </linearGradient>
        <radialGradient id={`${p}-puff`} cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.65} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <filter id={`${p}-neon`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {uniq.map((f) => (
          <g key={f}>
            {finishPattern(`${p}-tx-${f}-t`, f, true)}
            {finishPattern(`${p}-tx-${f}-s`, f, false)}
          </g>
        ))}
      </defs>
      {children}
    </PrefixCtx.Provider>
  );
}

/** A unique id prefix for one <svg>'s gradients and textures. */
export function useSvgPrefix() {
  return "hx" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

export const neonUrl = (prefix: string) => `url(#${prefix}-neon)`;

/** One hexagon tile as an extruded, bevelled prism. `cy` is the ground centre; `idx` the height level. */
export const TilePrism = memo(function TilePrism({
  cx,
  cy,
  idx,
  size,
  color,
  finish,
  detail = false,
  lift = 0,
}: {
  cx: number;
  cy: number;
  idx: number;
  size: number;
  color: string;
  finish: Finish;
  detail?: boolean;
  lift?: number;
}) {
  const p = usePrefix();
  const y = cy - (idx + 1) * TILE_H - lift;
  const top = flatHex(cx, y, size);
  const lower = top.slice(0, 4);
  const sidePts = pts([...lower, ...lower.slice().reverse().map(([x, yy]) => [x, yy + TILE_H] as [number, number])]);
  const groove = pts(lower.map(([x, yy]) => [x, yy + TILE_H - 0.4] as [number, number]));
  const glass = finish === "glass";
  const neon = finish === "neon";
  const tex = TEXTURED[finish];
  return (
    <g>
      {/* Side wall: colour, roundness, texture, ambient occlusion, groove */}
      <polygon
        points={sidePts}
        fill={shade(color, glass ? 0.86 : neon ? 0.55 : 0.8)}
        opacity={glass ? 0.88 : 1}
      />
      <polygon points={sidePts} fill={`url(#${p}-sidex)`} />
      {tex && <polygon points={sidePts} fill={`url(#${p}-tx-${finish}-s)`} />}
      <polygon points={sidePts} fill={`url(#${p}-ao)`} />
      <polyline points={groove} fill="none" stroke={shade(color, 0.45)} strokeOpacity={0.55} strokeWidth={0.7} />
      {neon && <polyline points={pts(lower)} fill="none" stroke={lighten(color, 0.5)} strokeWidth={0.8} />}
      {detail && (
        <TopFace cx={cx} y={y} size={size} color={color} finish={finish} p={p} top={top} tex={!!tex} />
      )}
    </g>
  );
});

function TopFace({
  cx,
  y,
  size,
  color,
  finish,
  p,
  top,
  tex,
}: {
  cx: number;
  y: number;
  size: number;
  color: string;
  finish: Finish;
  p: string;
  top: [number, number][];
  tex: boolean;
}) {
  const glass = finish === "glass";
  const neon = finish === "neon";
  const topPts = pts(top);
  return (
    <g>
      <polygon
        points={topPts}
        fill={neon ? shade(color, 0.8) : color}
        stroke={neon ? lighten(color, 0.6) : shade(color, 0.82)}
        strokeWidth={neon ? 1.3 : 0.8}
        strokeLinejoin="round"
        opacity={glass ? 0.9 : 1}
      />
      {tex && <polygon points={topPts} fill={`url(#${p}-tx-${finish}-t)`} />}
      <polygon points={topPts} fill={`url(#${p}-top)`} />
      {/* Bevel: lit inner rim and a soft dark lip */}
      <polygon
        points={pts(flatHex(cx, y + 0.3, size * 0.86))}
        fill="none"
        stroke={lighten(color, 0.6)}
        strokeOpacity={neon ? 0.9 : 0.55}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <TopDetail cx={cx} cy={y} size={size} color={color} finish={finish} p={p} />
    </g>
  );
}

function TopDetail({ cx, cy, size, color, finish, p }: { cx: number; cy: number; size: number; color: string; finish: Finish; p: string }) {
  if (finish === "wood") {
    return (
      <g fill="none" stroke={shade(color, 0.68)} strokeOpacity={0.5} strokeWidth={0.6}>
        <ellipse cx={cx + size * 0.12} cy={cy} rx={size * 0.18} ry={size * 0.18 * ISO} />
        <ellipse cx={cx + size * 0.08} cy={cy} rx={size * 0.38} ry={size * 0.36 * ISO} />
        <ellipse cx={cx + size * 0.04} cy={cy} rx={size * 0.58} ry={size * 0.56 * ISO} />
      </g>
    );
  }
  if (finish === "glass") {
    return (
      <g>
        <polygon points={pts(flatHex(cx, cy, size * 0.6))} fill={lighten(color, 0.45)} opacity={0.35} />
        <path
          d={`M ${cx - size * 0.58} ${cy - size * 0.08} L ${cx - size * 0.22} ${cy - size * 0.44} L ${cx + size * 0.04} ${cy - size * 0.44} L ${cx - size * 0.36} ${cy - size * 0.03} Z`}
          fill="#fff"
          opacity={0.75}
        />
        <circle cx={cx + size * 0.42} cy={cy + size * 0.14} r={size * 0.06} fill="#fff" opacity={0.7} />
      </g>
    );
  }
  if (finish === "neon") {
    return <polygon points={pts(flatHex(cx, cy, size * 0.55))} fill="none" stroke={lighten(color, 0.75)} strokeWidth={0.9} />;
  }
  if (finish === "marshmallow") {
    return <ellipse cx={cx - size * 0.1} cy={cy - size * 0.06} rx={size * 0.62} ry={size * 0.44 * ISO} fill={`url(#${p}-puff)`} />;
  }
  if (finish === "sparkles" || finish === "stars") {
    return (
      <path
        d={`M ${cx + size * 0.3} ${cy - 3.2} l 0.9 2 l 2 0.9 l -2 0.9 l -0.9 2 l -0.9 -2 l -2 -0.9 l 2 -0.9 Z`}
        fill="#fff"
        opacity={0.95}
      />
    );
  }
  if (finish === "cyber") {
    return <polygon points={pts(flatHex(cx, cy, size * 0.5))} fill="none" stroke={lighten(color, 0.7)} strokeOpacity={0.7} strokeWidth={0.6} strokeDasharray="2 1.4" />;
  }
  return (
    <ellipse cx={cx - size * 0.18} cy={cy - size * 0.1} rx={size * 0.34} ry={size * 0.18 * ISO} fill="#fff" opacity={0.22} />
  );
}
