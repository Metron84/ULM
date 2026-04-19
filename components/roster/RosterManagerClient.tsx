"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Sparkles } from "lucide-react";

import {
  assistantTemplates,
  assistantFunctionMeta,
} from "@/lib/assistant-templates";
import { personaEmoji, personaLabel, type AssistantPersona } from "@/lib/persona";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type RosterManagerClientProps = {
  persona: AssistantPersona;
  leagueName: string;
  competitionName: string;
  projectedPoints: number;
  startingPlayers: RosterPlayer[];
  benchPlayers: RosterPlayer[];
};

type ContainerType = "starting" | "bench";

type PlayerCardProps = {
  player: RosterPlayer;
  size?: "starting" | "bench";
  onOpenDetails: (player: RosterPlayer) => void;
};

function ratingClass(rating: number) {
  if (rating >= 7.8) return "text-gold";
  if (rating >= 7.0) return "text-forest";
  return "text-charcoal/75";
}

function sortStarting433(players: RosterPlayer[]) {
  const buckets = {
    FWD: players.filter((player) => player.position === "FWD"),
    MID: players.filter((player) => player.position === "MID"),
    DEF: players.filter((player) => player.position === "DEF"),
    GK: players.filter((player) => player.position === "GK"),
  };

  const lineup = [
    ...buckets.FWD.slice(0, 3),
    ...buckets.MID.slice(0, 3),
    ...buckets.DEF.slice(0, 4),
    ...buckets.GK.slice(0, 1),
  ];

  const leftovers = players.filter((player) => !lineup.some((item) => item.id === player.id));
  return [...lineup, ...leftovers].slice(0, 11);
}

function SortablePlayerCard({ player, size = "starting", onOpenDetails }: PlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-3xl border border-border/70 bg-card/95 p-3.5 shadow-soft",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow active:cursor-grabbing",
        isDragging && "scale-[1.02] shadow-glow ring-2 ring-gold/40",
        size === "bench" && "min-w-[140px]",
      )}
      {...attributes}
      onClick={() => onOpenDetails(player)}
    >
      <button
        type="button"
        aria-label={`Drag ${player.name}`}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-offwhite text-charcoal/70"
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-3">
        <Image
          src={player.photoUrl}
          alt={player.name}
          width={56}
          height={56}
          className={cn(
            "h-12 w-12 rounded-2xl object-cover ring-1 ring-border",
            size === "bench" && "h-10 w-10",
          )}
        />
        <div className="min-w-0">
          <p className={cn("truncate font-semibold text-forest", size === "bench" && "text-sm")}>
            {player.name}
          </p>
          <p className={cn("text-xs text-charcoal/70", size === "bench" && "text-[11px]")}>
            {player.position}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-charcoal/70">SofaScore</span>
        <span className={cn("text-sm font-semibold", ratingClass(player.rating))}>
          {player.rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-2 flex gap-1">
        {player.captain && (
          <Badge variant="secondary" className="rounded-xl bg-gold/25 text-gold">
            C ✨
          </Badge>
        )}
        {player.viceCaptain && (
          <Badge variant="secondary" className="rounded-xl bg-sage/45 text-forest">
            VC
          </Badge>
        )}
      </div>
    </article>
  );
}

export function RosterManagerClient({
  persona,
  leagueName,
  competitionName,
  projectedPoints,
  startingPlayers,
  benchPlayers,
}: RosterManagerClientProps) {
  const initialStarting = useMemo(() => sortStarting433(startingPlayers), [startingPlayers]);
  const [starting, setStarting] = useState<RosterPlayer[]>(initialStarting);
  const [bench, setBench] = useState<RosterPlayer[]>(benchPlayers.slice(0, 4));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthMessage, setHealthMessage] = useState(
    assistantTemplates[persona].roster_health[0]!,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  );

  const findContainer = (playerId: string): ContainerType | null => {
    if (starting.some((player) => player.id === playerId)) return "starting";
    if (bench.some((player) => player.id === playerId)) return "bench";
    return null;
  };

  const openHealthSheet = () => {
    const pool = assistantTemplates[persona].roster_health;
    const next = pool[Math.floor(Math.random() * pool.length)]!;
    setHealthMessage(next);
    setHealthOpen(true);
  };

  const askHealthAgain = () => {
    const pool = assistantTemplates[persona].roster_health.filter(
      (template) => template !== healthMessage,
    );
    const source = pool.length > 0 ? pool : assistantTemplates[persona].roster_health;
    const next = source[Math.floor(Math.random() * source.length)]!;
    setHealthMessage(next);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over || active === over) return;

    const activeContainer = findContainer(active);
    const overContainer = findContainer(over);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    if (activeContainer === "starting") {
      const activeIndex = starting.findIndex((player) => player.id === active);
      const overIndex = bench.findIndex((player) => player.id === over);
      if (activeIndex < 0 || overIndex < 0) return;

      const incoming = bench[overIndex]!;
      const outgoing = starting[activeIndex]!;
      const nextStarting = [...starting];
      const nextBench = [...bench];
      nextStarting[activeIndex] = incoming;
      nextBench[overIndex] = outgoing;
      setStarting(nextStarting);
      setBench(nextBench);
      return;
    }

    const activeIndex = bench.findIndex((player) => player.id === active);
    const overIndex = starting.findIndex((player) => player.id === over);
    if (activeIndex < 0 || overIndex < 0) return;

    const incoming = starting[overIndex]!;
    const outgoing = bench[activeIndex]!;
    const nextStarting = [...starting];
    const nextBench = [...bench];
    nextStarting[overIndex] = outgoing;
    nextBench[activeIndex] = incoming;
    setStarting(nextStarting);
    setBench(nextBench);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    setActiveId(null);

    if (!over || active === over) return;
    const activeContainer = findContainer(active);
    const overContainer = findContainer(over);
    if (!activeContainer || !overContainer || activeContainer !== overContainer) return;

    if (activeContainer === "starting") {
      const oldIndex = starting.findIndex((player) => player.id === active);
      const newIndex = starting.findIndex((player) => player.id === over);
      if (oldIndex < 0 || newIndex < 0) return;
      setStarting((prev) => arrayMove(prev, oldIndex, newIndex));
      return;
    }

    const oldIndex = bench.findIndex((player) => player.id === active);
    const newIndex = bench.findIndex((player) => player.id === over);
    if (oldIndex < 0 || newIndex < 0) return;
    setBench((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const pitchRows = [
    { label: "Forwards", players: starting.slice(0, 3), cols: "grid-cols-3" },
    { label: "Midfield", players: starting.slice(3, 6), cols: "grid-cols-3" },
    { label: "Defense", players: starting.slice(6, 10), cols: "grid-cols-4" },
    { label: "Goalkeeper", players: starting.slice(10, 11), cols: "grid-cols-1 max-w-[220px] mx-auto" },
  ] as const;

  const activeFunctionTitle = assistantFunctionMeta.roster_health.title;

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-forest">My Roster</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-charcoal/75">{leagueName}</span>
              <Badge variant="secondary" className="rounded-xl bg-sage/45 text-forest">
                {competitionName}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-charcoal/65">
                Projected this week
              </p>
              <p className="text-2xl font-bold text-gold">{projectedPoints} pts</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-forest shadow-soft",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                )}
              >
                Formation: 4-3-3
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>4-3-3 (Fixed in this demo)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,202,186,0.14),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(212,175,119,0.12),transparent_40%),linear-gradient(rgba(10,61,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(10,61,42,0.05)_1px,transparent_1px)] bg-[size:100%_100%,100%_100%,52px_52px,52px_52px] opacity-60"
        />
        <CardHeader className="relative px-6">
          <CardTitle className="text-forest">Starting XI (4-3-3)</CardTitle>
          <CardDescription>Drag players to reorder or swap with bench.</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-5 px-6 pb-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={starting.map((player) => player.id)}
              strategy={rectSortingStrategy}
            >
              {pitchRows.map((row) => (
                <div key={row.label} className={cn("grid gap-3", row.cols)}>
                  {row.players.map((player) => (
                    <SortablePlayerCard
                      key={player.id}
                      player={player}
                      onOpenDetails={setSelectedPlayer}
                    />
                  ))}
                </div>
              ))}
            </SortableContext>

            <div className="mt-6 rounded-3xl border border-border/70 bg-offwhite/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-forest">
                  Bench ({bench.length} players)
                </h3>
                <span className="text-xs text-charcoal/65">Drag to swap with starters</span>
              </div>

              <div className="overflow-x-auto pb-1">
                <SortableContext
                  items={bench.map((player) => player.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="flex gap-3">
                    {bench.map((player) => (
                      <SortablePlayerCard
                        key={player.id}
                        player={player}
                        size="bench"
                        onOpenDetails={setSelectedPlayer}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            </div>
          </DndContext>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          className="h-12 rounded-3xl bg-sage text-forest hover:bg-sage/80"
          onClick={openHealthSheet}
        >
          Roster Health Check
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-3xl border-border bg-card text-forest hover:bg-offwhite"
          onClick={() => setTransferOpen(true)}
        >
          Make Transfer
        </Button>
      </div>

      <Sheet open={Boolean(selectedPlayer)} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card px-0 pt-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-forest">{selectedPlayer?.name}</SheetTitle>
            <SheetDescription>{selectedPlayer?.position} · Recent performance snapshot</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-6 pb-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-charcoal">
              <p>
                Current SofaScore:{" "}
                <span className={cn("font-semibold", selectedPlayer && ratingClass(selectedPlayer.rating))}>
                  {selectedPlayer?.rating.toFixed(1)}
                </span>
              </p>
              <p className="mt-1">Recent form: {selectedPlayer?.recentForm}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={healthOpen} onOpenChange={setHealthOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card px-0 pt-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-forest">{activeFunctionTitle}</SheetTitle>
            <SheetDescription>
              {personaEmoji(persona)} {personaLabel(persona)} perspective
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm leading-relaxed text-charcoal">
              {healthMessage}
              <span className="ml-2 inline-flex items-center text-gold">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-10 rounded-2xl bg-sage/55 text-forest hover:bg-sage/70"
                onClick={askHealthAgain}
              >
                Ask again
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 rounded-2xl"
                onClick={() => {
                  setHealthOpen(false);
                  window.location.href = "/assistant";
                }}
              >
                Open Assistant
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={transferOpen} onOpenChange={setTransferOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card px-0 pt-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-forest">Transfer Market</SheetTitle>
            <SheetDescription>Preview</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-charcoal">
              Transfer Market is opening soon. You can already prepare swaps in the Trade Market.
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {activeId && (
        <div
          className="pointer-events-none fixed inset-0 z-20 bg-black/0"
          aria-hidden="true"
        />
      )}
    </section>
  );
}

export default RosterManagerClient;
