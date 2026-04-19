"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import type {
  FixturePredictionRow,
  PredictionLeaderboardRow,
} from "@/lib/predictions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type PredictionsClientProps = {
  fixtures: FixturePredictionRow[];
  leaderboard: PredictionLeaderboardRow[];
};

function TeamPill({
  shortName,
  name,
  logoUrl,
}: {
  shortName: string;
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <span
          className="inline-flex h-8 w-8 overflow-hidden rounded-full border border-border bg-card"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        </span>
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-sage/25 text-xs font-semibold text-forest">
          {shortName.slice(0, 3).toUpperCase()}
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-forest">{shortName}</p>
        <p className="text-xs text-charcoal/70">{name}</p>
      </div>
    </div>
  );
}

export function PredictionsClient({ fixtures, leaderboard }: PredictionsClientProps) {
  const router = useRouter();

  const [predictionSheetOpen, setPredictionSheetOpen] = useState(false);
  const [activeFixture, setActiveFixture] = useState<FixturePredictionRow | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scorerSearch, setScorerSearch] = useState("");
  const [selectedScorerId, setSelectedScorerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const isNoScorer = homeScore === 0 && awayScore === 0;
  const filteredScorers = useMemo(() => {
    if (!activeFixture) return [];
    const q = scorerSearch.trim().toLowerCase();
    if (!q) return activeFixture.scorerOptions;
    return activeFixture.scorerOptions.filter((option) =>
      `${option.name} ${option.teamShort}`.toLowerCase().includes(q),
    );
  }, [activeFixture, scorerSearch]);

  const openPredictionSheet = (fixture: FixturePredictionRow) => {
    setActiveFixture(fixture);
    setHomeScore(fixture.prediction?.homeScore ?? 0);
    setAwayScore(fixture.prediction?.awayScore ?? 0);
    setSelectedScorerId(fixture.prediction?.isNoScorer ? null : fixture.prediction?.scorerId ?? null);
    setScorerSearch("");
    setPredictionSheetOpen(true);
  };

  const submitPrediction = async () => {
    if (!activeFixture) return;
    if (!isNoScorer && !selectedScorerId) {
      toast.error("Select a goal scorer");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: activeFixture.fixtureId,
          homeScore,
          awayScore,
          scorerId: isNoScorer ? null : selectedScorerId,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to save prediction.");
      }

      toast.success("Prediction locked ✓", {
        description: "Gold sparkle unlocked ✨",
      });
      setPredictionSheetOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save prediction.";
      toast.error("Could not lock prediction", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const calculatePoints = async () => {
    try {
      setCalculating(true);
      const response = await fetch("/api/predictions/calculate", { method: "POST" });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        scoredFixtures?: number;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to calculate points.");
      }

      toast.success("Mini-league points updated", {
        description: `Scored ${payload.scoredFixtures ?? 0} finished fixture(s) ✨`,
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Calculation failed.";
      toast.error("Could not calculate points", { description: message });
    } finally {
      setCalculating(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <h2 className="text-3xl font-bold tracking-tight text-forest">Predictions - Round of 16</h2>
        <p className="mt-2 text-sm text-charcoal/75 sm:text-base">
          Mini-league • Separate from main points • Purely for fun
        </p>
      </header>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-forest">Upcoming Fixtures</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 rounded-2xl bg-gold/25 text-forest hover:bg-gold/35"
              onClick={calculatePoints}
              disabled={calculating}
            >
              {calculating ? "Calculating..." : "Calculate Points"}
            </Button>
          </div>
          <CardDescription>Lock your scores and scorer calls before kickoff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          {fixtures.map((fixture) => {
            const matchDate = new Date(fixture.matchDate);
            return (
              <article
                key={fixture.fixtureId}
                className="rounded-3xl border border-border/70 bg-offwhite p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-[220px] items-center gap-4">
                    <TeamPill
                      shortName={fixture.homeTeam.shortName}
                      name={fixture.homeTeam.name}
                      logoUrl={fixture.homeTeam.logoUrl}
                    />
                    <span className="text-sm font-semibold text-charcoal/70">vs</span>
                    <TeamPill
                      shortName={fixture.awayTeam.shortName}
                      name={fixture.awayTeam.name}
                      logoUrl={fixture.awayTeam.logoUrl}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-xl border-border text-charcoal/80">
                      {matchDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                    {fixture.status === "finished" && (
                      <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
                        Finished
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {fixture.prediction ? (
                    <div className="rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-charcoal">
                      <p>
                        Your prediction:{" "}
                        <span className="font-semibold text-forest">
                          {fixture.prediction.homeScore}-{fixture.prediction.awayScore}
                        </span>
                        {fixture.prediction.isNoScorer ? (
                          <span className="ml-2 text-charcoal/70">No goal scorer</span>
                        ) : (
                          <span className="ml-2 text-charcoal/70">
                            Scorer: {fixture.prediction.scorerName ?? "Selected"}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-charcoal/70">No prediction yet</p>
                  )}

                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-10 rounded-2xl bg-sage px-4 text-forest hover:bg-sage/80"
                    onClick={() => openPredictionSheet(fixture)}
                  >
                    {fixture.prediction ? "Edit" : "Make Prediction"}
                  </Button>
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Prediction Mini-League</CardTitle>
          <CardDescription>Top 5 this round.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-6">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-charcoal/70">
                <th className="px-2 py-2 font-medium">Rank</th>
                <th className="px-2 py-2 font-medium">Manager</th>
                <th className="px-2 py-2 font-medium">Team</th>
                <th className="px-2 py-2 font-medium text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr
                  key={row.participantId}
                  className={cn(
                    "border-b border-border/70",
                    row.isCurrentUser && "bg-gold/12",
                  )}
                >
                  <td className="px-2 py-3 font-semibold text-forest">#{row.rank}</td>
                  <td className="px-2 py-3 text-charcoal">{row.managerName}</td>
                  <td className="px-2 py-3 text-charcoal/75">{row.teamName}</td>
                  <td
                    className={cn(
                      "px-2 py-3 text-right font-semibold",
                      row.isCurrentUser ? "text-gold" : "text-forest",
                    )}
                  >
                    {row.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={predictionSheetOpen} onOpenChange={setPredictionSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-border bg-card px-0 pb-4 pt-0 shadow-glow"
        >
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-forest">
              {activeFixture
                ? `${activeFixture.homeTeam.shortName} vs ${activeFixture.awayTeam.shortName}`
                : "Make Prediction"}
            </SheetTitle>
            <SheetDescription>Lock your score and scorer call</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
                <label className="text-xs text-charcoal/70">Home goals</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={homeScore}
                  onChange={(event) =>
                    setHomeScore(Math.max(0, Math.min(5, Number(event.target.value) || 0)))
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-forest"
                />
              </div>
              <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
                <label className="text-xs text-charcoal/70">Away goals</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={awayScore}
                  onChange={(event) =>
                    setAwayScore(Math.max(0, Math.min(5, Number(event.target.value) || 0)))
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-forest"
                />
              </div>
            </div>

            {isNoScorer ? (
              <div className="rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm text-forest">
                0-0 selected: No Goal Scorer enabled automatically.
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
                <label className="text-xs text-charcoal/70">Select one goal scorer</label>
                <input
                  value={scorerSearch}
                  onChange={(event) => setScorerSearch(event.target.value)}
                  placeholder="Search player..."
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                />
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-card p-1">
                  {filteredScorers.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-charcoal/60">No players found.</p>
                  ) : (
                    filteredScorers.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedScorerId(option.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm",
                          selectedScorerId === option.id
                            ? "bg-sage/35 text-forest"
                            : "hover:bg-offwhite text-charcoal/85",
                        )}
                      >
                        <span>{option.name}</span>
                        <span className="text-xs text-charcoal/60">{option.teamShort}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              className="h-12 w-full rounded-2xl bg-sage text-forest hover:bg-sage/80"
              onClick={submitPrediction}
              disabled={submitting}
            >
              {submitting ? "Locking..." : "Lock Prediction"}
            </Button>
          </div>
          <div className="px-6 text-center text-xs text-gold">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Gold sparkle for bold calls
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default PredictionsClient;
