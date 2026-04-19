"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [visibleCount, setVisibleCount] = useState(20);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredLeaderboard = useMemo(() => {
    if (tab === "overall") return leaderboard;
    if (tab === "draft") return leaderboard.filter((_, index) => index % 2 === 0);
    return leaderboard.filter((_, index) => index % 2 === 1);
  }, [leaderboard, tab]);

  const rows = filteredLeaderboard.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLeaderboard.length;
  const currentRow = filteredLeaderboard.find((entry) => entry.isCurrentUser);

  const tabLabel = tab === "overall" ? "Overall Leaderboard" : tab === "draft" ? "Draft Mode" : "Open Selection Mode";

  useEffect(() => {
    const rootNode = listRef.current;
    const targetNode = sentinelRef.current;
    if (!rootNode || !targetNode || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + 20, filteredLeaderboard.length));
        }
      },
      { root: rootNode, threshold: 0.15 },
    );

    observer.observe(targetNode);
    return () => observer.disconnect();
  }, [filteredLeaderboard.length, hasMore]);

  const bracketColumns = [
    {
      title: "Quarterfinals",
      matches: ["France vs Brazil", "Argentina vs Portugal", "England vs Spain", "Germany vs Netherlands"],
    },
    {
      title: "Semifinals",
      matches: ["Winner QF1 vs Winner QF2", "Winner QF3 vs Winner QF4"],
    },
    {
      title: "Final",
      matches: ["Winner SF1 vs Winner SF2"],
    },
  ] as const;

  return (
    <section className="space-y-5 sm:space-y-6">
      <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,202,186,0.24),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(212,175,119,0.16),transparent_45%),linear-gradient(to_bottom,rgba(10,61,42,0.10),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(90deg,transparent,transparent_34px,rgba(10,61,42,0.08)_35px,transparent_36px),radial-gradient(circle_at_50%_120%,rgba(10,61,42,0.18),transparent_58%)]"
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
          <CardDescription className="mt-3 text-sm text-muted-foreground sm:text-base">
            Global Leaderboard Position #{globalRank.toLocaleString()} of {globalTotal.toLocaleString()}
          </CardDescription>
          {currentRow ? (
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Your squad today: <span className="font-semibold text-gold">{currentRow.teamName}</span> with{" "}
              <span className="font-semibold text-forest">{currentRow.totalPoints}</span> points.
            </p>
          ) : null}
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
              setVisibleCount(20);
              if (listRef.current) listRef.current.scrollTop = 0;
            }}
            className={cn(
              "flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition",
              tab === value ? "bg-primary/45 text-forest" : "text-muted-foreground hover:bg-offwhite",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">{tabLabel}</CardTitle>
          <CardDescription>Infinite-scroll style leaderboard with tournament momentum.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-6">
          <div className="grid grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)_110px] rounded-2xl border border-border/70 bg-offwhite px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Rank</span>
            <span>Team</span>
            <span>Manager</span>
            <span className="text-right">Points</span>
          </div>

          <div ref={listRef} className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {rows.map((row) => (
              <motion.article
                key={`${tab}-${row.rank}-${row.teamName}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  "grid grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)_110px] items-center rounded-2xl border border-border/70 bg-offwhite px-3 py-3 text-sm shadow-soft",
                  row.isCurrentUser && "border-gold/50 bg-gold/10",
                )}
              >
                <p className={cn("font-semibold text-forest", row.isCurrentUser && "text-gold")}>
                  #{row.rank}
                </p>
                <p className="truncate font-semibold text-forest">{row.teamName}</p>
                <p className="truncate text-muted-foreground">{row.managerName}</p>
                <p className={cn("text-right font-semibold", row.isCurrentUser ? "text-gold" : "text-forest")}>
                  {row.totalPoints}
                </p>
              </motion.article>
            ))}

            <div ref={sentinelRef} className="h-4" />

            {hasMore ? (
              <div className="pb-3 pt-1 text-center text-xs text-muted-foreground">
                Loading more leaderboard entries...
              </div>
            ) : (
              <div className="pb-3 pt-1 text-center text-xs text-foreground/50">
                End of leaderboard view
              </div>
            )}
          </div>

          {hasMore ? (
            <div className="pt-1">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                onClick={() => setVisibleCount((count) => Math.min(count + 20, filteredLeaderboard.length))}
              >
                Load 20 More
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Knockout Bracket</CardTitle>
          <CardDescription>Visual teaser of the path to the World Cup Final.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-6">
          <div className="grid min-w-[760px] grid-cols-3 gap-4">
            {bracketColumns.map((column, columnIndex) => (
              <div key={column.title} className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-offwhite px-3 py-2 text-sm font-semibold text-forest">
                  {column.title}
                </div>
                {column.matches.map((match, matchIndex) => (
                  <div key={`${column.title}-${match}`} className="relative rounded-2xl border border-border/70 bg-offwhite p-3 text-sm text-foreground">
                    <p className="font-medium text-forest">
                      {column.title.replace("s", "")} {matchIndex + 1}
                    </p>
                    <p className="mt-1 text-muted-foreground">{match}</p>
                    {columnIndex < bracketColumns.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-2 top-1/2 h-px w-4 -translate-y-1/2 bg-forest/25"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default WorldCupHubClient;
