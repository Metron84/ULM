"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { personaLabel, type AssistantPersona } from "@/lib/persona";
import type { RosterPlayer } from "@/lib/roster";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type RosterManagerClientProps = {
  persona: AssistantPersona;
  rosterId: string;
  leagueName: string;
  competitionName: string;
  squadSize: number;
  benchCapacity: number;
  totalTeamPoints: number;
  projectedPointsThisMatchday: number;
  startingPlayers: RosterPlayer[];
  benchPlayers: RosterPlayer[];
  availablePlayers: Array<{
    id: string;
    name: string;
    position: "GK" | "DEF" | "MID" | "FWD";
    photoUrl: string;
    nationality: string | null;
    countryFlag: string;
    leagueCode: string | null;
    leagueAccent: "premier" | "bundesliga" | "laliga" | "seriea" | "ligue1" | "worldcup";
    isWorldCup: boolean;
    competitionName: string;
    rating: number;
    recentForm: string;
    totalPoints: number;
    inRoster: boolean;
    inStarting: boolean;
  }>;
};

type PlayerCardProps = {
  player: RosterPlayer;
  onOpenDetails: (player: RosterPlayer) => void;
  onAssignRole: (playerId: string, role: "captain" | "vice_captain") => Promise<void>;
  assigningRole: boolean;
  isSelectedSwapTarget: boolean;
  onToggleSwapTarget: (playerId: string) => void;
};

function ratingClass(rating: number) {
  if (rating >= 7.8) return "text-gold";
  if (rating >= 7.0) return "text-forest";
  return "text-muted-foreground";
}

function leagueAccentClass(accent: RosterPlayer["leagueAccent"]) {
  if (accent === "premier") return "border-sky-200 bg-sky-50/60";
  if (accent === "bundesliga") return "border-rose-200 bg-rose-50/60";
  if (accent === "laliga") return "border-violet-200 bg-violet-50/60";
  if (accent === "seriea") return "border-emerald-200 bg-emerald-50/60";
  if (accent === "ligue1") return "border-orange-200 bg-orange-50/60";
  return "border-gold/35 bg-gold/10";
}

function SortablePlayerCard({
  player,
  onOpenDetails,
  onAssignRole,
  assigningRole,
  isSelectedSwapTarget,
  onToggleSwapTarget,
}: PlayerCardProps) {
  return (
    <article
      className={cn(
        "rounded-3xl border p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow",
        leagueAccentClass(player.leagueAccent),
        isSelectedSwapTarget && "ring-2 ring-gold",
      )}
    >
      <div className="flex items-center gap-3">
        <Image
          src={player.photoUrl}
          alt={player.name}
          width={56}
          height={56}
          className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-forest">
            {player.isWorldCup ? `${player.countryFlag} ` : null}
            {player.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {player.position} • {player.competitionName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">SofaScore</span>
        <span className={cn("text-sm font-semibold", ratingClass(player.rating))}>
          {player.rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {player.isWorldCup ? (
          <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
            World Cup
          </Badge>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-8 items-center rounded-xl border border-border bg-offwhite px-2.5 text-[11px] font-semibold",
              "text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70",
            )}
            disabled={assigningRole}
          >
            {player.captain ? "C" : player.viceCaptain ? "VC" : "Set C/VC"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => onAssignRole(player.id, "captain")}
              disabled={player.captain || assigningRole}
            >
              Confirm Captain
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAssignRole(player.id, "vice_captain")}
              disabled={player.viceCaptain || assigningRole}
            >
              Confirm Vice-Captain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 rounded-xl", isSelectedSwapTarget && "border-gold text-gold")}
          onClick={() => onToggleSwapTarget(player.id)}
        >
          {isSelectedSwapTarget ? "Swap Target Selected" : "Select as Swap Target"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl px-2.5 text-forest hover:bg-offwhite"
          onClick={() => onOpenDetails(player)}
        >
          Details
        </Button>
      </div>
    </article>
  );
}

export function RosterManagerClient({
  persona,
  rosterId,
  leagueName,
  competitionName,
  squadSize,
  benchCapacity,
  totalTeamPoints,
  projectedPointsThisMatchday,
  startingPlayers,
  benchPlayers,
  availablePlayers,
}: RosterManagerClientProps) {
  const router = useRouter();
  const [starting, setStarting] = useState<RosterPlayer[]>(startingPlayers);
  const [bench, setBench] = useState<RosterPlayer[]>(benchPlayers.slice(0, benchCapacity));
  const [selectedSwapTargetId, setSelectedSwapTargetId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<"ALL" | "GK" | "DEF" | "MID" | "FWD">("ALL");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);

  const openPlayerDetails = (player: RosterPlayer) => {
    setShowBreakdown(false);
    setSelectedPlayer(player);
  };

  const benchSpotsLeft = Math.max(0, benchCapacity - bench.length);

  const captainPlayer = [...starting, ...bench].find((player) => player.captain) ?? null;
  const captainBoost = captainPlayer ? Math.round(captainPlayer.rating * 1.8) : 0;

  const handleAssignRole = async (playerId: string, role: "captain" | "vice_captain") => {
    try {
      setAssigningRole(true);
      const response = await fetch("/api/roster/captain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterId, playerId, role }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not update role.");
      }

      const applyRole = (player: RosterPlayer) => {
        if (role === "captain") {
          return {
            ...player,
            captain: player.id === playerId,
            viceCaptain: player.id === playerId ? false : player.viceCaptain,
          };
        }
        return {
          ...player,
          viceCaptain: player.id === playerId,
          captain: player.id === playerId ? false : player.captain,
        };
      };
      setStarting((prev) => prev.map(applyRole));
      setBench((prev) => prev.map(applyRole));
      toast.success(
        role === "captain"
          ? "Captain assigned with confidence"
          : "Vice-captain assigned for cover",
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Role update failed");
    } finally {
      setAssigningRole(false);
    }
  };

  const filteredPool = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return availablePlayers.filter((player) => {
      const matchesPosition = positionFilter === "ALL" || player.position === positionFilter;
      const matchesQuery =
        normalized.length === 0 ||
        player.name.toLowerCase().includes(normalized) ||
        player.position.toLowerCase().includes(normalized);
      return matchesPosition && matchesQuery;
    });
  }, [availablePlayers, positionFilter, searchQuery]);

  const handleAddToBench = async (playerId: string) => {
    try {
      setSubmittingAction(true);
      const response = await fetch("/api/roster/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_to_roster", rosterId, playerId }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not add player.");
      }
      toast.success("Player added to roster");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Add failed");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSwapPlayer = async (incomingPlayerId: string) => {
    if (!selectedSwapTargetId) {
      toast.error("Select a roster player as swap target first.");
      return;
    }
    try {
      setSubmittingAction(true);
      const response = await fetch("/api/roster/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "swap_with_starter",
          outgoingPlayerId: selectedSwapTargetId,
          rosterId,
          incomingPlayerId,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not complete swap.");
      }
      toast.success("Starter swapped successfully");
      setSelectedSwapTargetId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap failed");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-5">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-forest">My Roster</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{leagueName}</span>
              <Badge variant="secondary" className="rounded-xl bg-primary/45 text-forest">
                {competitionName}
              </Badge>
              <Badge variant="secondary" className="rounded-xl bg-offwhite text-forest">
                Assistant: {personaLabel(persona)}
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Team Points</p>
            <p className="text-2xl font-bold text-gold">{totalTeamPoints}</p>
            <p className="text-sm text-muted-foreground">
              Projected Points This Matchday:{" "}
              <span className="font-semibold text-forest">{projectedPointsThisMatchday}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-xl bg-offwhite text-forest">
            Squad size: {starting.length + bench.length}/{squadSize}
          </Badge>
          <Badge variant="secondary" className="rounded-xl bg-offwhite text-forest">
            Bench spots left: {benchSpotsLeft}
          </Badge>
          <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
            Captain boost projection: +{captainBoost} pts
          </Badge>
          <Button
            type="button"
            className="ml-auto h-12 rounded-3xl bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => setManageOpen(true)}
          >
            Manage Squad
          </Button>
        </div>
      </header>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Starting XI</CardTitle>
          <CardDescription>Core starters first, bench depth below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          {starting.map((player) => (
            <SortablePlayerCard
              key={player.id}
              player={player}
              onOpenDetails={openPlayerDetails}
              onAssignRole={handleAssignRole}
              assigningRole={assigningRole}
              isSelectedSwapTarget={selectedSwapTargetId === player.id}
              onToggleSwapTarget={(playerId) =>
                setSelectedSwapTargetId((current) => (current === playerId ? null : playerId))
              }
            />
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Bench</CardTitle>
          <CardDescription>{bench.length} players available for rotation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          {bench.map((player) => (
            <SortablePlayerCard
              key={player.id}
              player={player}
              onOpenDetails={openPlayerDetails}
              onAssignRole={handleAssignRole}
              assigningRole={assigningRole}
              isSelectedSwapTarget={selectedSwapTargetId === player.id}
              onToggleSwapTarget={(playerId) =>
                setSelectedSwapTargetId((current) => (current === playerId ? null : playerId))
              }
            />
          ))}
        </CardContent>
      </Card>

      <Sheet open={Boolean(selectedPlayer)} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card px-0 pt-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-forest">{selectedPlayer?.name}</SheetTitle>
            <SheetDescription>{selectedPlayer?.position} · Recent performance snapshot</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-6 pb-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-foreground">
              <p>
                Current SofaScore:{" "}
                <span className={cn("font-semibold", selectedPlayer && ratingClass(selectedPlayer.rating))}>
                  {selectedPlayer?.rating.toFixed(1)}
                </span>
              </p>
              <p className="mt-1">Recent form: {selectedPlayer?.recentForm}</p>
              <Button
                type="button"
                variant="ghost"
                className="mt-3 h-8 rounded-xl px-0 text-forest hover:bg-transparent hover:text-forest"
                onClick={() => setShowBreakdown((prev) => !prev)}
              >
                {showBreakdown ? "Hide points breakdown" : "Show points breakdown"}
              </Button>
              {showBreakdown && selectedPlayer ? (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-card/85 p-3 text-xs text-foreground/85">
                  <p>Goals: {selectedPlayer.pointsBreakdown.goals}</p>
                  <p>Assists: {selectedPlayer.pointsBreakdown.assists}</p>
                  <p>Bonus: {selectedPlayer.pointsBreakdown.bonusPoints}</p>
                  <p>Appearances: {selectedPlayer.pointsBreakdown.appearances}</p>
                  <p>Avg Rating: {selectedPlayer.pointsBreakdown.averageRating.toFixed(2)}</p>
                  <p className="font-semibold text-forest">
                    Total Points: {selectedPlayer.pointsBreakdown.totalPoints}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden rounded-3xl border border-border/70 bg-card p-0 shadow-glow">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle className="text-xl text-forest">Manage Squad</DialogTitle>
            <DialogDescription>
              Search all available players and add to roster or swap with your selected player.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search players by name"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none ring-0 focus:border-gold"
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
              {selectedSwapTargetId ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Swap target selected. Choose a player card and click swap.
                </p>
              ) : null}
            </div>

            <div className="max-h-[58vh] overflow-y-auto pr-1">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPool.map((player) => {
                  const canAdd = !player.inRoster && benchSpotsLeft > 0;
                  return (
                    <article
                      key={player.id}
                      className="rounded-2xl border border-border/70 bg-offwhite p-3 shadow-soft"
                    >
                      <div className="flex gap-3">
                        <Image
                          src={player.photoUrl}
                          alt={player.name}
                          width={52}
                          height={52}
                          className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-forest">
                            {player.isWorldCup ? `${player.countryFlag} ` : null}
                            {player.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {player.position} • {player.competitionName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rating {player.rating.toFixed(1)} • {player.totalPoints} pts
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{player.recentForm}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {player.inRoster ? (
                          <Badge variant="secondary" className="rounded-xl bg-primary/40 text-forest">
                            In Roster
                          </Badge>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                              disabled={!canAdd || submittingAction}
                              onClick={() => handleAddToBench(player.id)}
                            >
                              Add to Roster
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-xl"
                              disabled={submittingAction || !selectedSwapTargetId}
                              onClick={() => handleSwapPlayer(player.id)}
                            >
                              {selectedSwapTargetId ? "Swap with Selected Player" : "Select swap target first"}
                            </Button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              {filteredPool.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-muted-foreground">
                  No players match your current filters.
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </section>
  );
}

export default RosterManagerClient;
