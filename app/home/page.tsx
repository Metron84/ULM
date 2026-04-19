import Link from "next/link";
import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
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
  personaEmoji,
  personaLabel,
  postMatchReviewFallbacks,
  type AssistantPersona,
} from "@/lib/persona";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

type FixtureCard = {
  id: string;
  home: string;
  away: string;
  dateLabel: string;
};

export const metadata: Metadata = {
  title: "Home | Ultimate League Manager",
  description:
    "Track your fantasy momentum with assistant briefings, predictions, and matchday decisions in one calm dashboard.",
  openGraph: {
    title: "Ultimate League Manager - Home",
    description:
      "Your premium football command center for rankings, assistant insights, and next matchday actions.",
    type: "website",
    url: "/home",
    siteName: "Ultimate League Manager",
    images: [{ url: "/og-default.svg", width: 1200, height: 630, alt: "Ultimate League Manager" }],
  },
};

export default async function HomePage() {
  let displayName = "Manager";
  let persona: AssistantPersona = "analyst";
  let briefing = postMatchReviewFallbacks.analyst[0];
  let briefingSeedKey = "ulm-default-seed";
  const fixtures: FixtureCard[] = [];
  const tickerEntries: string[] = [
    "Mbappé 7.9 • +2 bonus • 14 pts this week",
    "Salah form watch • 3 returns in last 4",
    "Haaland projection uplift • strong fixture window",
  ];

  if (hasSupabaseEnv()) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      briefingSeedKey = user.id;
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, assistant_persona")
        .eq("id", user.id)
        .maybeSingle();

      displayName =
        profile?.display_name ??
        (typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : null) ??
        user.email?.split("@")[0] ??
        "Manager";

      if (
        profile?.assistant_persona === "analyst" ||
        profile?.assistant_persona === "diehard_fan" ||
        profile?.assistant_persona === "fantasy_veteran"
      ) {
        persona = profile.assistant_persona;
      }

      const { data: reviewTemplates } = await supabase
        .from("assistant_templates")
        .select("template_text")
        .eq("persona", persona)
        .eq("function_type", "post_match_review")
        .limit(6);

      const reviewPool =
        reviewTemplates?.map((template) => template.template_text).filter(Boolean) ??
        postMatchReviewFallbacks[persona];

      if (reviewPool.length > 0) {
        const hash = briefingSeedKey
          .split("")
          .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
        briefing = reviewPool[hash % reviewPool.length]!;
      }

      const { data: nextFixtures } = await supabase
        .from("fixtures")
        .select(
          "id,match_date,home_team:real_teams!fixtures_home_team_id_fkey(short_name,name),away_team:real_teams!fixtures_away_team_id_fkey(short_name,name)",
        )
        .eq("status", "scheduled")
        .order("match_date", { ascending: true })
        .limit(3);

      nextFixtures?.forEach((fixture) => {
        const matchDate = fixture.match_date ? new Date(fixture.match_date) : null;
        fixtures.push({
          id: fixture.id as string,
          home:
            (fixture.home_team as { short_name?: string | null; name?: string | null } | null)
              ?.short_name ??
            (fixture.home_team as { short_name?: string | null; name?: string | null } | null)
              ?.name ??
            "Home",
          away:
            (fixture.away_team as { short_name?: string | null; name?: string | null } | null)
              ?.short_name ??
            (fixture.away_team as { short_name?: string | null; name?: string | null } | null)
              ?.name ??
            "Away",
          dateLabel: matchDate
            ? matchDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "TBD",
        });
      });

      const fixtureTicker = fixtures
        .slice(0, 2)
        .map((fixture) => `${fixture.home} vs ${fixture.away} • ${fixture.dateLabel}`);
      if (fixtureTicker.length > 0) {
        tickerEntries.unshift(...fixtureTicker);
      }
    }
  }

  if (fixtures.length === 0) {
    fixtures.push(
      { id: "f-1", home: "FRA", away: "ENG", dateLabel: "Sat, Jun 13" },
      { id: "f-2", home: "ARG", away: "BRA", dateLabel: "Sun, Jun 14" },
      { id: "f-3", home: "POR", away: "ESP", dateLabel: "Mon, Jun 15" },
    );
  }

  return (
    <MainLayout>
      <section className="space-y-5 sm:space-y-6">
        <header className="space-y-4 rounded-3xl border border-border/70 bg-card/85 p-6 shadow-soft sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-forest sm:text-3xl">
                Good evening, {displayName}
              </h2>
              <p className="mt-2 text-sm text-charcoal/75 sm:text-base">
                Your assistant is ready for today&apos;s matchday decisions.
              </p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/35 text-2xl shadow-soft">
              {personaEmoji(persona)}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-offwhite px-4 py-3">
            <p className="text-sm font-semibold text-forest">Live ticker</p>
            <div className="mt-1 overflow-hidden border-b border-gold/55 pb-2">
              <p className="text-sm text-charcoal/85">
                {tickerEntries.slice(0, 3).join("   •   ")}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Your Ranks</CardTitle>
              <CardDescription>Today&apos;s snapshot across competitions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 text-sm">
              <p className="rounded-2xl bg-offwhite p-3 text-charcoal">
                World Cup Global:{" "}
                <span className="font-semibold text-gold">#184</span> of 1.2M
              </p>
              <p className="rounded-2xl bg-offwhite p-3 text-charcoal">
                Big 5 Leagues: <span className="font-semibold text-forest">#7</span> in your
                private league
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft lg:col-span-2">
            <CardHeader className="px-6">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-forest">Assistant&apos;s Daily Briefing</CardTitle>
                <Badge variant="secondary" className="rounded-xl bg-sage/45 text-forest">
                  {personaLabel(persona)}
                </Badge>
              </div>
              <CardDescription>
                Tailored to your persona and current matchday context.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <p className="rounded-2xl bg-offwhite p-4 text-sm leading-relaxed text-charcoal">
                {briefing}
              </p>
            </CardContent>
            <CardFooter className="border-0 bg-transparent px-6 pt-1">
              <Link href="/assistant">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-11 rounded-2xl bg-sage/55 px-5 text-forest hover:bg-sage/70"
                >
                  Ask Assistant
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft lg:col-span-3">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Next Matchday</CardTitle>
              <CardDescription>Stay ahead before kickoff.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-semibold text-charcoal">3 days 14 hours</p>
              <Link href="/assistant">
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
        </div>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-forest">Predictions This Round</CardTitle>
              <Badge variant="outline" className="rounded-xl border-gold/40 text-gold">
                3/5 completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 md:grid-cols-3">
            {fixtures.map((fixture) => (
              <article
                key={fixture.id}
                className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm shadow-soft"
              >
                <p className="font-semibold text-forest">
                  {fixture.home} vs {fixture.away}
                </p>
                <p className="mt-1 text-charcoal/70">{fixture.dateLabel}</p>
              </article>
            ))}
          </CardContent>
          <CardFooter className="border-0 bg-transparent px-6">
            <Link href="/predictions">
              <Button
                variant="secondary"
                size="lg"
                className="h-11 rounded-2xl bg-sage px-5 text-forest hover:bg-sage/80"
              >
                Make Predictions
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">Market &amp; Bets</CardTitle>
            <CardDescription>Trade talks and commissioner approvals.</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <p className="rounded-2xl bg-offwhite p-4 text-sm leading-relaxed text-charcoal">
              Explore player swaps, football memorabilia agreements, and league-approved deals.
            </p>
          </CardContent>
          <CardFooter className="border-0 bg-transparent px-6">
            <Link href="/trades">
              <Button
                variant="secondary"
                size="lg"
                className="h-11 rounded-2xl bg-sage px-5 text-forest hover:bg-sage/80"
              >
                Open Trade Market
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">World Cup Hub</CardTitle>
            <CardDescription>Bracket race, global ranking, and knockout pulse.</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <p className="rounded-2xl bg-offwhite p-4 text-sm leading-relaxed text-charcoal">
              Enter the global stage and track your position as the knockout rounds heat up.
            </p>
          </CardContent>
          <CardFooter className="border-0 bg-transparent px-6">
            <Link href="/worldcup">
              <Button
                variant="secondary"
                size="lg"
                className="h-11 rounded-2xl bg-sage px-5 text-forest hover:bg-sage/80"
              >
                Open World Cup Hub
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </section>
    </MainLayout>
  );
}
