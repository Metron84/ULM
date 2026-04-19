"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CommissionerPortalData } from "@/lib/leagues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CommissionerPortalClientProps = {
  data: CommissionerPortalData;
};

function tradeBadge(status: CommissionerPortalData["pendingTrades"][number]["status"]) {
  if (status === "commissioner_pending") {
    return "bg-primary/45 text-forest";
  }
  return "bg-gold/25 text-gold";
}

export function CommissionerPortalClient({ data }: CommissionerPortalClientProps) {
  const router = useRouter();
  const [rulesText, setRulesText] = useState(data.customRules);
  const [leagueName, setLeagueName] = useState(data.leagueName);
  const [leagueMode, setLeagueMode] = useState<"draft" | "open_selection">(data.leagueMode);
  const [savingRules, setSavingRules] = useState(false);
  const [savingLeagueSettings, setSavingLeagueSettings] = useState(false);
  const [actingTradeId, setActingTradeId] = useState<string | null>(null);
  const [tradeComments, setTradeComments] = useState<Record<string, string>>({});
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);

  const updateTrade = async (tradeId: string, action: "approve" | "reject") => {
    try {
      setActingTradeId(tradeId);
      const response = await fetch(`/api/trades/${tradeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: tradeComments[tradeId] ?? "",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not process trade.");
      }
      toast.success(action === "approve" ? "Trade approved" : "Trade rejected");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trade action failed");
    } finally {
      setActingTradeId(null);
    }
  };

  const removeParticipant = async (participantId: string) => {
    try {
      setRemovingParticipantId(participantId);
      const response = await fetch(
        `/api/leagues/${data.leagueId}/participants/${participantId}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not remove participant.");
      }
      toast.success("Participant removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Removal failed");
    } finally {
      setRemovingParticipantId(null);
    }
  };

  const saveRules = async () => {
    try {
      setSavingRules(true);
      const response = await fetch(`/api/leagues/${data.leagueId}/commissioner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customRules: rulesText }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not save rules.");
      }
      toast.success("League rules saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rules update failed");
    } finally {
      setSavingRules(false);
    }
  };

  const saveLeagueSettings = async () => {
    if (!leagueName.trim()) {
      toast.error("League name is required.");
      return;
    }
    try {
      setSavingLeagueSettings(true);
      const response = await fetch(`/api/leagues/${data.leagueId}/commissioner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueName: leagueName.trim(),
          mode: leagueMode,
          customRules: rulesText,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not save league settings.");
      }
      toast.success("League settings updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "League settings update failed");
    } finally {
      setSavingLeagueSettings(false);
    }
  };

  const inviteUrl =
    data.inviteCode && typeof window !== "undefined"
      ? `${window.location.origin}/signup?invite=${data.inviteCode}`
      : data.inviteCode
        ? `/signup?invite=${data.inviteCode}`
        : null;

  return (
    <section className="space-y-5 sm:space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/leagues" className="font-medium text-forest/80 hover:text-forest">
          My Leagues
        </Link>{" "}
        <span className="px-1">→</span>
        <Link
          href={`/leagues/${data.leagueId}`}
          className="font-medium text-forest/80 hover:text-forest"
        >
          {data.leagueName}
        </Link>{" "}
        <span className="px-1">→</span>
        <span className="font-semibold text-forest">Commissioner Portal</span>
      </nav>

      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-forest">
              Commissioner Portal - {data.leagueName}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Manage your league
            </p>
          </div>
          <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
            Commissioner Access
          </Badge>
        </div>
      </header>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Pending Trades</CardTitle>
          <CardDescription>Review proposals and resolve trade outcomes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          {data.pendingTrades.length === 0 ? (
            <p className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-muted-foreground">
              No trades waiting for commissioner action.
            </p>
          ) : (
            data.pendingTrades.map((trade) => (
              <article key={trade.id} className="rounded-2xl border border-border/70 bg-offwhite p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-forest">
                    Proposer: {trade.proposerTeam} → Receiver: {trade.receiverTeam}
                  </p>
                  <Badge variant="secondary" className={cn("rounded-xl", tradeBadge(trade.status))}>
                    {trade.status === "commissioner_pending" ? "Commissioner Review" : "Proposed"}
                  </Badge>
                </div>
                {trade.message ? (
                  <p className="mt-2 text-sm text-muted-foreground">{trade.message}</p>
                ) : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Offered</p>
                    <p className="mt-1 text-sm text-foreground">
                      {trade.offering.length > 0 ? trade.offering.join(" • ") : "None"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Requested</p>
                    <p className="mt-1 text-sm text-foreground">
                      {trade.requesting.length > 0 ? trade.requesting.join(" • ") : "None"}
                    </p>
                  </div>
                </div>
                <textarea
                  value={tradeComments[trade.id] ?? ""}
                  onChange={(event) =>
                    setTradeComments((prev) => ({ ...prev, [trade.id]: event.target.value }))
                  }
                  placeholder="Optional commissioner note..."
                  className="mt-3 h-20 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={actingTradeId === trade.id}
                    onClick={() => updateTrade(trade.id, "approve")}
                  >
                    Approve Trade
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-2xl"
                    disabled={actingTradeId === trade.id}
                    onClick={() => updateTrade(trade.id, "reject")}
                  >
                    Reject Trade
                  </Button>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Participants</CardTitle>
          <CardDescription>Member list, invite tools, and demo management actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          {data.inviteCode ? (
            <div className="rounded-2xl border border-border/70 bg-card p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Invite Link</p>
              <p className="mt-1 break-all text-sm text-forest">
                {inviteUrl ?? `Code: ${data.inviteCode}`}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-8 rounded-xl"
                onClick={async () => {
                  if (!inviteUrl) return;
                  await navigator.clipboard.writeText(inviteUrl);
                  toast.success("Invite link copied");
                }}
              >
                Copy Invite Link
              </Button>
            </div>
          ) : null}

          {data.participants.length === 0 ? (
            <p className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-muted-foreground">
              No participants found in this league yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-offwhite">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Team Name</th>
                    <th className="px-4 py-3">Manager Name</th>
                    <th className="px-4 py-3">Current Rank</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.participants.map((participant) => (
                    <tr key={participant.id} className="text-foreground/90">
                      <td className="px-4 py-3 font-semibold text-forest">{participant.teamName}</td>
                      <td className="px-4 py-3">{participant.managerName}</td>
                      <td className="px-4 py-3">#{participant.rank ?? "-"}</td>
                      <td className="px-4 py-3 font-semibold text-gold">{participant.totalPoints}</td>
                      <td className="px-4 py-3 text-right">
                        {!participant.isCurrentUser ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl"
                            disabled={removingParticipantId === participant.id}
                            onClick={() => removeParticipant(participant.id)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="rounded-xl bg-primary/45 text-forest">
                            You
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">League Settings</CardTitle>
          <CardDescription>
            Edit league name, mode, and policy rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">League name</label>
              <input
                value={leagueName}
                onChange={(event) => setLeagueName(event.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mode</label>
              <select
                value={leagueMode}
                onChange={(event) =>
                  setLeagueMode(event.target.value as "draft" | "open_selection")
                }
                className="h-11 w-full rounded-2xl border border-border bg-offwhite px-3 text-sm text-foreground"
              >
                <option value="draft">Draft Mode</option>
                <option value="open_selection">Open Selection Mode</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-gold/45 bg-gold/10 p-3 text-sm text-forest">
            Mode change warning: switching between Draft and Open Selection can impact roster and
            transfer workflows for all participants.
          </div>

          <textarea
            value={rulesText}
            onChange={(event) => setRulesText(event.target.value)}
            placeholder="Example: Trade review window is 24h. Disputes resolved by commissioner vote."
            className="h-36 w-full rounded-2xl border border-border bg-offwhite px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              className="h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={savingLeagueSettings}
              onClick={saveLeagueSettings}
            >
              {savingLeagueSettings ? "Saving..." : "Save League Settings"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-2xl"
              disabled={savingRules}
              onClick={saveRules}
            >
              {savingRules ? "Saving Rules..." : "Save Rules"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-forest">Quick Actions</CardTitle>
          <CardDescription>Commissioner tools for league governance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-forest">Resolve Disputes</p>
            <p className="mt-1">
              Placeholder for dispute tickets, evidence review, and final commissioner ruling.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-forest">End League / Archive</p>
            <p className="mt-1">
              Placeholder for finalizing standings, archiving history, and season wrap actions.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default CommissionerPortalClient;
