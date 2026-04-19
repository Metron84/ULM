"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import type { DraftBoardData, DraftPlayer } from "@/lib/draft";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DraftBoardClientProps = {
  data: DraftBoardData;
};

type PositionFilter = "ALL" | "GK" | "DEF" | "MID" | "FWD";

function pickOwnerForIndex(pickIndex: number, totalTeams: number) {
  const round = Math.floor((pickIndex - 1) / totalTeams) + 1;
  const withinRound = ((pickIndex - 1) % totalTeams) + 1;
  const isEvenRound = round % 2 === 0;
  return isEvenRound ? totalTeams - withinRound + 1 : withinRound;
}

export function DraftBoardClient({ data }: DraftBoardClientProps) {
  const [availablePlayers, setAvailablePlayers] = useState<DraftPlayer[]>(data.players);
  const [draftedPlayers, setDraftedPlayers] = useState<DraftPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [currentPickIndex, setCurrentPickIndex] = useState(data.draftPosition);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [sparkleBurst, setSparkleBurst] = useState(false);

  const currentRound = Math.min(
    data.totalRounds,
    Math.floor((currentPickIndex - 1) / data.totalTeams) + 1,
  );
  const totalPicks = data.totalRounds * data.totalTeams;
  const isDraftComplete = draftedPlayers.length >= data.totalRounds || currentPickIndex > totalPicks;
  const currentOwner = pickOwnerForIndex(currentPickIndex, data.totalTeams);
  const isUsersTurn = currentOwner === data.draftPosition && !isDraftComplete;

  const filteredPlayers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return availablePlayers.filter((player) => {
      const matchesPosition =
        positionFilter === "ALL" ? true : player.position === positionFilter;
      const matchesQuery =
        normalized.length === 0 ||
        player.name.toLowerCase().includes(normalized) ||
        player.position.toLowerCase().includes(normalized);
      return matchesPosition && matchesQuery;
    });
  }, [availablePlayers, positionFilter, searchQuery]);

  const projectedTotal = draftedPlayers.reduce((sum, player) => sum + player.projectedPoints, 0);

  const advanceToNextUserTurn = useCallback((nextPickIndex: number, nextPool: DraftPlayer[]) => {
    let pointer = nextPickIndex;
    let localPool = [...nextPool];

    while (pointer <= totalPicks && pickOwnerForIndex(pointer, data.totalTeams) !== data.draftPosition) {
      const botPick = [...localPool].sort((a, b) => b.rating - a.rating)[0] ?? null;
      if (!botPick) break;
      localPool = localPool.filter((player) => player.id !== botPick.id);
      pointer += 1;
    }

    setAvailablePlayers(localPool);
    setCurrentPickIndex(pointer);
  }, [data.draftPosition, data.totalTeams, totalPicks]);

  const handlePick = useCallback((player: DraftPlayer, isAutoPick = false) => {
    if (!isUsersTurn || isDraftComplete) return;
    if (!availablePlayers.some((candidate) => candidate.id === player.id)) return;

    const poolAfterUserPick = availablePlayers.filter((candidate) => candidate.id !== player.id);
    setDraftedPlayers((current) => [...current, player]);
    setSecondsLeft(60);
    setSparkleBurst(true);
    window.setTimeout(() => setSparkleBurst(false), 900);

    toast.success(isAutoPick ? "Auto pick locked ✓" : "Pick locked ✓", {
      description: `${player.name} added to your draft board.`,
    });

    advanceToNextUserTurn(currentPickIndex + 1, poolAfterUserPick);
  }, [
    isUsersTurn,
    isDraftComplete,
    availablePlayers,
    currentPickIndex,
    advanceToNextUserTurn,
  ]);

  useEffect(() => {
    if (!isUsersTurn || isDraftComplete) return;
    if (secondsLeft <= 0) {
      const topPlayer = [...availablePlayers].sort((a, b) => b.rating - a.rating)[0] ?? null;
      if (topPlayer) {
        const autoPickTimer = window.setTimeout(() => {
          handlePick(topPlayer, true);
        }, 0);
        return () => window.clearTimeout(autoPickTimer);
      }
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft, isUsersTurn, isDraftComplete, availablePlayers, handlePick]);

  const autoPickForMe = () => {
    const bestPlayer = [...availablePlayers].sort((a, b) => b.rating - a.rating)[0] ?? null;
    if (!bestPlayer) return;
    handlePick(bestPlayer, true);
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <h2 className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
          Draft Board - Round {currentRound} of {data.totalRounds} • Your Pick #{data.draftPosition}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-xl bg-offwhite text-forest">
            {data.leagueName}
          </Badge>
          <Badge variant="secondary" className="rounded-xl bg-primary/45 text-forest">
            Draft Mode
          </Badge>
          <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
            {data.competitionName}
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr_1.1fr]">
        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">Available Players Pool</CardTitle>
            <CardDescription>Search, filter, and lock your next pick.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search player name..."
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((position) => (
                  <Button
                    key={position}
                    type="button"
                    size="sm"
                    variant={positionFilter === position ? "default" : "outline"}
                    className={cn(
                      "h-8 rounded-xl px-3",
                      positionFilter === position
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-card text-foreground",
                    )}
                    onClick={() => setPositionFilter(position)}
                  >
                    {position === "ALL" ? "All" : position}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredPlayers.map((player) => (
                <article
                  key={player.id}
                  className="rounded-2xl border border-border/70 bg-offwhite p-3 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={player.photoUrl}
                      alt={player.name}
                      width={52}
                      height={52}
                      className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-forest">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>SofaScore</span>
                    <span className="font-semibold text-forest">{player.rating.toFixed(1)}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 h-9 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!isUsersTurn || isDraftComplete}
                    onClick={() => handlePick(player)}
                  >
                    Pick This Player
                  </Button>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">Draft Status</CardTitle>
            <CardDescription>Current round, pick flow, and timer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-center">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Round</p>
              <p className="mt-1 text-3xl font-bold text-forest">{currentRound}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-center">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current Pick</p>
              <p className="mt-1 text-3xl font-bold text-gold">#{currentPickIndex}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-center">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">On The Clock</p>
              <p className="mt-1 text-3xl font-bold text-forest">{secondsLeft}s</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isDraftComplete
                  ? "Draft complete"
                  : isUsersTurn
                    ? "Your Turn"
                    : "Waiting for other picks"}
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              className="h-11 w-full rounded-2xl bg-gold/30 text-forest hover:bg-gold/40"
              disabled={!isUsersTurn || isDraftComplete}
              onClick={autoPickForMe}
            >
              Auto Pick for Me
              {sparkleBurst ? <Sparkles className="ml-1 h-4 w-4 text-gold gold-sparkle" /> : null}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">Your Drafted Players</CardTitle>
            <CardDescription>Running roster for this draft session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite px-3 py-2">
              <p className="text-xs text-muted-foreground">Projected Total</p>
              <p className="text-xl font-bold text-gold">{projectedTotal} pts</p>
            </div>
            <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
              {draftedPlayers.length === 0 ? (
                <p className="rounded-2xl border border-border/70 bg-offwhite p-3 text-sm text-muted-foreground">
                  No picks yet. Start drafting from the player pool.
                </p>
              ) : (
                draftedPlayers.map((player, index) => (
                  <article
                    key={player.id}
                    className="rounded-2xl border border-border/70 bg-offwhite px-3 py-2"
                  >
                    <p className="text-xs text-muted-foreground">Pick {index + 1}</p>
                    <p className="font-semibold text-forest">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.position} • {player.projectedPoints} projected pts
                    </p>
                  </article>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default DraftBoardClient;
