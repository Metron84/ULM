import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Rules & Scoring | Ultimate League Manager",
  description: "Everything you need to know about scoring, rules, leagues, and gameplay in ULM.",
};

const scoringRows = [
  { event: "Goal", points: "1 point" },
  { event: "Assist", points: "1 point" },
  { event: "SofaScore Bonus (7.5+)", points: "+2 points" },
  { event: "SofaScore Bonus (7.0 - 7.4)", points: "+1 point" },
  { event: "SofaScore Bonus (below 7.0)", points: "0 points" },
] as const;

const modeRows = [
  {
    feature: "Squad acquisition",
    draft: "Snake-style picks from a shared pool",
    open: "Flexible selection from available players",
  },
  {
    feature: "Player ownership",
    draft: "Exclusive to drafting manager",
    open: "Multiple managers can choose same player",
  },
  {
    feature: "Best for",
    draft: "Competitive private leagues",
    open: "Fast onboarding and casual play",
  },
] as const;

export default function RulesPage() {
  return (
    <MainLayout>
      <section className="space-y-5 sm:space-y-6">
        <Card className="rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
              Rules &amp; Scoring
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-charcoal/75 sm:text-base">
              Everything you need to know about ULM
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-xl text-forest">Scoring System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <table className="w-full min-w-[320px] text-sm">
                <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-charcoal/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-card">
                  {scoringRows.map((row) => (
                    <tr key={row.event}>
                      <td className="px-4 py-3 text-forest">{row.event}</td>
                      <td className="px-4 py-3 font-semibold text-gold">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-xl text-forest">Game Modes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-charcoal/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Feature</th>
                    <th className="px-4 py-3 font-semibold">Draft Mode</th>
                    <th className="px-4 py-3 font-semibold">Open Selection Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-card">
                  {modeRows.map((row) => (
                    <tr key={row.feature}>
                      <td className="px-4 py-3 font-medium text-forest">{row.feature}</td>
                      <td className="px-4 py-3 text-charcoal">{row.draft}</td>
                      <td className="px-4 py-3 text-charcoal">{row.open}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-xl text-forest">Roster Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-6 text-sm text-charcoal">
              <p>- Dynamic roster size is enforced by league and competition settings.</p>
              <p>- Starting players and bench are managed in roster controls.</p>
              <p>- Only one Captain and one Vice-Captain can be active at a time.</p>
              <p>- Captain/Vice-Captain can be reassigned at any time before lock.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-xl text-forest">Predictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-6 text-sm text-charcoal">
              <p>- Exact score + correct scorer = 2 points</p>
              <p>- Correct scorer only = 1 point</p>
              <p>- Correct outcome only = 1 point</p>
              <p>- 0-0 special rule: No Goal Scorer is selected automatically.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-xl text-forest">Trades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-6 text-sm text-charcoal">
              <p>- Football-only items are allowed in trade offers and requests.</p>
              <p>- All trades are subject to commissioner review in managed leagues.</p>
              <p>- Commissioner decisions can include optional comments.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-xl text-forest">Assistant Manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-6 text-sm text-charcoal">
              <p>- You can fire your assistant in settings at any time during the season.</p>
              <p>
                - A new assistant can be appointed at the halfway point to the next season to
                preserve continuity and fairness.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-xl text-forest">League Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6 text-sm text-charcoal">
            <p>- Private leagues are invite-based and can use commissioner controls.</p>
            <p>- Public leagues are open for broader competition and leaderboard discovery.</p>
            <p>- Big 5 can run across all five leagues or selected individual leagues.</p>
            <p>- World Cup leagues follow global tournament fixtures and knockout progression.</p>
          </CardContent>
        </Card>

      </section>
    </MainLayout>
  );
}
