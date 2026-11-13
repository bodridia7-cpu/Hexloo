import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Gift, PlayCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { gameButton, GameButton } from "@/components/game/GameButton";
import { CustomBaseEditor, CustomHexaEditor, CustomImageEditor } from "@/components/game/CustomEditors";
import { GameModal } from "@/components/game/GameModal";
import { BackToMenu, CoinPill, PageTitle } from "@/components/game/Hud";
import { ItemArt } from "@/components/game/ItemArt";
import { RewardAd } from "@/components/game/RewardAd";
import { Screen } from "@/components/game/Screen";
import { sfx } from "@/game/audio";
import {
  BACKGROUNDS,
  BASES,
  COIN_BUNDLES,
  CUSTOM_ID,
  DAILY_GIFT,
  HEXAS,
  WATCH_AD_REWARD,
  type Category,
} from "@/game/catalog";
import { formatCash } from "@/game/ranks";
import { addCoins, buyItem, equipItem, todayKey, updatePlayer, usePlayer } from "@/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Hexloo Shop — Backgrounds, Tiles & Boards" },
      {
        name: "description",
        content: "Unlock cosy backgrounds, tile palettes and board styles with the coins you earn in Hexloo.",
      },
      { property: "og:title", content: "Hexloo Shop — Backgrounds, Tiles & Boards" },
      {
        property: "og:description",
        content: "Unlock cosy backgrounds, tile palettes and board styles with the coins you earn in Hexloo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

type Tab = Category | "coins";
const TABS: { id: Tab; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "hexa", label: "Hexa" },
  { id: "base", label: "Base" },
  { id: "coins", label: "Coins" },
];

function Shop() {
  const [tab, setTab] = useState<Tab>("background");
  return (
    <Screen>
      <header className="flex items-center justify-between">
        <BackToMenu />
        <CoinPill />
      </header>
      <div className="mt-4">
        <PageTitle>SHOP</PageTitle>
      </div>
      <main className="card-3d mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div role="tablist" className="grid grid-cols-4 border-b-[3px] border-gold">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                sfx.tap();
                setTab(t.id);
              }}
              className={cn(
                "h-12 font-display text-[0.9375rem] font-semibold transition-colors",
                i > 0 && "border-l-[3px] border-gold",
                tab === t.id ? "bg-gold-light text-foreground" : "bg-cream-deep/60 text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "coins" ? <CoinsTab /> : <ItemList category={tab} />}
        </div>
      </main>
      <footer className="flex shrink-0 justify-center gap-5 pt-5">
        <Link to="/play" className={gameButton({ tone: "play", size: "lg" })}>
          Play
        </Link>
        <Link to="/ranks" className={gameButton({ tone: "rank", size: "lg" })}>
          Rank
        </Link>
      </footer>
    </Screen>
  );
}

function Editor({ category, open, onOpenChange }: { category: Category; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!open) return null;
  if (category === "background") return <CustomImageEditor open={open} onOpenChange={onOpenChange} />;
  if (category === "hexa") return <CustomHexaEditor open={open} onOpenChange={onOpenChange} />;
  return <CustomBaseEditor open={open} onOpenChange={onOpenChange} />;
}

function ItemList({ category }: { category: Category }) {
  const player = usePlayer();
  const [editing, setEditing] = useState(false);
  const items =
    category === "background" ? BACKGROUNDS : category === "hexa" ? HEXAS : BASES;
  return (
    <ul>
      {category === "background" && (
        <li className="px-4 pt-3">
          <p className="note-banner px-4 py-2 text-center font-display text-[0.9375rem] font-semibold leading-snug">
            Choose between blurred and unblurred backgrounds in settings!
          </p>
        </li>
      )}
      {items.map((item) => {
        const owned = player.unlocked.includes(`${category}:${item.id}`);
        const equipped = player.equipped[category] === item.id;
        const custom = item.id === CUSTOM_ID;
        return (
          <li key={item.id} className="flex items-center gap-3 border-b-2 border-gold/60 px-4 py-3">
            <ItemArt category={category} id={item.id} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold leading-tight">{item.name}</p>
              <p className="font-display text-2xl font-bold text-foreground/90">
                {item.price === 0 ? "Free" : formatCash(item.price)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {custom && owned && (
                <GameButton
                  tone="shop"
                  size="sm"
                  className="min-w-0 px-3"
                  onClick={() => {
                    sfx.tap();
                    setEditing(true);
                  }}
                >
                  Edit
                </GameButton>
              )}
              {equipped ? (
                <GameButton tone="cream" size="sm" disabled className="!filter-none opacity-90">
                  Equipped
                </GameButton>
              ) : owned ? (
                <GameButton
                  tone="play"
                  size="sm"
                  onClick={() => {
                    sfx.tap();
                    equipItem(category, item.id);
                  }}
                >
                  Equip
                </GameButton>
              ) : (
                <GameButton
                  tone="gold"
                  size="sm"
                  onClick={() => {
                    if (buyItem(category, item.id, item.price)) {
                      sfx.coin();
                      toast.success(`${item.name} unlocked & equipped!`);
                      if (custom) setEditing(true);
                    } else {
                      sfx.invalid();
                      toast(`You need ${formatCash(item.price - player.coins)} more coins.`);
                    }
                  }}
                >
                  Buy
                </GameButton>
              )}
            </div>
          </li>
        );
      })}
      <Editor category={category} open={editing} onOpenChange={setEditing} />
    </ul>
  );
}

function CoinsTab() {
  const player = usePlayer();
  const [adOpen, setAdOpen] = useState(false);
  const [bundle, setBundle] = useState<(typeof COIN_BUNDLES)[number] | null>(null);
  const claimedToday = player.dailyGiftDate === todayKey();
  return (
    <ul>
      <li className="flex items-center gap-3 border-b-2 border-gold/60 px-4 py-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-gold bg-avatar-4 shadow-[0_3px_0_var(--gold-deep)]">
          <Gift className="size-8" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold leading-tight">Daily Free Gift</p>
          <p className="font-display text-2xl font-bold">+${DAILY_GIFT}</p>
        </div>
        <GameButton
          tone="gold"
          size="sm"
          disabled={claimedToday}
          onClick={() => {
            updatePlayer((s) => ({ ...s, dailyGiftDate: todayKey(), coins: s.coins + DAILY_GIFT }));
            sfx.coin();
            toast.success(`+$${DAILY_GIFT} daily gift collected!`);
          }}
        >
          {claimedToday ? "Tomorrow" : "Claim"}
        </GameButton>
      </li>
      <li className="flex items-center gap-3 border-b-2 border-gold/60 px-4 py-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-gold bg-avatar-2 shadow-[0_3px_0_var(--gold-deep)]">
          <PlayCircle className="size-8" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold leading-tight">Watch Short Ad</p>
          <p className="font-display text-2xl font-bold">+${WATCH_AD_REWARD}</p>
        </div>
        <GameButton
          tone="gold"
          size="sm"
          onClick={() => {
            sfx.tap();
            setAdOpen(true);
          }}
        >
          Watch
        </GameButton>
      </li>
      {COIN_BUNDLES.map((b) => (
        <li key={b.id} className="flex items-center gap-3 border-b-2 border-gold/60 px-4 py-4">
          <span className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-gold bg-gold-light shadow-[0_3px_0_var(--gold-deep)]">
            <Coins className="size-8 text-gold-deep" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold leading-tight">{b.coins.toLocaleString("en-US")} Coins</p>
            <span className="mt-0.5 inline-block rounded-full border-2 border-gold bg-cream-deep px-2 text-xs font-extrabold">
              {b.label}
            </span>
          </div>
          <GameButton
            tone="play"
            size="sm"
            onClick={() => {
              sfx.tap();
              setBundle(b);
            }}
          >
            {b.price}
          </GameButton>
        </li>
      ))}
      <li className="px-5 py-4 text-center text-sm font-bold text-muted-foreground">
        Ads only play when you choose. No pop-ups, ever.
      </li>
      <GameModal open={!!bundle} onOpenChange={(o) => !o && setBundle(null)} title="Coin Pack">
        {bundle && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="title-gold text-4xl">{bundle.coins.toLocaleString("en-US")} Coins</p>
            <p className="font-display text-lg font-semibold">{bundle.label} · {bundle.price}</p>
            <p className="note-banner px-4 py-3 text-sm font-bold">
              In-App Purchases will be active on the App Store release.
            </p>
            <GameButton
              tone="gold"
              size="md"
              className="w-full"
              onClick={() => {
                addCoins(bundle.coins);
                sfx.coin();
                toast.success(`Test: +${formatCash(bundle.coins)} granted`);
                setBundle(null);
              }}
            >
              Test Grant Coins
            </GameButton>
            <GameButton tone="cream" size="md" className="w-full" onClick={() => setBundle(null)}>
              Close
            </GameButton>
          </div>
        )}
      </GameModal>
      <RewardAd
        open={adOpen}
        rewardLabel={`+$${WATCH_AD_REWARD}`}
        onDone={() => {
          addCoins(WATCH_AD_REWARD);
          setAdOpen(false);
          sfx.coin();
          toast.success(`+$${WATCH_AD_REWARD} added!`);
        }}
      />
    </ul>
  );
}
