import { memo, type ReactNode } from "react";

import { lighten, shade, type BaseItem, type BaseTexture } from "@/game/catalog";
import { mulberry32 } from "@/game/engine";
import { ISO, pts } from "./hexgeo";

/** Pointy-top board outline, flattened for the isometric view. */
export function plateOutline(R: number): [number, number][] {
  return [-90, -30, 30, 90, 150, 210].map((a) => {
    const r = (a * Math.PI) / 180;
    return [R * Math.cos(r), R * Math.sin(r) * ISO] as [number, number];
  });
}

const U = plateOutline(100);

function scatter(seed: number, n: number) {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => ({ x: (rng() - 0.5) * 170, y: (rng() - 0.5) * 110, r: rng(), a: rng() * 360 }));
}

function spiral(turns: number, phase: number, step = 3.1) {
  const d: string[] = [];
  for (let t = 0; t <= turns * Math.PI * 2; t += 0.18) {
    const r = step * t;
    const x = r * Math.cos(t + phase);
    const y = r * Math.sin(t + phase) * ISO;
    d.push(`${d.length ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return d.join(" ");
}

// Swirly Lolly: candy spiral bands (pink, cream, mint, cream, lavender, cream) swept from the centre.
const LOLLY_COLORS = ["#FF6FA8", "#FFF4E6", "#6FD9B0", "#FFF4E6", "#AE8CF5", "#FFF4E6"];
const LOLLY_BANDS: string[] = (() => {
  const n = 12;
  const twist = 0.028; // radians of turn per unit of radius
  const R = 135;
  const arm = (a0: number) => {
    const out: [number, number][] = [];
    for (let r = 0; r <= R; r += 4) {
      const a = a0 + r * twist;
      out.push([r * Math.cos(a), r * Math.sin(a) * ISO]);
    }
    return out;
  };
  return Array.from({ length: n }, (_, i) => {
    const a = arm((i / n) * Math.PI * 2);
    const b = arm(((i + 1) / n) * Math.PI * 2).reverse();
    return "M" + [...a, ...b].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + " Z";
  });
})();

// Galaxy: a few hand-placed constellations and bright sparkle stars (plate units).
const CONSTELLATIONS: [number, number][][] = [
  [[-72, -22], [-58, -34], [-42, -28], [-36, -40], [-20, -44]],
  [[30, -40], [46, -30], [62, -36], [70, -20]],
  [[-60, 24], [-44, 36], [-26, 30]],
  [[24, 30], [40, 40], [58, 28], [66, 40]],
];
const SPARKLES: [number, number, number][] = [
  [-50, -8, 1.3], [54, -14, 1.1], [14, 40, 1.2], [-18, -50, 0.9], [76, 6, 0.8], [-80, 6, 0.9], [-6, 18, 0.8],
];

/** Board slot see-through amount: showcase patterns let the surface art read through the slots. */
export function slotOpacity(texture: BaseTexture): number {
  if (texture === "plain") return 1;
  if (texture === "lolly") return 0.18;
  if (texture === "galaxy") return 0.25;
  return 0.82;
}

/** Surface artwork for a board texture, drawn in a 100-radius plate and clipped to it. */
function textureArt(texture: BaseTexture, b: Pick<BaseItem, "top" | "rim">, p: string): ReactNode {
  const rim = b.rim;
  switch (texture) {
    case "sand":
      return (
        <g>
          {[-40, -24, -8, 8, 24, 40].map((y) => (
            <path key={y} d={`M-95 ${y} Q-48 ${y - 7} 0 ${y} T95 ${y}`} stroke={shade(b.top, 0.8)} strokeOpacity={0.45} strokeWidth={1.4} fill="none" />
          ))}
          {scatter(11, 90).map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={0.5 + s.r * 0.7} fill={i % 3 ? shade(b.top, 0.7) : "#fff"} opacity={0.45} />
          ))}
        </g>
      );
    case "clouds":
      return (
        <g fill="#fff">
          {[
            [-52, -22, 1],
            [40, 18, 1.15],
            [8, -42, 0.8],
            [-34, 34, 0.9],
            [62, -24, 0.7],
          ].map(([x, y, k], i) => (
            <g key={i} opacity={0.6} transform={`translate(${x} ${y}) scale(${k} ${k! * ISO})`}>
              <circle cx={-10} cy={2} r={10} />
              <circle cx={4} cy={-4} r={13} />
              <circle cx={17} cy={3} r={9} />
            </g>
          ))}
        </g>
      );
    case "stump":
      return (
        <g fill="none" stroke={shade(rim, 0.85)} strokeOpacity={0.4}>
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse key={i} cx={i * 0.6} cy={0} rx={10 + i * 10} ry={(10 + i * 10) * ISO} strokeWidth={i % 3 ? 1 : 2} />
          ))}
          <path d="M4 -2 L28 -14 L40 -12 L66 -30" strokeWidth={1.6} />
        </g>
      );
    case "lolly":
      return (
        <g>
          {LOLLY_BANDS.map((d, i) => (
            <path key={i} d={d} fill={LOLLY_COLORS[i % LOLLY_COLORS.length]} />
          ))}
          <g fill="none" stroke="#fff" strokeLinecap="round">
            <path d={spiral(4, 0.4, 4.2)} strokeOpacity={0.55} strokeWidth={1.4} />
          </g>
          <ellipse cx={0} cy={0} rx={9} ry={9 * ISO} fill="#FFF6EC" />
          <ellipse cx={-2} cy={-1.5} rx={4} ry={4 * ISO} fill="#fff" opacity={0.9} />
        </g>
      );
    case "ocean":
      return (
        <g fill="none" stroke="#fff" strokeLinecap="round">
          {[-48, -36, -24, -12, 0, 12, 24, 36, 48].map((y, i) => (
            <path
              key={y}
              d={`M${-100 + (i % 2) * 8} ${y} q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0`}
              strokeOpacity={0.22 + (i % 3) * 0.06}
              strokeWidth={1.4}
            />
          ))}
        </g>
      );
    case "neon":
      return (
        <g fill="none" filter={`url(#${p}-pneon)`} strokeLinejoin="round">
          {[0.82, 0.6, 0.38].map((k, i) => (
            <polygon key={k} points={pts(U.map(([x, y]) => [x * k, y * k]))} stroke={i === 1 ? "#00E0FF" : rim} strokeWidth={1.3} strokeOpacity={0.85} />
          ))}
        </g>
      );
    case "marble":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M-92 -18 C-50 6 -24 -36 12 -12 S 64 18 92 -6" stroke={rim} strokeOpacity={0.4} strokeWidth={1.6} />
          <path d="M-80 22 C-40 10 0 42 36 18 S 72 30 88 18" stroke={rim} strokeOpacity={0.3} strokeWidth={1} />
          <path d="M-30 -50 C-20 -30 -40 -10 -18 10" stroke={shade(b.top, 0.75)} strokeOpacity={0.35} strokeWidth={0.8} />
          <path d="M-70 -4 C-30 -20 10 10 60 -30" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.4} />
        </g>
      );
    case "cyber":
      return (
        <g stroke={rim} strokeOpacity={0.35} strokeWidth={0.7}>
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`v${i}`} x1={-90 + i * 15} y1={-60} x2={-90 + i * 15} y2={60} />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <line key={`h${i}`} x1={-90} y1={-60 + i * 9} x2={90} y2={-60 + i * 9} />
          ))}
          {scatter(7, 10).map((s, i) => (
            <circle key={i} cx={Math.round(s.x / 15) * 15} cy={Math.round(s.y / 9) * 9} r={1.6} fill={rim} fillOpacity={0.9} stroke="none" />
          ))}
        </g>
      );
    case "galaxy":
      return (
        <g>
          {/* Deep navy-to-purple space */}
          <rect x={-110} y={-70} width={220} height={140} fill={`url(#${p}-space)`} />
          {/* Nebula clouds */}
          <ellipse cx={-34} cy={-12} rx={70} ry={34} fill={`url(#${p}-neb1)`} />
          <ellipse cx={42} cy={16} rx={64} ry={30} fill={`url(#${p}-neb2)`} />
          <ellipse cx={8} cy={-30} rx={58} ry={22} fill={`url(#${p}-neb3)`} />
          <ellipse cx={-50} cy={30} rx={44} ry={18} fill={`url(#${p}-neb3)`} />
          <ellipse cx={-40} cy={-16} rx={34} ry={15} fill={`url(#${p}-neb1)`} />
          <ellipse cx={48} cy={20} rx={30} ry={13} fill={`url(#${p}-neb2)`} />
          {/* Cosmic dust swirls */}
          <g fill="none" strokeLinecap="round">
            <path d={spiral(2.2, 0, 7)} stroke="#FFB8F0" strokeOpacity={0.35} strokeWidth={7} />
            <path d={spiral(2.2, Math.PI, 7)} stroke="#8FD8FF" strokeOpacity={0.3} strokeWidth={6} />
            <path d={spiral(2.2, 0.15, 7)} stroke="#fff" strokeOpacity={0.55} strokeWidth={1.2} />
            <path d={spiral(2.2, Math.PI + 0.15, 7)} stroke="#fff" strokeOpacity={0.45} strokeWidth={1} />
          </g>
          {/* Galactic core */}
          <ellipse cx={0} cy={0} rx={22} ry={22 * ISO} fill={`url(#${p}-core)`} />
          {/* Dust and distant stars */}
          {scatter(23, 120).map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={0.35 + s.r * 0.9} fill={i % 5 ? "#fff" : "#FFD9F7"} opacity={0.55 + s.r * 0.45} />
          ))}
          {/* Constellations */}
          <g stroke="#E6DBFF" strokeOpacity={0.7} strokeWidth={0.6} fill="none">
            {CONSTELLATIONS.map((c, i) => (
              <polyline key={i} points={pts(c)} />
            ))}
          </g>
          {CONSTELLATIONS.flat().map(([x, y], i) => (
            <circle key={`c${i}`} cx={x} cy={y} r={1.5} fill="#fff" />
          ))}
          {/* Glowing sparkle stars */}
          {SPARKLES.map(([x, y, k], i) => (
            <g key={`s${i}`} transform={`translate(${x} ${y}) scale(${k})`}>
              <circle r={4} fill={`url(#${p}-glow)`} />
              <path d="M0 -5 L1 -1 L5 0 L1 1 L0 5 L-1 1 L-5 0 L-1 -1 Z" fill="#fff" />
            </g>
          ))}
        </g>
      );
    case "petals":
      return (
        <g>
          {scatter(5, 26).map((s, i) => (
            <ellipse key={i} cx={s.x} cy={s.y} rx={4 + s.r * 2} ry={2.2} transform={`rotate(${s.a} ${s.x} ${s.y})`} fill={i % 2 ? "#F7B8CC" : "#FFFFFF"} opacity={0.75} />
          ))}
        </g>
      );
    case "aurora":
      return (
        <g fill="none" strokeLinecap="round" opacity={0.55}>
          <path d="M-100 -20 C-50 -50 -10 10 40 -24 S 90 -20 100 -40" stroke="#3FE0B5" strokeWidth={14} />
          <path d="M-100 8 C-60 -16 -20 30 30 4 S 80 10 100 -6" stroke="#7B6CFF" strokeWidth={10} />
          <path d="M-100 34 C-50 20 0 48 50 26 S 90 40 100 30" stroke="#5FC8FF" strokeWidth={7} />
        </g>
      );
    case "prism":
      return (
        <g>
          {scatter(3, 18).map((s, i) => (
            <polygon
              key={i}
              points={`${s.x},${s.y - 12 * ISO} ${s.x + 11},${s.y + 6 * ISO} ${s.x - 11},${s.y + 6 * ISO}`}
              fill={["#9FE8FF", "#FFB3E6", "#FFF2A6", "#B3FFD9", "#D1B8FF"][i % 5]}
              opacity={0.45}
            />
          ))}
        </g>
      );
    case "leaves":
      return (
        <g>
          {scatter(9, 22).map((s, i) => (
            <path
              key={i}
              d="M0 0 C 4 -6, 12 -6, 16 0 C 12 6, 4 6, 0 0 Z"
              transform={`translate(${s.x} ${s.y}) rotate(${s.a}) scale(${0.7 + s.r * 0.6} ${(0.7 + s.r * 0.6) * ISO})`}
              fill={["#D9822B", "#B5442E", "#E8B33E", "#C9643B"][i % 4]}
              opacity={0.7}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** The board itself: thick side with soft shadow, bevelled rim and a textured surface. */
export const BoardPlate = memo(function BoardPlate({
  R,
  depth,
  plate,
  p,
  rimWidth = 6,
}: {
  R: number;
  depth: number;
  plate: BaseItem;
  p: string;
  rimWidth?: number;
}) {
  const top = plateOutline(R);
  const side = top.slice(1);
  const sidePoly = [...side, ...side.slice().reverse().map(([x, y]) => [x, y + depth] as [number, number])];
  const k = R / 100;
  const art = textureArt(plate.texture, plate, p);
  return (
    <g>
      <defs>
        <clipPath id={`${p}-clip`}>
          <polygon points={pts(U)} />
        </clipPath>
        <linearGradient id={`${p}-pside`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <stop offset="0.3" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </linearGradient>
        <linearGradient id={`${p}-psidex`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.2} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
        <radialGradient id={`${p}-pshine`} cx="45%" cy="30%" r="70%">
          <stop offset="0" stopColor={lighten(plate.top, 0.6)} stopOpacity={0.75} />
          <stop offset="0.6" stopColor={plate.top} stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.12} />
        </radialGradient>
        <filter id={`${p}-pneon`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${p}-neb1`}>
          <stop offset="0" stopColor="#FF7FD1" stopOpacity={0.8} />
          <stop offset="0.5" stopColor="#C04BD8" stopOpacity={0.4} />
          <stop offset="1" stopColor="#FF7FD1" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${p}-neb2`}>
          <stop offset="0" stopColor="#5FC8FF" stopOpacity={0.75} />
          <stop offset="0.5" stopColor="#4B6BFF" stopOpacity={0.35} />
          <stop offset="1" stopColor="#5FC8FF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${p}-neb3`}>
          <stop offset="0" stopColor="#9B6BFF" stopOpacity={0.7} />
          <stop offset="1" stopColor="#9B6BFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${p}-space`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0E1240" />
          <stop offset="0.5" stopColor="#2A1660" />
          <stop offset="1" stopColor="#120C3A" />
        </linearGradient>
        <radialGradient id={`${p}-core`}>
          <stop offset="0" stopColor="#FFF4FF" stopOpacity={0.95} />
          <stop offset="0.35" stopColor="#FFB8F0" stopOpacity={0.55} />
          <stop offset="1" stopColor="#9B6BFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${p}-glow`}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="1" stopColor="#B8A8FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Soft contact shadow */}
      <ellipse cx={0} cy={depth + R * 0.08} rx={R * 0.98} ry={R * ISO * 0.82} fill="#000" opacity={0.1} />
      <ellipse cx={0} cy={depth + R * 0.04} rx={R * 0.9} ry={R * ISO * 0.7} fill="#000" opacity={0.1} />
      {/* Side wall */}
      <polygon points={pts(sidePoly)} fill={plate.side} stroke={plate.side} strokeWidth={rimWidth * 0.7} strokeLinejoin="round" />
      <polygon points={pts(sidePoly)} fill={`url(#${p}-psidex)`} />
      <polygon points={pts(sidePoly)} fill={`url(#${p}-pside)`} />
      <polyline points={pts(side.map(([x, y]) => [x, y + depth - 1]))} fill="none" stroke={shade(plate.side, 0.7)} strokeWidth={1.2} strokeLinejoin="round" />
      {/* Top surface */}
      <polygon points={pts(top)} fill={plate.top} stroke={plate.rim} strokeWidth={rimWidth} strokeLinejoin="round" />
      {art && (
        <g transform={`scale(${k})`} clipPath={`url(#${p}-clip)`}>
          {art}
        </g>
      )}
      <polygon points={pts(top)} fill={`url(#${p}-pshine)`} />
      {/* Bevel */}
      <polygon
        points={pts(plateOutline(R - rimWidth * 0.5))}
        fill="none"
        stroke={lighten(plate.rim, 0.55)}
        strokeOpacity={0.9}
        strokeWidth={Math.max(1, rimWidth * 0.25)}
        strokeLinejoin="round"
      />
      <polygon
        points={pts(plateOutline(R + rimWidth * 0.5))}
        fill="none"
        stroke={shade(plate.rim, 0.72)}
        strokeOpacity={0.7}
        strokeWidth={Math.max(0.6, rimWidth * 0.16)}
        strokeLinejoin="round"
      />
    </g>
  );
});
