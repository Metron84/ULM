"use client";

import { useMemo, useState } from "react";

import type { LeaderMetric, StatsPageData } from "@/lib/stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsClientProps = {
  data: StatsPageData;
};

const leaderTabs: Array<{ key: LeaderMetric; label: string }> = [
  { key: "overall_points", label: "Overall Points" },
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "bonus_points", label: "Bonus Points" },
];

export function StatsClient({ data }: StatsClientProps) {
  const [activeMetric, setActiveMetric] = useState<LeaderMetric>("overall_points");
  const leaderboardRows = useMemo(() => data.leaders[activeMetric] ?? [], [data.leaders, activeMetric]);

  return (
    <section className="space-y-5 sm:space-y-6">
      <Card className="rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
        <CardHeader className="px-6 sm:px-8">
          <CardTitle className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
            Stats &amp; Leaders
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-charcoal/75 sm:text-base">
            Performance across your leagues and the World Cup
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">League Leaders</CardTitle>
          <CardDescription>
            League: {data.leagueName} • Competition: {data.competitionName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {leaderTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveMetric(tab.key)}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                  activeMetric === tab.key
                    ? "border-gold/60 bg-gold/10 text-gold"
                    : "border-border bg-offwhite text-charcoal hover:border-sage/70 hover:bg-sage/20",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-offwhite">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Player Name</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Goals</th>
                  <th className="px-4 py-3">Assists</th>
                  <th className="px-4 py-3">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leaderboardRows.map((row) => (
                  <tr key={`${activeMetric}-${row.playerId}-${row.rank}`} className="text-charcoal/90">
                    <td className="px-4 py-3 font-semibold text-forest">#{row.rank}</td>
                    <td className="px-4 py-3 font-semibold text-forest">{row.playerName}</td>
                    <td className="px-4 py-3">{row.teamName}</td>
                    <td className="px-4 py-3 font-semibold text-gold">{row.points}</td>
                    <td className="px-4 py-3">{row.goals}</td>
                    <td className="px-4 py-3">{row.assists}</td>
                    <td className="px-4 py-3">{row.averageRating.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">Your Team Stats</CardTitle>
          <CardDescription>{data.currentTeamName}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/60">Total Points</p>
            <p className="mt-1 text-2xl font-bold text-forest">{data.teamStats.totalPoints}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/60">Average Rating</p>
            <p className="mt-1 text-2xl font-bold text-forest">{data.teamStats.averageRating.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/60">Top Performer</p>
            <p className="mt-1 text-sm font-semibold text-forest">{data.teamStats.topPerformer}</p>
            <p className="text-xs text-gold">{data.teamStats.topPerformerPoints} points</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/60">Most Consistent</p>
            <p className="mt-1 text-sm font-semibold text-forest">{data.teamStats.mostConsistent}</p>
            <p className="text-xs text-gold">{data.teamStats.mostConsistentRating.toFixed(2)} rating</p>
          </div>
        </CardContent>
      </Card>

      {data.worldCupStats ? (
        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-xl text-forest">World Cup Global Stats</CardTitle>
            <CardDescription>Top scorers, ratings, and differentials from tournament play.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="text-sm font-semibold text-forest">Top Scorers</p>
              <ul className="mt-3 space-y-2 text-sm text-charcoal">
                {data.worldCupStats.topScorers.map((row) => (
                  <li key={`scorer-${row.playerName}`} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.playerName}</span>
                    <span className="font-semibold text-gold">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="text-sm font-semibold text-forest">Top Rated</p>
              <ul className="mt-3 space-y-2 text-sm text-charcoal">
                {data.worldCupStats.topRated.map((row) => (
                  <li key={`rated-${row.playerName}`} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.playerName}</span>
                    <span className="font-semibold text-gold">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="text-sm font-semibold text-forest">Best Differentials</p>
              <ul className="mt-3 space-y-2 text-sm text-charcoal">
                {data.worldCupStats.bestDifferentials.map((row) => (
                  <li key={`diff-${row.playerName}`} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.playerName}</span>
                    <span className="font-semibold text-gold">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">Recent Form</CardTitle>
          <CardDescription>Latest matchday performances from your roster.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.recentForm.slice(0, 6).map((row, index) => (
            <article key={`${row.playerName}-${row.fixtureLabel}-${index}`} className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-forest">{row.playerName}</p>
                <span className="rounded-xl bg-gold/15 px-2 py-1 text-xs font-semibold text-gold">
                  {row.points} pts
                </span>
              </div>
              <p className="mt-1 text-xs text-charcoal/70">{row.fixtureLabel}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-charcoal">
                <p>G: {row.goals}</p>
                <p>A: {row.assists}</p>
                <p>B: {row.bonusPoints}</p>
              </div>
              <p className="mt-2 text-xs text-charcoal/70">Rating: {row.rating.toFixed(2)}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

export default StatsClient;
