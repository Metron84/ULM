"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import type { WorldCupLeaderboardEntry } from "@/lib/worldcup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TabKey = "overall" | "draft" | "open";

type WorldCupHubClientProps = {
  globalRank: number;
  globalTotal: number;
  leaderboard: WorldCupLeaderboardEntry[];
};

export function WorldCupHubClient({
  globalRank,
  globalTotal,
  leaderboard,
}: WorldCupHubClientProps) {
  const [tab, setTab] = useState<TabKey>("overall");
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredLeaderboard = useMemo(() => {
    if (tab === "overall") return leaderboard;
    if (tab === "draft") return leaderboard.filter((_, index) => index % 2 === 0);
    return leaderboard.filter((_, index) => index % 2 === 1);
  }, [leaderboard, tab]);

  const rows = filteredLeaderboard.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLeaderboard.length;

  const tabLabel = tab === "overall" ? "Overall Leaderboard" : tab === "draft" ? "Draft Mode" : "Open Selection Mode";

  return (
    <section className="space-y-5 sm:space-y-6 demo-fade-in">
      <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,202,186,0.24),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(212,175,119,0.16),transparent_45%),linear-gradient(to_bottom,rgba(10,61,42,0.10),transparent_55%)]"
        />
        <CardHeader className="relative px-6 sm:px-8">
          <CardTitle className="text-4xl font-bold tracking-tight text-forest sm:text-5xl">
            World Cup 2026
          </CardTitle>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-xl bg-gold/25 text-gold">
              You are in the Knockouts!
            </Badge>
          </div>
          <CardDescription className="mt-3 text-sm text-charcoal/75 sm:text-base">
            Global Leaderboard Position #{globalRank.toLocaleString()} of {globalTotal.toLocaleString()}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex gap-2 rounded-3xl border border-border/70 bg-card/85 p-2 shadow-soft">
        {([
          ["overall", "Overall Leaderboard"],
          ["draft", "Draft Mode"],
          ["open", "Open Selection Mode"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setVisibleCount(10);
            }}
            className={cn(
              "flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition",
              tab === value ? "bg-sage/45 text-forest" : "text-charcoal/75 hover:bg-offwhite",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">{tabLabel}</CardTitle>
          <CardDescription>Infinite-scroll style leaderboard view.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-6">
          {rows.map((row) => (
            <motion.article
              key={`${tab}-${row.rank}-${row.teamName}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "grid grid-cols-[56px_minmax(0,1fr)_112px] items-center rounded-2xl border border-border/70 bg-offwhite px-3 py-3 text-sm shadow-soft",
                row.isCurrentUser && "border-gold/50 bg-gold/10",
              )}
            >
              <p className={cn("font-semibold text-forest", row.isCurrentUser && "text-gold")}>
                #{row.rank}
              </p>
              <div className="min-w-0">
                <p className="truncate font-semibold text-forest">{row.teamName}</p>
                <p className="truncate text-xs text-charcoal/70">{row.managerName}</p>
              </div>
              <p className={cn("text-right font-semibold", row.isCurrentUser ? "text-gold" : "text-forest")}>
                {row.totalPoints}
              </p>
            </motion.article>
          ))}

          {hasMore ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl bg-sage px-4 text-forest hover:bg-sage/80"
                onClick={() => setVisibleCount((count) => count + 10)}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Knockout Bracket</CardTitle>
          <CardDescription>Teaser view for next phase.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-offwhite p-3 text-sm">
            <p className="font-semibold text-forest">Quarterfinal 1</p>
            <p className="mt-2 text-charcoal/75">France vs Brazil</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-offwhite p-3 text-sm">
            <p className="font-semibold text-forest">Quarterfinal 2</p>
            <p className="mt-2 text-charcoal/75">Argentina vs Portugal</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-offwhite p-3 text-sm">
            <p className="font-semibold text-forest">Quarterfinal 3</p>
            <p className="mt-2 text-charcoal/75">England vs Spain</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default WorldCupHubClient;
