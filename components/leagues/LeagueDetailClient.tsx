"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { LeagueDetailPageData } from "@/lib/leagues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LeagueDetailClientProps = {
  data: LeagueDetailPageData;
};

function modeBadge(mode: LeagueDetailPageData["mode"]) {
  if (mode === "draft") {
    return { label: "Draft Mode", className: "bg-sage/45 text-forest" };
  }
  return { label: "Open Selection Mode", className: "bg-gold/25 text-gold" };
}

export function LeagueDetailClient({ data }: LeagueDetailClientProps) {
  const modeMeta = modeBadge(data.mode);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveUpdatedAt(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="space-y-5 sm:space-y-6">
      <nav className="text-sm text-charcoal/70">
        <Link href="/leagues" className="font-medium text-forest/80 hover:text-forest">
          My Leagues
        </Link>{" "}
        <span className="px-1">→</span>
        <span className="font-semibold text-forest">{data.leagueName}</span>
      </nav>

      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-forest">{data.leagueName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-charcoal/75 sm:text-base">{data.competitionName}</p>
              <Badge variant="secondary" className={cn("rounded-xl", modeMeta.className)}>
                {modeMeta.label}
              </Badge>
            </div>
          </div>
          {data.isCommissioner ? (
            <div className="space-y-2 text-right">
              <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
                You are Commissioner
              </Badge>
              <div>
                <Link href={`/leagues/${data.leagueId}/commissioner`}>
                  <Button
                    size="sm"
                    className="h-9 rounded-2xl bg-sage text-forest hover:bg-sage/80"
                  >
                    Open Commissioner Portal
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="standings">
        <TabsList className="overflow-x-auto rounded-3xl border border-border/70 bg-card/85 p-2 shadow-soft">
          <TabsTrigger value="standings" className="rounded-2xl">
            Standings
          </TabsTrigger>
          <TabsTrigger value="roster" className="rounded-2xl">
            Roster
          </TabsTrigger>
          <TabsTrigger value="predictions" className="rounded-2xl">
            Predictions
          </TabsTrigger>
          <TabsTrigger value="trades" className="rounded-2xl">
            Trades
          </TabsTrigger>
          {data.isCommissioner ? (
            <TabsTrigger value="settings" className="rounded-2xl">
              Settings
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="standings">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Standings</CardTitle>
              <CardDescription>Current ranking across all league participants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-offwhite px-3 py-2 text-xs text-charcoal/70">
                <span className="inline-flex items-center gap-2 font-medium text-forest">
                  <span className="h-2 w-2 rounded-full bg-gold animate-pulse" aria-hidden="true" />
                  Live points pulse
                </span>
                <span>Updated {liveUpdatedAt.toLocaleTimeString()}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
                  <p className="text-xs uppercase tracking-wide text-charcoal/60">League Average</p>
                  <p className="mt-1 text-2xl font-bold text-forest">{data.leagueAveragePoints}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
                  <p className="text-xs uppercase tracking-wide text-charcoal/60">Top Performer</p>
                  <p className="mt-1 text-sm font-semibold text-forest">{data.topPerformerTeam}</p>
                  <p className="text-xs text-gold">{data.topPerformerPoints} total points</p>
                </div>
              </div>

              {data.participants.length === 0 ? (
                <p className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-charcoal/75">
                  No participants are currently available for this league yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/70 bg-offwhite">
                  <table className="w-full min-w-[780px] text-sm">
                    <thead className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-charcoal/60">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Team Name</th>
                        <th className="px-4 py-3">Manager Name</th>
                        <th className="px-4 py-3">Total Points</th>
                        <th className="px-4 py-3">This Week Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.participants.map((row) => (
                        <tr
                          key={row.id}
                          className={cn(
                            "text-charcoal/90",
                            row.isCurrentUser && "bg-gold/10",
                          )}
                        >
                          <td className={cn("px-4 py-3 font-semibold text-forest", row.isCurrentUser && "text-gold")}>
                            #{row.rank}
                          </td>
                          <td className="px-4 py-3 font-semibold text-forest">{row.teamName}</td>
                          <td className="px-4 py-3">{row.managerName}</td>
                          <td className={cn("px-4 py-3 font-semibold", row.isCurrentUser ? "text-gold" : "text-forest")}>
                            {row.totalPoints}
                          </td>
                          <td className="px-4 py-3 font-medium text-charcoal">{row.thisWeekPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Roster</CardTitle>
              <CardDescription>Open your squad manager for lineup and captaincy.</CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <Link href="/roster">
                <Button className="h-10 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Go to Roster
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Predictions</CardTitle>
              <CardDescription>Enter and review prediction picks for upcoming fixtures.</CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <Link href="/predictions">
                <Button className="h-10 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Go to Predictions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Trades</CardTitle>
              <CardDescription>Propose and manage football-only trades.</CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <Link href="/trades">
                <Button className="h-10 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Go to Trades
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {data.isCommissioner ? (
          <TabsContent value="settings">
            <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
              <CardHeader className="px-6">
                <CardTitle className="text-forest">League Settings</CardTitle>
                <CardDescription>Commissioner controls for league policy and operations.</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                <Link href={`/leagues/${data.leagueId}/commissioner`}>
                  <Button className="h-10 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                    Open Commissioner Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </section>
  );
}

export default LeagueDetailClient;
