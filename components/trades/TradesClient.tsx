"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { TradeStatus, TradesPageData } from "@/lib/trades";
import { isFootballRelatedItem } from "@/lib/trade-validation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TradesClientProps = {
  data: TradesPageData;
};

type ActiveTab = "open" | "mine";
type Step = 1 | 2 | 3;

function statusBadge(status: TradeStatus) {
  if (status === "completed") return { label: "Completed", className: "bg-gold/25 text-gold" };
  if (status === "accepted") return { label: "Accepted", className: "bg-primary/45 text-forest" };
  if (status === "commissioner_pending") {
    return { label: "Commissioner Review", className: "bg-primary/45 text-forest" };
  }
  if (status === "rejected") return { label: "Rejected", className: "bg-card text-muted-foreground" };
  return { label: "Proposed", className: "bg-primary/35 text-forest" };
}

function itemLabel(item: { playerName: string | null; description: string | null; itemType: string }) {
  if (item.itemType === "player") return item.playerName ?? "Player";
  return item.description ?? "Football item";
}

export function TradesClient({ data }: TradesClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("open");
  const [proposeOpen, setProposeOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [selectedOfferPlayers, setSelectedOfferPlayers] = useState<string[]>([]);
  const [selectedTargetParticipantId, setSelectedTargetParticipantId] = useState<string>(
    data.managerTargets[0]?.participantId ?? "",
  );
  const [selectedRequestPlayers, setSelectedRequestPlayers] = useState<string[]>([]);
  const [offeringItem, setOfferingItem] = useState("");
  const [requestingItem, setRequestingItem] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [tradeSparkle, setTradeSparkle] = useState(false);
  const [commissionComments, setCommissionComments] = useState<Record<string, string>>({});
  const [actingTradeId, setActingTradeId] = useState<string | null>(null);

  const targetManager = useMemo(
    () =>
      data.managerTargets.find((target) => target.participantId === selectedTargetParticipantId) ??
      data.managerTargets[0] ??
      null,
    [data.managerTargets, selectedTargetParticipantId],
  );

  const visibleTrades = useMemo(() => {
    if (tab === "mine") {
      return data.trades.filter((trade) => trade.proposerId === data.currentUserId);
    }
    return data.trades.filter((trade) =>
      trade.status === "proposed" ||
      trade.status === "commissioner_pending" ||
      trade.status === "accepted",
    );
  }, [data.currentUserId, data.trades, tab]);

  const openCount = useMemo(
    () =>
      data.trades.filter(
        (trade) =>
          trade.status === "proposed" ||
          trade.status === "commissioner_pending" ||
          trade.status === "accepted",
      ).length,
    [data.trades],
  );
  const myProposalsCount = useMemo(
    () => data.trades.filter((trade) => trade.proposerId === data.currentUserId).length,
    [data.trades, data.currentUserId],
  );

  const toggleSelection = (
    current: string[],
    setCurrent: (next: string[]) => void,
    playerId: string,
  ) => {
    if (current.includes(playerId)) {
      setCurrent(current.filter((id) => id !== playerId));
      return;
    }
    setCurrent([...current, playerId]);
  };

  const resetProposal = () => {
    setStep(1);
    setSelectedOfferPlayers([]);
    setSelectedRequestPlayers([]);
    setOfferingItem("");
    setRequestingItem("");
    setMessage("");
    setSelectedTargetParticipantId(data.managerTargets[0]?.participantId ?? "");
  };

  const goToStep = (targetStep: Step) => {
    setStepLoading(true);
    window.setTimeout(() => {
      setStep(targetStep);
      setStepLoading(false);
    }, 180);
  };

  const submitTrade = async () => {
    if (!targetManager) {
      toast.error("Select a manager before sending.");
      return;
    }
    if (
      selectedOfferPlayers.length === 0 &&
      selectedRequestPlayers.length === 0 &&
      !offeringItem.trim() &&
      !requestingItem.trim()
    ) {
      toast.error("Add at least one trade item.");
      return;
    }

    if (
      (offeringItem.trim() && !isFootballRelatedItem(offeringItem)) ||
      (requestingItem.trim() && !isFootballRelatedItem(requestingItem))
    ) {
      toast.error(
        "Only football-related items allowed (jerseys, tickets, memorabilia ✓)",
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId: data.leagueId,
          receiverParticipantId: targetManager.participantId,
          offeringPlayerIds: selectedOfferPlayers,
          requestingPlayerIds: selectedRequestPlayers,
          offeringFootballItem: offeringItem.trim(),
          requestingFootballItem: requestingItem.trim(),
          message: message.trim(),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not send trade.");
      }

      toast.success("Trade sent to commissioner ✨", {
        description: "Proposal submitted in premium mode.",
      });
      setTradeSparkle(true);
      window.setTimeout(() => setTradeSparkle(false), 900);
      setProposeOpen(false);
      resetProposal();
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Trade submit failed.";
      toast.error("Could not send trade", { description: text });
    } finally {
      setSubmitting(false);
    }
  };

  const updateTradeStatus = async (tradeId: string, action: "approve" | "reject") => {
    try {
      setActingTradeId(tradeId);
      const response = await fetch(`/api/trades/${tradeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: commissionComments[tradeId] ?? "",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not update trade.");
      }
      toast.success(
        action === "approve"
          ? "Trade approved ✨"
          : "Trade rejected",
      );
      if (action === "approve") {
        setTradeSparkle(true);
        window.setTimeout(() => setTradeSparkle(false), 900);
      }
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Trade action failed.";
      toast.error("Could not update trade", { description: text });
    } finally {
      setActingTradeId(null);
    }
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <h2 className="text-3xl font-bold tracking-tight text-forest">Trades & Agreements</h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Football-only • Commissioner approved
        </p>
      </header>

      <div className="flex gap-2 rounded-3xl border border-border/70 bg-card/85 p-2 shadow-soft">
        <button
          type="button"
          onClick={() => setTab("open")}
          className={cn(
            "flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition",
            tab === "open" ? "bg-primary/45 text-forest" : "text-muted-foreground hover:bg-offwhite",
          )}
        >
          Open Trades
          <span className="ml-1 text-xs">({openCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={cn(
            "flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition",
            tab === "mine" ? "bg-gold/20 text-forest" : "text-muted-foreground hover:bg-offwhite",
          )}
        >
          My Proposals
          <span className="ml-1 text-xs">({myProposalsCount})</span>
        </button>
      </div>

      <div className="space-y-4">
        {visibleTrades.length === 0 ? (
          <Card className="rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
            <CardContent className="px-6 text-sm text-muted-foreground">
                {tab === "open"
                  ? "No open trades right now."
                  : "You have not sent any proposals yet."}
            </CardContent>
          </Card>
        ) : (
          visibleTrades.map((trade) => {
            const badge = statusBadge(trade.status);
            return (
              <Card key={trade.id} className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
                <CardHeader className="px-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base text-forest">
                      {trade.proposerTeamName} → {trade.receiverTeamName}
                    </CardTitle>
                    <Badge variant="secondary" className={cn("rounded-xl", badge.className)}>
                      {badge.label}
                    </Badge>
                  </div>
                  {trade.message && (
                    <CardDescription className="text-muted-foreground">
                      {trade.message}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 px-6 text-sm">
                  <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Offering
                    </p>
                    <p className="mt-1 text-foreground">
                      {trade.offering.length > 0
                        ? trade.offering.map((item) => itemLabel(item)).join(" • ")
                        : "None"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-offwhite p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Requesting
                    </p>
                    <p className="mt-1 text-foreground">
                      {trade.requesting.length > 0
                        ? trade.requesting.map((item) => itemLabel(item)).join(" • ")
                        : "None"}
                    </p>
                  </div>

                  {data.isCommissioner &&
                    (trade.status === "proposed" || trade.status === "commissioner_pending") && (
                      <div className="rounded-2xl border border-border/70 bg-card p-3">
                        <label className="text-xs text-muted-foreground">Commissioner comment</label>
                        <textarea
                          value={commissionComments[trade.id] ?? ""}
                          onChange={(event) =>
                            setCommissionComments((prev) => ({
                              ...prev,
                              [trade.id]: event.target.value,
                            }))
                          }
                          className="mt-2 h-20 w-full rounded-xl border border-border bg-offwhite px-3 py-2 text-sm"
                          placeholder="Optional note..."
                        />
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="h-9 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={actingTradeId === trade.id}
                            onClick={() => updateTradeStatus(trade.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-2xl"
                            disabled={actingTradeId === trade.id}
                            onClick={() => updateTradeStatus(trade.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => setProposeOpen(true)}
        className={cn(
          "fixed bottom-28 right-6 z-40 inline-flex h-14 items-center gap-2 rounded-3xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow",
          "transition hover:-translate-y-0.5 hover:bg-primary/85",
        )}
      >
        <Plus className="h-4 w-4 text-gold" />
        Propose Trade
        {tradeSparkle ? <Sparkles className="h-3.5 w-3.5 text-gold gold-sparkle" /> : null}
      </button>

      <Sheet open={proposeOpen} onOpenChange={setProposeOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card px-0 pt-0 shadow-glow">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-forest">Propose Trade</SheetTitle>
            <SheetDescription>
              Step {step} of 3 • Calm market negotiations
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 pb-6">
            {stepLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-36 rounded-xl bg-primary/25" />
                <Skeleton className="h-16 w-full rounded-2xl bg-primary/20" />
                <Skeleton className="h-16 w-full rounded-2xl bg-primary/20" />
              </div>
            ) : null}

            {!stepLoading && step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-forest">What you&apos;re offering</p>
                <div className="grid grid-cols-2 gap-2">
                  {data.currentRosterPlayers.map((player) => (
                    <button
                      type="button"
                      key={player.id}
                      onClick={() =>
                        toggleSelection(selectedOfferPlayers, setSelectedOfferPlayers, player.id)
                      }
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-left text-sm",
                        selectedOfferPlayers.includes(player.id)
                          ? "border-gold bg-gold/10 text-forest"
                          : "border-border bg-offwhite text-foreground",
                      )}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
                <label className="text-xs text-muted-foreground">Optional football item</label>
                <input
                  value={offeringItem}
                  onChange={(event) => setOfferingItem(event.target.value)}
                  placeholder="Signed Mbappé jersey"
                  className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm"
                />
                <Button
                  type="button"
                  className="h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => goToStep(2)}
                >
                  Continue
                </Button>
              </div>
            )}

            {!stepLoading && step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-forest">What you want</p>
                <select
                  value={selectedTargetParticipantId}
                  onChange={(event) => {
                    setSelectedTargetParticipantId(event.target.value);
                    setSelectedRequestPlayers([]);
                  }}
                  className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm text-foreground"
                >
                  {data.managerTargets.map((target) => (
                    <option key={target.participantId} value={target.participantId}>
                      {target.teamName} ({target.managerName})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  {(targetManager?.players ?? []).map((player) => (
                    <button
                      type="button"
                      key={player.id}
                      onClick={() =>
                        toggleSelection(
                          selectedRequestPlayers,
                          setSelectedRequestPlayers,
                          player.id,
                        )
                      }
                      className={cn(
                        "rounded-2xl border px-3 py-2 text-left text-sm",
                        selectedRequestPlayers.includes(player.id)
                          ? "border-gold bg-gold/10 text-forest"
                          : "border-border bg-offwhite text-foreground",
                      )}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
                <label className="text-xs text-muted-foreground">Optional football item request</label>
                <input
                  value={requestingItem}
                  onChange={(event) => setRequestingItem(event.target.value)}
                  placeholder="World Cup final ticket"
                  className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-10 rounded-2xl" onClick={() => goToStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => goToStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {!stepLoading && step === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-forest">Review & Message</p>
                <div className="rounded-2xl border border-border/70 bg-offwhite p-3 text-sm text-foreground">
                  <p>
                    Offering:{" "}
                    {selectedOfferPlayers.length > 0
                      ? selectedOfferPlayers
                          .map(
                            (id) =>
                              data.currentRosterPlayers.find((player) => player.id === id)?.name ?? id,
                          )
                          .join(" • ")
                      : "None"}
                    {offeringItem.trim() && ` • ${offeringItem.trim()}`}
                  </p>
                  <p className="mt-2">
                    Requesting:{" "}
                    {selectedRequestPlayers.length > 0
                      ? selectedRequestPlayers
                          .map(
                            (id) => targetManager?.players.find((player) => player.id === id)?.name ?? id,
                          )
                          .join(" • ")
                      : "None"}
                    {requestingItem.trim() && ` • ${requestingItem.trim()}`}
                  </p>
                </div>

                {(offeringItem.trim() && !isFootballRelatedItem(offeringItem)) ||
                (requestingItem.trim() && !isFootballRelatedItem(requestingItem)) ? (
                  <div className="rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm text-forest">
                    Only football-related items allowed (jerseys, tickets, memorabilia ✓)
                  </div>
                ) : null}

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Optional message to commissioner..."
                  className="h-24 w-full rounded-2xl border border-border bg-offwhite px-3 py-2 text-sm"
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-10 rounded-2xl" onClick={() => goToStep(2)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={submitTrade}
                    disabled={submitting}
                  >
                    {submitting ? "Sending..." : "Send to Commissioner"}
                    <Sparkles className="ml-1 h-4 w-4 text-gold" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default TradesClient;
