import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const gameButton = cva(
  "btn-3d inline-flex select-none items-center justify-center gap-2 rounded-full uppercase outline-none focus-visible:ring-4 focus-visible:ring-ring/60",
  {
    variants: {
      tone: {
        play: "[--btn-face:var(--play)] [--btn-deep:var(--play-deep)]",
        shop: "[--btn-face:var(--shop)] [--btn-deep:var(--shop-deep)]",
        rank: "[--btn-face:var(--rank)] [--btn-deep:var(--rank-deep)]",
        hard: "[--btn-face:var(--hard)] [--btn-deep:var(--hard-deep)]",
        gold: "[--btn-face:var(--gold)] [--btn-deep:var(--gold-deep)] [--btn-ink:var(--foreground)] [--btn-ink-shadow:none]",
        cream:
          "[--btn-face:var(--cream)] [--btn-deep:var(--cream-deep)] [--btn-ink:var(--foreground)] [--btn-ink-shadow:none]",
      },
      size: {
        xl: "h-[4.25rem] w-64 text-[2.125rem]",
        lg: "h-14 w-36 text-2xl",
        md: "h-11 px-6 text-lg",
        sm: "h-9 min-w-20 px-4 text-sm",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: { tone: "gold", size: "md" },
  },
);

export type GameButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof gameButton>;

export function GameButton({ className, tone, size, ...props }: GameButtonProps) {
  return <button className={cn(gameButton({ tone, size }), className)} {...props} />;
}
