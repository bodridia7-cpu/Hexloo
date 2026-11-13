import type { BaseItem, HexaItem } from "@/game/catalog";
import { baseFor, hexaFor, usePlayer } from "@/game/store";
import { neonUrl, TILE_H, TileDefs, TilePrism, useSvgPrefix } from "./hexgeo";
import { BoardPlate } from "./plate";

/** Small stack of tiles cycling through a palette. Pass `item` to preview unsaved custom styles. */
export function HexStackPreview({
  hexa,
  item,
  height = 4,
  size = 56,
}: {
  hexa: string;
  item?: HexaItem;
  height?: number;
  size?: number;
}) {
  const player = usePlayer();
  const h = item ?? hexaFor(hexa, player);
  const prefix = useSvgPrefix();
  const ts = 18;
  const baseY = 10 + height * TILE_H;
  return (
    <svg viewBox={`-24 -22 48 ${baseY + 34}`} width={size} height={size} aria-hidden>
      <TileDefs finishes={[h.finish]} prefix={prefix}>
        <ellipse cx={0.6} cy={baseY + 1.5} rx={ts * 1.05} ry={ts * 0.6} fill="#000" opacity={0.14} />
        <g filter={h.finish === "neon" ? neonUrl(prefix) : undefined}>
          {Array.from({ length: height }, (_, i) => (
            <TilePrism
              key={i}
              cx={0}
              cy={baseY}
              idx={i}
              size={ts}
              color={h.colors[Math.floor(i / 2) % h.colors.length]!}
              finish={h.finish}
              detail={i === height - 1}
            />
          ))}
        </g>
      </TileDefs>
    </svg>
  );
}

/** Mini board plate. Pass `item` to preview unsaved custom styles. */
export function BasePreview({ base, item, size = 56 }: { base: string; item?: BaseItem; size?: number }) {
  const player = usePlayer();
  const b = item ?? baseFor(base, player);
  const prefix = useSvgPrefix();
  return (
    <svg viewBox="-28 -20 56 42" width={size} height={size * 0.75} aria-hidden>
      <BoardPlate R={25} depth={5} plate={b} p={prefix} rimWidth={2.6} />
    </svg>
  );
}
