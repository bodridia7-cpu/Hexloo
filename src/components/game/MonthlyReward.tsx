import { useEffect, useState } from "react";

import { checkMonthly, formatCash, type RankTab } from "@/game/ranks";
import { sfx } from "@/game/audio";
import { getPlayer, updatePlayer } from "@/game/store";
import { GameButton } from "./GameButton";
import { GameModal } from "./GameModal";

const TAB_LABEL: Record<RankTab, string> = {
  time: "Top Time Played",
  level: "Top Level",
  cash: "Most Cash",
  hard: "Hard Mode",
};

/** Checks once per app start whether a new month began and pays the Top-10 prize. */
export function MonthlyReward() {
  const [reward, setReward] = useState<{ prize: number; rank: number; tab: RankTab } | null>(null);

  useEffect(() => {
    const p = getPlayer();
    const result = checkMonthly(p.monthlyRewardMonth, new Date(), {
      name: p.username,
      avatar: p.avatar,
      color: p.avatarColor,
      time: p.timePlayed,
      level: p.highestLevel,
      cash: p.coins,
      hard: p.hardBest,
    });
    if (result.prize > 0 && "rank" in result) {
      updatePlayer((s) => ({ ...s, monthlyRewardMonth: result.month, coins: s.coins + result.prize }));
      setReward({ prize: result.prize, rank: result.rank, tab: result.tab });
    } else if (p.monthlyRewardMonth !== result.month) {
      updatePlayer((s) => ({ ...s, monthlyRewardMonth: result.month }));
    }
  }, []);

  return (
    <GameModal open={!!reward} onOpenChange={(o) => !o && setReward(null)} title="Monthly Reward!">
      {reward && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-6xl" aria-hidden>
            🏆
          </div>
          <p className="font-display text-xl font-semibold">
            You finished #{reward.rank} in {TAB_LABEL[reward.tab]} last month!
          </p>
          <p className="title-gold text-5xl">+{formatCash(reward.prize)}</p>
          <GameButton
            tone="play"
            className="mt-2 w-full"
            onClick={() => {
              sfx.coin();
              setReward(null);
            }}
          >
            Collect
          </GameButton>
        </div>
      )}
    </GameModal>
  );
}
