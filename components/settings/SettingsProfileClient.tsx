"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { SettingsPageData } from "@/lib/settings";
import { personaEmoji, personaLabel, type AssistantPersona } from "@/lib/persona";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SettingsProfileClientProps = {
  data: SettingsPageData;
};

const FIRE_STORAGE_KEY = "ulm-assistant-fired-at";
const PREVIOUS_PERSONA_STORAGE_KEY = "ulm-assistant-prev-persona";
const REAPPOINT_WINDOW_DAYS = 14;

function personaCardClass(persona: AssistantPersona) {
  if (persona === "analyst") return "bg-primary/35 text-forest";
  if (persona === "diehard_fan") return "bg-gold/25 text-forest";
  return "bg-forest text-offwhite";
}

export function SettingsProfileClient({ data }: SettingsProfileClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(data.displayName);
  const [savingProfile, setSavingProfile] = useState(false);

  const [assistantPersona, setAssistantPersona] = useState<AssistantPersona>(data.assistantPersona);
  const [firedAt, setFiredAt] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(FIRE_STORAGE_KEY),
  );
  const [firedFromPersona, setFiredFromPersona] = useState<AssistantPersona | null>(() => {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(PREVIOUS_PERSONA_STORAGE_KEY);
    return value === "analyst" || value === "diehard_fan" || value === "fantasy_veteran"
      ? value
      : null;
  });
  const [fireModalOpen, setFireModalOpen] = useState(false);
  const [savingAssistant, setSavingAssistant] = useState(false);
  const [currentTimestamp] = useState(() => Date.now());

  const [matchAlertsEnabled, setMatchAlertsEnabled] = useState(true);
  const [tradeUpdatesEnabled, setTradeUpdatesEnabled] = useState(true);
  const [assistantMessagesEnabled, setAssistantMessagesEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [supportPulse, setSupportPulse] = useState(false);

  const reappointAvailableAt = useMemo(() => {
    if (!firedAt) return null;
    const firedDate = new Date(firedAt);
    const next = new Date(firedDate);
    next.setDate(next.getDate() + REAPPOINT_WINDOW_DAYS);
    return next;
  }, [firedAt]);

  const canChooseNewAssistant = useMemo(() => {
    if (!reappointAvailableAt) return false;
    return currentTimestamp >= reappointAvailableAt.getTime();
  }, [currentTimestamp, reappointAvailableAt]);

  const saveDisplayName = async () => {
    if (displayName.trim().length < 2) {
      toast.error("Display name must be at least 2 characters.");
      return;
    }
    try {
      setSavingProfile(true);
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not update profile.");
      }
      toast.success("Display name updated.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not update profile.";
      toast.error(text);
    } finally {
      setSavingProfile(false);
    }
  };

  const fireAssistant = () => {
    const now = new Date().toISOString();
    window.localStorage.setItem(FIRE_STORAGE_KEY, now);
    window.localStorage.setItem(PREVIOUS_PERSONA_STORAGE_KEY, assistantPersona);
    setFiredAt(now);
    setFiredFromPersona(assistantPersona);
    setFireModalOpen(false);
    toast.success("Assistant released.", {
      description: "A new appointment opens halfway to next season.",
    });
  };

  const appointAssistant = async (nextPersona: AssistantPersona) => {
    if (!canChooseNewAssistant) return;
    try {
      setSavingAssistant(true);
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantPersona: nextPersona }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not appoint assistant.");
      }

      setAssistantPersona(nextPersona);
      setFiredAt(null);
      setFiredFromPersona(null);
      window.localStorage.removeItem(FIRE_STORAGE_KEY);
      window.localStorage.removeItem(PREVIOUS_PERSONA_STORAGE_KEY);

      toast.success("New assistant appointed.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not appoint assistant.";
      toast.error(text);
    } finally {
      setSavingAssistant(false);
    }
  };

  const currentPersonaLabel = personaLabel(assistantPersona);

  return (
    <section className="space-y-5 sm:space-y-6">
      <Card className="rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
        <CardHeader className="px-6 sm:px-8">
          <CardTitle className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
            Settings &amp; Profile
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">Profile Information</CardTitle>
          <CardDescription>Your identity and core account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Display Name</p>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground"
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="mt-2 break-all text-sm font-medium text-forest">{data.email}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-offwhite p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Assistant Persona</p>
            <p className="mt-2 text-sm font-semibold text-forest">
              {personaEmoji(assistantPersona)} {currentPersonaLabel}
            </p>
          </div>

          <Button
            type="button"
            className="h-11 rounded-2xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            onClick={saveDisplayName}
            disabled={savingProfile}
          >
            {savingProfile ? "Saving..." : "Save Display Name"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">Assistant Manager</CardTitle>
          <CardDescription>Manage your assistant lifecycle and policy timing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className={cn("rounded-2xl border border-border/70 p-4", personaCardClass(assistantPersona))}>
            <p className="text-xs uppercase tracking-wide opacity-80">Current Assistant</p>
            <p className="mt-2 text-lg font-semibold">
              {personaEmoji(assistantPersona)} {currentPersonaLabel}
            </p>
            {firedFromPersona ? (
              <p className="mt-1 text-xs opacity-80">
                Last released assistant: {personaEmoji(firedFromPersona)} {personaLabel(firedFromPersona)}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gold/45 bg-gold/10 p-4 text-sm text-forest">
            <p className="font-semibold">Policy notice</p>
            <p className="mt-1">
              You can fire your assistant mid-season. A new assistant can only be appointed halfway to
              the next season.
            </p>
          </div>

          {!firedAt ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-gold/60 text-forest hover:bg-gold/10"
              onClick={() => setFireModalOpen(true)}
            >
              <ShieldAlert className="mr-2 h-4 w-4 text-gold" />
              Fire Assistant
            </Button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="text-sm font-semibold text-forest">Choose New Assistant</p>
              <p className="text-xs text-muted-foreground">
                {canChooseNewAssistant
                  ? "Appointment window is open."
                  : `Appointment unlocks on ${reappointAvailableAt?.toLocaleDateString()}.`}
              </p>

              <div className="grid gap-2 sm:grid-cols-3">
                {(["analyst", "diehard_fan", "fantasy_veteran"] as const).map((persona) => (
                  <button
                    key={persona}
                    type="button"
                    disabled={!canChooseNewAssistant || savingAssistant}
                    onClick={() => appointAssistant(persona)}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                      "border-border bg-card text-forest",
                      !canChooseNewAssistant && "cursor-not-allowed opacity-55",
                      canChooseNewAssistant && "hover:border-sage/70 hover:bg-primary/20",
                    )}
                  >
                    {personaEmoji(persona)} {personaLabel(persona)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">Account &amp; Notifications</CardTitle>
          <CardDescription>Notification and privacy preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          <button
            type="button"
            onClick={() => setMatchAlertsEnabled((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-offwhite px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-forest">Match alerts</span>
            <Badge className={cn("rounded-xl", matchAlertsEnabled ? "bg-primary/50 text-forest" : "bg-card text-muted-foreground")}>
              {matchAlertsEnabled ? "On" : "Off"}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setTradeUpdatesEnabled((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-offwhite px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-forest">Trade updates</span>
            <Badge className={cn("rounded-xl", tradeUpdatesEnabled ? "bg-primary/50 text-forest" : "bg-card text-muted-foreground")}>
              {tradeUpdatesEnabled ? "On" : "Off"}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setAssistantMessagesEnabled((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-offwhite px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-forest">Assistant messages</span>
            <Badge className={cn("rounded-xl", assistantMessagesEnabled ? "bg-primary/50 text-forest" : "bg-card text-muted-foreground")}>
              {assistantMessagesEnabled ? "On" : "Off"}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setPrivacyMode((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-offwhite px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-forest">Private profile mode</span>
            <Badge className={cn("rounded-xl", privacyMode ? "bg-gold/25 text-gold" : "bg-card text-muted-foreground")}>
              {privacyMode ? "Enabled" : "Disabled"}
            </Badge>
          </button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">League Management</CardTitle>
          <CardDescription>Quick access to league operations and guidance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 px-6">
          <Link
            href="/leagues"
            className="inline-flex h-10 items-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-forest hover:bg-primary/20"
          >
            My Leagues
          </Link>
          <Link
            href="/rules"
            className="inline-flex h-10 items-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-forest hover:bg-primary/20"
          >
            Rules
          </Link>
          <Link
            href="/faq"
            className="inline-flex h-10 items-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-forest hover:bg-primary/20"
          >
            FAQ
          </Link>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <CardTitle className="text-xl text-forest">Contact &amp; Support</CardTitle>
          <CardDescription>We are here to help your league run smoothly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          <p className="text-sm text-muted-foreground">
            Email:{" "}
            <a
              href="mailto:info@metronventures.com"
              className="font-semibold text-forest underline decoration-gold/70 underline-offset-4"
            >
              info@metronventures.com
            </a>
          </p>
          <Button
            type="button"
            className="h-11 rounded-2xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setSupportPulse(true);
              window.location.href = "mailto:info@metronventures.com?subject=ULM%20Support";
              window.setTimeout(() => setSupportPulse(false), 700);
            }}
          >
            <Mail className="mr-2 h-4 w-4 text-gold" />
            Contact Support
            {supportPulse ? <UserRound className="ml-2 h-4 w-4 text-gold" /> : null}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={fireModalOpen} onOpenChange={setFireModalOpen}>
        <DialogContent className="rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-forest">Fire Assistant?</DialogTitle>
            <DialogDescription>
              Your current assistant will be removed immediately. A new assistant can only be
              appointed halfway to next season.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFireModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-reward text-reward-foreground hover:bg-gold/85"
              onClick={fireAssistant}
            >
              Confirm Fire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default SettingsProfileClient;
