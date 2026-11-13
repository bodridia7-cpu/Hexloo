import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function GameModal({
  open,
  onOpenChange,
  title,
  children,
  locked = false,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  locked?: boolean;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !locked && onOpenChange(o)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => locked && e.preventDefault()}
          onInteractOutside={(e) => locked && e.preventDefault()}
          className={cn(
            "card-3d fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 p-5 text-foreground outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-90 data-[state=open]:fade-in-0",
            className,
          )}
        >
          <DialogPrimitive.Title className="title-gold text-center text-3xl tracking-wide">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          {!locked && (
            <DialogPrimitive.Close
              aria-label="Close"
              className="pill-3d absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full"
            >
              <X className="size-4" strokeWidth={3} />
            </DialogPrimitive.Close>
          )}
          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
