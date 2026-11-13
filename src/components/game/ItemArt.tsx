import { ImagePlus } from "lucide-react";

import { bgThumb } from "@/game/backgrounds";
import { CUSTOM_ID, type Category } from "@/game/catalog";
import { useImage } from "@/game/images";
import { cn } from "@/lib/utils";
import { BasePreview, HexStackPreview } from "./HexPreview";

function BackgroundThumb({ id }: { id: string }) {
  const custom = useImage("background");
  const src = id === CUSTOM_ID ? custom : bgThumb(id);
  if (src) return <img src={src} alt="" loading="lazy" className="size-full object-cover" />;
  if (id === CUSTOM_ID) return <ImagePlus className="size-7 text-muted-foreground" strokeWidth={2.2} />;
  // Sage Leaves: the original leafy scene in miniature.
  return (
    <span data-bg={id} className="scene relative block size-full">
      <span className="absolute -left-2 -top-1 h-5 w-9 rotate-[30deg] rounded-[60%_10%] bg-[var(--leaf-a)] opacity-80 blur-[1px]" />
      <span className="absolute -bottom-1 -right-2 h-5 w-9 -rotate-[30deg] rounded-[60%_10%] bg-[var(--leaf-b)] opacity-80 blur-[1px]" />
      <span className="absolute -right-1 top-2 h-4 w-7 rotate-[150deg] rounded-[60%_10%] bg-[var(--leaf-a)] opacity-70 blur-[1px]" />
    </span>
  );
}

/** Square picture of a shop or limited item, used in the Shop, Spin Wheel and Collector Book. */
export function ItemArt({
  category,
  id,
  size = "md",
  locked = false,
}: {
  category: Category;
  id: string;
  size?: "sm" | "md" | "lg";
  locked?: boolean;
}) {
  const box = size === "sm" ? "size-12" : size === "lg" ? "size-20" : "size-16";
  const px = size === "sm" ? 44 : size === "lg" ? 74 : 58;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-gold bg-cream-deep shadow-[0_3px_0_var(--gold-deep)]",
        box,
      )}
    >
      <span className={cn("flex size-full items-center justify-center", locked && "locked-art")}>
        {category === "background" && <BackgroundThumb id={id} />}
        {category === "hexa" && <HexStackPreview hexa={id} height={5} size={px - 2} />}
        {category === "base" && <BasePreview base={id} size={px} />}
      </span>
    </span>
  );
}
