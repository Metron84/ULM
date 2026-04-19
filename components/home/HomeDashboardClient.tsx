"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { AssistantPersona } from "@/lib/persona";
import { personaEmoji, personaLabel } from "@/lib/persona";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HomeDashboardClientProps = {
  displayName: string;
  persona: AssistantPersona;
  briefing: string;
  liveTickerEntries: string[];
  worldCupRank: number;
  worldCupTotal: number;
  leagueLabel: string;
  leagueRank: number;
  leagueTotalPoints: number;
  leagueMovement: number;
  nextMatchLabel: string;
  nextMatchIso: string | null;
  predictionsCompleted: number;
  predictionsTotal: number;
};

function formatCountdown(targetIso: string | null) {
  if (!targetIso) return "3 days 14 hours";
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} days ${hours} hours`;
}

export function HomeDashboardClient({
  displayName,
  persona,
  briefing,
  liveTickerEntries,
  worldCupRank,
  worldCupTotal,
  leagueLabel,
  leagueRank,
  leagueTotalPoints,
  leagueMovement,
  nextMatchLabel,
  nextMatchIso,
  predictionsCompleted,
  predictionsTotal,
}: HomeDashboardClientProps) {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [countdown, setCountdown] = useState(() => formatCountdown(nextMatchIso));

  const tickerPool = useMemo(() => {
    if (liveTickerEntries.length > 0) return liveTickerEntries;
    return ["Points being tabulated this matchday • Live updates incoming"];
  }, [liveTickerEntries]);

  useEffect(() => {
    const tickerTimer = window.setInterval(() => {
      setTickerIndex((current) => (current + 1) % tickerPool.length);
    }, 30000);
    return () => window.clearInterval(tickerTimer);
  }, [tickerPool.length]);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setCountdown(formatCountdown(nextMatchIso));
    }, 15000);
    return () => window.clearInterval(countdownTimer);
  }, [nextMatchIso]);

  const movementUp = leagueMovement >= 0;
  const movementAbs = Math.abs(leagueMovement);

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="space-y-4 rounded-3xl border border-border/70 bg-card/85 p-6 shadow-soft sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-forest sm:text-3xl">
              Good evening, {displayName}
            </h2>
            <p className="mt-2 text-sm text-charcoal/75 sm:text-base">
              Your assistant is ready for this matchday.
            </p>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/35 text-2xl shadow-soft">
            {personaEmoji(persona)}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-offwhite px-4 py-3">
          <p className="text-sm font-semibold text-forest">Live ticker / points pulse</p>
          <div className="mt-1 overflow-hidden border-t border-gold/60 pt-2">
            <p className="text-sm text-charcoal/85">{tickerPool[tickerIndex]}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">World Cup Global Rank</CardTitle>
            <CardDescription>Current global standing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-6">
            <p className="text-2xl font-bold text-gold">
              #{worldCupRank.toLocaleString()} / {worldCupTotal.toLocaleString()}
            </p>
            <p className="text-sm text-charcoal/75">
              Total points: <span className="font-semibold text-forest">{leagueTotalPoints}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">League Rank</CardTitle>
            <CardDescription>{leagueLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-6">
            <p className="text-2xl font-bold text-forest">#{leagueRank}</p>
            <p className="inline-flex items-center gap-1 text-sm text-charcoal/75">
              {movementUp ? (
                <ArrowUpRight className="h-4 w-4 text-forest" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-gold" />
              )}
              {movementUp ? "Up" : "Down"} {movementAbs} this cycle
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-forest">Assistant&apos;s Daily Briefing</CardTitle>
            <Badge variant="secondary" className="rounded-xl bg-sage/45 text-forest">
              {personaEmoji(persona)} {personaLabel(persona)}
            </Badge>
          </div>
          <CardDescription>Relevant matchday context in your assistant tone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          <p className="rounded-2xl bg-offwhite p-4 text-sm leading-relaxed text-charcoal">
            {briefing}
          </p>
          <Link href="/assistant">
            <Button
              variant="secondary"
              size="lg"
              className="h-11 rounded-2xl bg-sage/55 px-5 text-forest hover:bg-sage/70"
            >
              Ask Assistant
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Next Matchday</CardTitle>
          <CardDescription>{nextMatchLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold text-charcoal">{countdown}</p>
          <Link href="/assistant?function=captain_recommender">
            <Button
              variant="secondary"
              size="lg"
              className="h-11 rounded-2xl bg-sage px-5 text-forest hover:bg-sage/80"
            >
              Captain Recommendation
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/70 bg-card/90 py-4 shadow-soft">
          <CardHeader className="px-5 pb-2">
            <CardTitle className="text-base text-forest">Predictions This Round</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <Badge variant="outline" className="rounded-xl border-gold/40 text-gold">
              {predictionsCompleted}/{predictionsTotal} completed
            </Badge>
            <div className="mt-3">
              <Link href="/predictions">
                <Button className="h-9 w-full rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Open Predictions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-4 shadow-soft">
          <CardHeader className="px-5 pb-2">
            <CardTitle className="text-base text-forest">Manage Roster</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-xs text-charcoal/70">Set captaincy and optimize squad health.</p>
            <div className="mt-3">
              <Link href="/roster">
                <Button className="h-9 w-full rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Open Roster
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-4 shadow-soft">
          <CardHeader className="px-5 pb-2">
            <CardTitle className="text-base text-forest">Open Trades</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-xs text-charcoal/70">Review market actions and commissioner flow.</p>
            <div className="mt-3">
              <Link href="/trades">
                <Button className="h-9 w-full rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Open Trades
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-4 shadow-soft">
          <CardHeader className="px-5 pb-2">
            <CardTitle className="text-base text-forest">World Cup Hub</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-xs text-charcoal/70">Track knockout momentum and rank pulse.</p>
            <div className="mt-3">
              <Link href="/worldcup">
                <Button className="h-9 w-full rounded-2xl bg-sage text-forest hover:bg-sage/80">
                  Open Hub
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default HomeDashboardClient;
