"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CompetitionOption, LeagueCardRow } from "@/lib/leagues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MyLeaguesClientProps = {
  competitions: CompetitionOption[];
  leagues: LeagueCardRow[];
};

const BIG5_OPTIONS = [
  "Premier League",
  "Bundesliga",
  "La Liga",
  "Serie A",
  "Ligue 1",
] as const;

function modeBadge(mode: LeagueCardRow["mode"]) {
  if (mode === "draft") {
    return {
      label: "Draft Mode",
      className: "bg-sage/50 text-forest",
    };
  }
  return {
    label: "Open Selection Mode",
    className: "bg-gold/25 text-gold",
  };
}

export function MyLeaguesClient({ competitions, leagues }: MyLeaguesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [competitionName, setCompetitionName] = useState("World Cup 2026");
  const [mode, setMode] = useState<"draft" | "open_selection">("draft");
  const [leagueType, setLeagueType] = useState<"private" | "public">("private");
  const [big5Selection, setBig5Selection] = useState<"all" | "custom">("all");
  const [selectedBig5, setSelectedBig5] = useState<string[]>([...BIG5_OPTIONS]);

  const competitionChoices = useMemo(() => {
    const worldCup =
      competitions.find((competition) => competition.name === "World Cup 2026") ?? null;
    const big5 =
      competitions.find((competition) => competition.name === "Big 5 Leagues Season") ?? null;

    return [
      {
        id: worldCup?.id ?? "",
        name: "World Cup 2026",
        type: "tournament" as const,
      },
      {
        id: big5?.id ?? "",
        name: "Big 5 Leagues Season",
        type: "main_season" as const,
      },
    ];
  }, [competitions]);

  const selectedCompetition = useMemo(
    () => competitionChoices.find((competition) => competition.name === competitionName) ?? null,
    [competitionName, competitionChoices],
  );

  const isBig5 = competitionName.toLowerCase().includes("big 5");

  const submitCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast.error("League name is required.");
      return;
    }
    if (isBig5 && big5Selection === "custom" && selectedBig5.length === 0) {
      toast.error("Select at least one league for Big 5 custom mode.");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leagueName.trim(),
          competitionId: selectedCompetition?.id ?? "",
          competitionName,
          mode,
          leagueType,
          big5Selection,
          selectedBig5Leagues: isBig5
            ? big5Selection === "all"
              ? [...BIG5_OPTIONS]
              : selectedBig5
            : [],
          commissionerMode: "self",
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        leagueId?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to create league.");
      }

      toast.success("League created", {
        description: "Your new league is now available in My Leagues.",
      });
      setOpen(false);
      setLeagueName("");
      setMode("draft");
      setLeagueType("private");
      setBig5Selection("all");
      setSelectedBig5([...BIG5_OPTIONS]);
      router.refresh();
      if (payload.leagueId) {
        router.push(`/leagues/${payload.leagueId}/commissioner`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create league right now.",
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleBig5League = (leagueOption: string) => {
    setSelectedBig5((current) =>
      current.includes(leagueOption)
        ? current.filter((item) => item !== leagueOption)
        : [...current, leagueOption],
    );
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-forest">My Leagues</h2>
            <p className="mt-2 text-sm text-charcoal/75 sm:text-base">
              Your private and public competitions
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-3xl bg-sage px-5 text-base font-semibold text-gold hover:bg-sage/80"
            onClick={() => setOpen(true)}
          >
            + Create New League
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {leagues.map((league) => {
          const modeMeta = modeBadge(league.mode);
          return (
            <Card
              key={league.leagueId}
              className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft"
            >
              <CardHeader className="space-y-3 px-5">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-2 text-lg text-forest">
                    <Link href={`/leagues/${league.leagueId}`} className="hover:text-forest/80">
                      {league.leagueName}
                    </Link>
                  </CardTitle>
                  <Badge variant="secondary" className={cn("rounded-xl", modeMeta.className)}>
                    {modeMeta.label}
                  </Badge>
                </div>
                <CardDescription>{league.competitionName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-5 text-sm">
                <p className="rounded-2xl border border-border/70 bg-offwhite px-3 py-2 text-charcoal">
                  Rank: <span className="font-semibold text-forest">#{league.rank ?? "-"}</span>
                </p>
                <p className="rounded-2xl border border-border/70 bg-offwhite px-3 py-2 text-charcoal">
                  Total Points:{" "}
                  <span className="font-semibold text-gold">{league.totalPoints}</span>
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-0 bg-transparent px-5">
                <Link href={`/leagues/${league.leagueId}`}>
                  <Button size="sm" variant="secondary" className="h-9 rounded-2xl bg-gold/25 text-forest hover:bg-gold/35">
                    Open League
                  </Button>
                </Link>
                <Link href="/roster">
                  <Button size="sm" className="h-9 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                    View Roster
                  </Button>
                </Link>
                <Link href="/predictions">
                  <Button size="sm" variant="outline" className="h-9 rounded-2xl">
                    Predictions
                  </Button>
                </Link>
                <Link href="/trades">
                  <Button size="sm" variant="outline" className="h-9 rounded-2xl">
                    Trades
                  </Button>
                </Link>
                {league.isCommissioner ? (
                  <Link href={`/leagues/${league.leagueId}/commissioner`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 rounded-2xl bg-gold/25 text-forest hover:bg-gold/35"
                    >
                      Commissioner Portal
                    </Button>
                  </Link>
                ) : null}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {leagues.length === 0 ? (
        <Card className="rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
          <CardContent className="px-6 text-sm text-charcoal/75">
            You are not in any leagues yet. Create your first league to start your season.
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-3xl border border-border/70 bg-card p-0 shadow-glow">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle className="text-xl text-forest">Create New League</DialogTitle>
            <DialogDescription>
              Configure competition, mode, and commissioner settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-6 pt-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">League name</label>
              <input
                value={leagueName}
                onChange={(event) => setLeagueName(event.target.value)}
                placeholder="e.g. Metron Elite League"
                className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">Competition</label>
              <select
                value={competitionName}
                onChange={(event) => setCompetitionName(event.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm text-charcoal"
              >
                {competitionChoices.map((competition) => (
                  <option key={`${competition.name}-${competition.type}`} value={competition.name}>
                    {competition.name}
                  </option>
                ))}
              </select>
            </div>

            {isBig5 ? (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-offwhite p-4">
                <p className="text-sm font-medium text-charcoal">Big 5 Scope</p>
                <label className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={big5Selection === "all"}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setBig5Selection(checked ? "all" : "custom");
                      if (checked) setSelectedBig5([...BIG5_OPTIONS]);
                    }}
                  />
                  All 5 Leagues
                </label>

                {big5Selection === "custom" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {BIG5_OPTIONS.map((leagueOption) => {
                      const active = selectedBig5.includes(leagueOption);
                      return (
                        <label
                          key={leagueOption}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                            active
                              ? "border-gold bg-gold/10 text-forest"
                              : "border-border bg-card text-charcoal",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleBig5League(leagueOption)}
                          />
                          {leagueOption}
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal">Mode</label>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "draft" | "open_selection")}
                  className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm text-charcoal"
                >
                  <option value="draft">Draft Mode</option>
                  <option value="open_selection">Open Selection Mode</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-charcoal">League Visibility</label>
                <select
                  value={leagueType}
                  onChange={(event) => setLeagueType(event.target.value as "private" | "public")}
                  className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm text-charcoal"
                >
                  <option value="private">Private League</option>
                  <option value="public">Public League</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">Commissioner selection</label>
              <div className="rounded-2xl border border-border/70 bg-offwhite p-3 text-sm text-charcoal">
                You are the default commissioner for this league.
                <p className="mt-1 text-xs text-charcoal/70">You can change this later.</p>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="h-12 w-full rounded-3xl bg-sage text-base font-semibold text-forest hover:bg-sage/80"
              disabled={creating}
              onClick={submitCreateLeague}
            >
              {creating ? "Creating League..." : "Create League"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default MyLeaguesClient;
