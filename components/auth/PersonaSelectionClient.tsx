"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Persona = "analyst" | "diehard_fan" | "fantasy_veteran";

type PersonaCard = {
  persona: Persona;
  emoji: string;
  title: string;
  subtitle: string;
  bio: string;
  accentClass: string;
};

const cards: PersonaCard[] = [
  {
    persona: "analyst",
    emoji: "📊",
    title: "The Analyst",
    subtitle: "Data-driven, calm, always logical",
    bio: "Stats, trends, projections — your tactical brain.",
    accentClass: "bg-secondary/50",
  },
  {
    persona: "diehard_fan",
    emoji: "⚽",
    title: "The Die-Hard Fan",
    subtitle: "Passionate, energetic, lives for the atmosphere",
    bio: "Gut feel, energy, and matchday vibes.",
    accentClass: "bg-primary/10",
  },
  {
    persona: "fantasy_veteran",
    emoji: "🏆",
    title: "The Fantasy Veteran",
    subtitle: "Competitive, strategic, rank-climbing expert",
    bio: "Differentials, long-term strategy, and winning moves.",
    accentClass: "bg-primary text-primary-foreground",
  },
];

export function PersonaSelectionClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<Persona>("analyst");
  const [saving, setSaving] = useState(false);

  const selectedLabel = useMemo(
    () => cards.find((card) => card.persona === selected)?.title ?? "Selected Persona",
    [selected],
  );

  const handleContinue = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You need to be signed in to continue.");
      }

      const displayName =
        (typeof user.user_metadata?.display_name === "string" &&
          user.user_metadata.display_name.trim()) ||
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
        user.email?.split("@")[0] ||
        "ULM Manager";

      const { error } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          display_name: displayName,
          assistant_persona: selected,
        },
        { onConflict: "id" },
      );

      if (error) {
        throw error;
      }

      toast.success("Persona selected", {
        description: `${selectedLabel} is now your assistant manager.`,
      });

      router.push("/home");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save your persona selection.";
      toast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 sm:px-10 sm:py-14">
      <section className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="mb-10 max-w-3xl">
          <h1 className="text-[28px] font-bold leading-tight text-foreground">
            Choose Your Assistant Manager
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            They&apos;ll be with you every matchday — pick the voice that feels right.
          </p>
        </header>

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const active = selected === card.persona;
            return (
              <button
                key={card.persona}
                type="button"
                onClick={() => setSelected(card.persona)}
                className={cn(
                  "group relative min-h-[300px] rounded-3xl border border-border/80 p-6 text-left",
                  "shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  card.accentClass,
                  active &&
                    "scale-[1.02] ring-2 ring-primary shadow-[0_0_0_1px_rgba(30,58,138,0.35),0_22px_60px_-22px_rgba(30,58,138,0.6)]",
                )}
                aria-pressed={active}
              >
                <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-card/80 text-2xl shadow-soft">
                  {card.emoji}
                </span>
                <h2 className="text-xl font-semibold">{card.title}</h2>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    active && card.persona === "fantasy_veteran"
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground",
                  )}
                >
                  {card.subtitle}
                </p>
                <p
                  className={cn(
                    "mt-5 text-sm leading-relaxed",
                    active && card.persona === "fantasy_veteran"
                      ? "text-primary-foreground/95"
                      : "text-foreground/90",
                  )}
                >
                  {card.bio}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className={cn(
              "inline-flex h-14 w-full items-center justify-center rounded-3xl bg-primary px-6 text-base font-semibold text-primary-foreground sm:w-auto sm:min-w-[360px]",
              "shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-60",
            )}
          >
            {saving
              ? "Saving your persona..."
              : `Continue with ${selectedLabel}`}
          </button>
        </div>
      </section>
    </main>
  );
}

export default PersonaSelectionClient;
