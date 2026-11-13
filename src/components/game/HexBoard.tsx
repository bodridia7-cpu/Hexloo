import { memo, useMemo, useRef, useState } from "react";

import { canDrop, CELLS, stackAt, topGroup, type Board } from "@/game/engine";
import { lighten, shade, type BaseItem, type HexaItem } from "@/game/catalog";
import { sfx } from "@/game/audio";
import { haptic } from "@/game/haptics";
import { flatHex, ISO, neonUrl, pts, TILE_H, TileDefs, TilePrism, useSvgPrefix } from "./hexgeo";
import { BoardPlate, slotOpacity } from "./plate";
import { cn } from "@/lib/utils";

const S = 26; // cell radius
const TS = S * 0.8; // tile radius
const SQ3 = Math.sqrt(3);
const RB = 3 * S * SQ3 + S * 1.3; // board plate radius
const PLATE_DEPTH = 16;
const LIFT = 14; // lift of a picked-up group
const FINGER = 22; // dragged group floats above the finger

const CENTER_LIST = CELLS.map((c) => ({ x: S * 1.5 * c.q, y: S * SQ3 * (c.r + c.q / 2) * ISO }));
const ctr = (i: number) => CENTER_LIST[i]!;
const ORDER = CENTER_LIST.map((_, i) => i).sort((a, b) => ctr(a).y - ctr(b).y || ctr(a).x - ctr(b).x);
const FRONT_FIRST = ORDER.slice().reverse();


const VB = { x: -170, y: -190, w: 340, h: 330 };

export type PopFx = { id: number; cell: number; base: number; color: number; amount: number };
export type DropFx = { cell: number; from: number; stamp: number };
/** Power-up effect on the board: sparkles, plus smoke for zaps and bombs. */
export type BlastFx = { id: number; cells: number[]; centre: number; kind: "zap" | "bomb" | "sparkle" };
/** Power-up aiming: tap one of `targets`; `preview` shows which slots a tap would hit. */
export type Aim = { kind: "stack" | "cell"; targets: number[]; preview?: ((cell: number) => number[]) | undefined };

type Drag = {
  from: number;
  count: number;
  color: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  moved: boolean;
  target: number | null;
};

export function HexBoard({
  board,
  hexa,
  base,
  disabled,
  pops,
  lastDrop,
  spawns,
  onMove,
  aim,
  onAim,
  blasts,
}: {
  board: Board;
  hexa: HexaItem;
  base: BaseItem;
  disabled: boolean;
  pops: PopFx[];
  lastDrop: DropFx | null;
  /** Stacks that just appeared (Hard Mode); they drop in like a move. */
  spawns?: DropFx[];
  onMove: (from: number, to: number) => void;
  aim?: Aim | null;
  onAim?: (cell: number) => void;
  blasts?: BlastFx[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [aimHover, setAimHover] = useState<number | null>(null);
  const style = hexa;
  const plate = base;
  const neon = style.finish === "neon";
  const prefix = useSvgPrefix();
  const glow = neon ? neonUrl(prefix) : undefined;

  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const hitStack = (p: { x: number; y: number }) => {
    for (const i of FRONT_FIRST) {
      const n = stackAt(board, i).length;
      if (!n) continue;
      const c = ctr(i);
      if (
        Math.abs(p.x - c.x) < TS * 0.98 &&
        p.y > c.y - n * TILE_H - TS * ISO &&
        p.y < c.y + TS * ISO * 0.95
      )
        return i;
    }
    return null;
  };

  const hitCell = (p: { x: number; y: number }) => {
    const s = hitStack(p);
    if (s !== null) return s;
    let best: number | null = null;
    let bestD = S * 1.05;
    CENTER_LIST.forEach((c, i) => {
      const d = Math.hypot(p.x - c.x, (p.y - c.y) / ISO);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const tryMove = (from: number, to: number | null) => {
    if (to !== null && canDrop(board, from, to)) {
      onMove(from, to);
      return true;
    }
    return false;
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || drag) return;
    const p = toSvg(e);
    if (aim) {
      setSelected(null);
      const t = aim.kind === "stack" ? hitStack(p) : hitCell(p);
      if (t !== null && aim.targets.includes(t)) onAim?.(t);
      else sfx.invalid();
      return;
    }
    if (selected !== null) {
      const t = hitCell(p);
      if (t === selected) {
        setSelected(null);
        sfx.tap();
        return;
      }
      if (tryMove(selected, t)) {
        setSelected(null);
        return;
      }
      setSelected(null);
    }
    const i = hitStack(p);
    if (i === null) return;
    const g = topGroup(stackAt(board, i))!;
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag({ from: i, count: g.count, color: g.color, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, target: i });
    sfx.pickup();
    haptic.pickup();
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (aim?.preview) {
      const t = hitCell(toSvg(e));
      if (t !== aimHover) setAimHover(t);
    }
    if (!drag) return;
    const p = toSvg(e);
    const moved = drag.moved || Math.hypot(p.x - drag.sx, p.y - drag.sy) > 7;
    const target = moved ? hitCell({ x: p.x, y: p.y - FINGER }) : drag.from;
    setDrag({ ...drag, x: p.x, y: p.y, moved, target });
  };

  const onPointerUp = () => {
    if (!drag) return;
    if (!drag.moved) {
      setSelected(drag.from); // tap-to-select, tap again to place
    } else if (!tryMove(drag.from, drag.target)) {
      if (drag.target !== drag.from) sfx.invalid();
    }
    setDrag(null);
  };

  const active = aim ? null : drag ?? (selected !== null ? { from: selected, moved: false, target: null } : null);
  const activeFrom = active?.from ?? null;
  const activeGroup = activeFrom !== null ? topGroup(stackAt(board, activeFrom)) : null;
  const targetValid =
    drag && drag.moved && drag.target !== null && canDrop(board, drag.from, drag.target);

  const hints = useMemo(() => {
    if (activeFrom === null || !activeGroup) return [] as number[];
    return board.stacks
      .map((s, i) => (i !== activeFrom && s.length && s[s.length - 1] === activeGroup.color ? i : -1))
      .filter((i) => i >= 0);
  }, [board, activeFrom, activeGroup]);

  const color = (c: number) => style.colors[c % style.colors.length]!;

  return (
    <svg
      ref={svgRef}
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      className={cn("h-auto w-full touch-none select-none md:h-full", aim && "cursor-crosshair")}
      role="application"
      aria-label="Hexagon puzzle board. Drag the top colour of a stack onto an empty slot or a matching stack."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      onPointerLeave={() => setAimHover(null)}
    >
      <TileDefs finishes={[style.finish]} prefix={prefix}>
      <BoardPlate R={RB} depth={PLATE_DEPTH} plate={plate} p={`${prefix}-plate`} rimWidth={7} />
      <Wells plate={plate} />

      {/* Mega Bomb aim preview */}
      {aim?.preview && aimHover !== null && aim.targets.includes(aimHover) &&
        aim.preview(aimHover).map((i) => (
          <polygon
            key={`bp${i}`}
            points={pts(flatHex(ctr(i).x, ctr(i).y, S * 0.9))}
            fill="var(--hard)"
            fillOpacity={0.28}
            stroke="var(--hard-deep)"
            strokeWidth={1.4}
            pointerEvents="none"
          />
        ))}

      {/* Empty-slot target */}
      {targetValid && stackAt(board, drag!.target!).length === 0 && (
        <polygon
          points={pts(flatHex(ctr(drag!.target!).x, ctr(drag!.target!).y, S * 0.86))}
          fill="var(--gold)"
          fillOpacity={0.45}
          stroke="var(--gold-deep)"
          strokeWidth={2}
        />
      )}

      {/* Stacks, back to front */}
      {ORDER.map((i) => {
        const stack = stackAt(board, i);
        if (!stack.length) return null;
        const c = ctr(i);
        const isActive = activeFrom === i;
        const groupStart = isActive && activeGroup ? stack.length - activeGroup.count : stack.length;
        const staying = stack.slice(0, groupStart);
        const dropAnim = (lastDrop && lastDrop.cell === i ? lastDrop : null) ?? spawns?.find((f) => f.cell === i) ?? null;
        const isTarget = targetValid && drag!.target === i;
        return (
          <g key={`s${i}`} filter={glow}>
            <ellipse cx={c.x + 1.5} cy={c.y + 2.5} rx={TS * 1.08} ry={TS * ISO * 1.02} fill="#000" opacity={0.1} />
            <ellipse cx={c.x + 0.5} cy={c.y + 1.2} rx={TS * 0.98} ry={TS * ISO * 0.92} fill="#000" opacity={0.14} />
            {staying.map((col, k) => {
              const animate = dropAnim && k >= dropAnim.from;
              const tile = (
                <TilePrism
                  key={animate ? `t${k}-${dropAnim!.stamp}` : `t${k}`}
                  cx={c.x}
                  cy={c.y}
                  idx={k}
                  size={TS}
                  color={color(col)}
                  finish={style.finish}
                  detail={k === staying.length - 1}
                />
              );
              return animate ? (
                <g key={`a${k}-${dropAnim!.stamp}`} className="tile-drop" style={{ animationDelay: `${(k - dropAnim!.from) * 18}ms` }}>
                  {tile}
                </g>
              ) : (
                tile
              );
            })}
            {isActive && activeGroup && !(drag && drag.moved) &&
              Array.from({ length: activeGroup.count }, (_, k) => (
                <TilePrism
                  key={`l${k}`}
                  cx={c.x}
                  cy={c.y}
                  idx={groupStart + k}
                  size={TS}
                  color={color(activeGroup.color)}
                  finish={style.finish}
                  detail={k === activeGroup.count - 1}
                  lift={LIFT}
                />
              ))}
            {(hints.includes(i) || isTarget) && (
              <polygon
                className={isTarget ? undefined : "stack-hint"}
                points={pts(flatHex(c.x, c.y - stack.length * TILE_H, TS * 1.08))}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={isTarget ? 3.2 : 2}
                strokeLinejoin="round"
              />
            )}
            {aim?.kind === "stack" && aim.targets.includes(i) && (
              <polygon
                className="aim-ring"
                points={pts(flatHex(c.x, c.y - stack.length * TILE_H, TS * 1.12))}
                fill="var(--gold-light)"
                fillOpacity={0.25}
                stroke="var(--gold)"
                strokeWidth={2.6}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}

      {/* Pops */}
      {pops.map((fx) => {
        const c = ctr(fx.cell);
        const topY = c.y - (fx.base + 10) * TILE_H;
        return (
          <g key={fx.id} pointerEvents="none">
            <g className="pop-burst">
              {Array.from({ length: 4 }, (_, k) => (
                <TilePrism key={k} cx={c.x} cy={c.y} idx={fx.base + k * 2} size={TS} color={color(fx.color)} finish={style.finish} detail />
              ))}
            </g>
            {Array.from({ length: 12 }, (_, k) => {
              const a = (k / 12) * Math.PI * 2;
              const r = 30 + (k % 3) * 10;
              return (
                <path
                  key={k}
                  className="sparkle"
                  style={{ "--sx": `${Math.cos(a) * r}px`, "--sy": `${Math.sin(a) * r * 0.8 - 12}px`, animationDelay: `${(k % 4) * 30}ms` } as React.CSSProperties}
                  d={`M ${c.x} ${topY - 5} l 1.6 3.4 l 3.4 1.6 l -3.4 1.6 l -1.6 3.4 l -1.6 -3.4 l -3.4 -1.6 l 3.4 -1.6 Z`}
                  fill={k % 2 ? "var(--gold)" : lighten(color(fx.color), 0.5)}
                />
              );
            })}
            <text
              className="float-up"
              x={c.x}
              y={topY - 8}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontWeight={700}
              fontSize={18}
              fill="var(--gold)"
              stroke="var(--gold-deep)"
              strokeWidth={3}
              paintOrder="stroke"
            >
              +{fx.amount}
            </text>
          </g>
        );
      })}

      {/* Power-up effects */}
      {blasts?.map((fx) => (
        <g key={`fx${fx.id}`} pointerEvents="none">
          {fx.kind === "bomb" && (
            <ellipse
              className="shockwave"
              cx={ctr(fx.centre).x}
              cy={ctr(fx.centre).y}
              rx={S * 5}
              ry={S * 5 * ISO}
              fill="none"
              stroke="var(--gold)"
              strokeWidth={5}
            />
          )}
          {fx.cells.map((cell, n) => {
            const c = ctr(cell);
            return (
              <g key={cell}>
                {fx.kind !== "sparkle" &&
                  Array.from({ length: 3 }, (_, k) => (
                    <circle
                      key={`m${k}`}
                      className="smoke-puff"
                      cx={c.x + (k - 1) * 7}
                      cy={c.y - 8 - (k % 2) * 6}
                      r={9 + (k % 2) * 3}
                      fill="var(--smoke)"
                      style={{ animationDelay: `${(n % 5) * 40 + k * 60}ms` }}
                    />
                  ))}
                {Array.from({ length: fx.kind === "bomb" ? 5 : 8 }, (_, k) => {
                  const a = (k / (fx.kind === "bomb" ? 5 : 8)) * Math.PI * 2 + n;
                  const r = 18 + (k % 3) * 8;
                  return (
                    <path
                      key={`p${k}`}
                      className="sparkle"
                      style={{ "--sx": `${Math.cos(a) * r}px`, "--sy": `${Math.sin(a) * r * 0.8 - 14}px`, animationDelay: `${(n % 6) * 35}ms` } as React.CSSProperties}
                      d={`M ${c.x} ${c.y - 14} l 1.6 3.4 l 3.4 1.6 l -3.4 1.6 l -1.6 3.4 l -1.6 -3.4 l -3.4 -1.6 l 3.4 -1.6 Z`}
                      fill={k % 2 ? "var(--gold)" : "var(--gold-light)"}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      ))}

      {/* Dragged group follows the finger */}
      {drag && drag.moved && (
        <g pointerEvents="none" filter={glow}>
          <ellipse cx={drag.x} cy={drag.y - FINGER + 8} rx={TS * 0.9} ry={TS * ISO * 0.8} fill="var(--foreground)" opacity={0.16} />
          {Array.from({ length: drag.count }, (_, k) => (
            <TilePrism
              key={k}
              cx={drag.x}
              cy={drag.y - FINGER}
              idx={k}
              size={TS}
              color={color(drag.color)}
              finish={style.finish}
              detail={k === drag.count - 1}
              lift={LIFT}
            />
          ))}
        </g>
      )}
      </TileDefs>
    </svg>
  );
}

/** Recessed hexagon slots: dark back lip, lit front lip. */
const Wells = memo(function Wells({ plate }: { plate: BaseItem }) {
  const alpha = slotOpacity(plate.texture);
  return (
    <g>
      {CENTER_LIST.map((c, i) => {
        const hex = flatHex(c.x, c.y, S * 0.93);
        const fill = Math.abs((CELLS[i]!.q - CELLS[i]!.r) % 3) === 0 ? plate.cellB : plate.cellA;
        return (
          <g key={`cell${i}`}>
            <polygon
              points={pts(hex)}
              fill={fill}
              fillOpacity={alpha}
              stroke={plate.cellEdge}
              strokeWidth={1}
              strokeLinejoin="round"
            />
            <polyline
              points={pts([hex[3]!, hex[4]!, hex[5]!, hex[0]!])}
              fill="none"
              stroke={shade(plate.cellEdge, 0.82)}
              strokeOpacity={0.75}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            <polyline
              points={pts([hex[0]!, hex[1]!, hex[2]!, hex[3]!].map(([x, y]) => [x, y - 0.8] as [number, number]))}
              fill="none"
              stroke={lighten(fill, 0.6)}
              strokeOpacity={0.8}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
});
