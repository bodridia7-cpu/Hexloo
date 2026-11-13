import { LIMITED_SETS, setForMonth, type Category } from "@/game/catalog";
import { sfx } from "@/game/audio";
import { equipItem, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";
import { GameButton } from "./GameButton";
import { GameModal } from "./GameModal";
import { ItemArt } from "./ItemArt";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATS: { id: Category; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "hexa", label: "Hexa" },
  { id: "base", label: "Base" },
];

export function CollectorBookModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const player = usePlayer();
  const current = setForMonth(new Date()).id;
  const owned = LIMITED_SETS.flatMap((s) => CATS.map((c) => `${c.id}:${s[c.id].id}`)).filter((k) => player.unlocked.includes(k)).length;
  return (
    <GameModal open={open} onOpenChange={onOpenChange} title="Collector Book">
      <p className="-mt-2 text-center text-sm font-bold text-muted-foreground">
        {owned} / {LIMITED_SETS.length * 3} limited items collected
      </p>
      <div className="mt-3 flex max-h-[68dvh] flex-col gap-3 overflow-y-auto px-1 pb-1">
        {LIMITED_SETS.map((set, si) => {
          const months = MONTHS.filter((_, m) => m % LIMITED_SETS.length === si).join(" · ");
          return (
            <section key={set.id} className={cn("rounded-2xl border-[3px] border-gold bg-cream-deep/50 p-3", set.id === current && "bg-gold-light")}>
              <header className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold leading-tight">{set.name}</h3>
                <span className="shrink-0 rounded-full border-2 border-gold bg-cream px-2 text-[11px] font-extrabold">
                  {set.id === current ? "This month" : months}
                </span>
              </header>
              <div className="grid grid-cols-3 gap-2">
                {CATS.map((c) => {
                  const item = set[c.id];
                  const has = player.unlocked.includes(`${c.id}:${item.id}`);
                  const equipped = player.equipped[c.id] === item.id;
                  return (
                    <div key={c.id} className="flex flex-col items-center gap-1 text-center">
                      <ItemArt category={c.id} id={item.id} locked={!has} />
                      <p className="min-h-8 font-display text-xs font-semibold leading-tight">{has ? item.name : "???"}</p>
                      {has ? (
                        <GameButton
                          tone={equipped ? "cream" : "play"}
                          size="sm"
                          className="h-8 min-w-0 px-2 text-[11px]"
                          disabled={equipped}
                          onClick={() => {
                            sfx.tap();
                            equipItem(c.id, item.id);
                          }}
                        >
                          {equipped ? "Equipped" : "Equip"}
                        </GameButton>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground">{c.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="text-center text-xs font-bold text-muted-foreground">Win limited items from the Lucky Spin's Mega prize.</p>
      </div>
    </GameModal>
  );
}
