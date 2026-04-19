import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "FAQ | Ultimate League Manager",
  description: "Frequently asked questions about game modes, scoring, trades, assistants, and support.",
};

const faqItems = [
  {
    question: "What is the difference between Draft Mode and Open Selection Mode?",
    answer:
      "Draft Mode uses turn-based picks where player ownership is exclusive. Open Selection Mode is flexible and faster, letting managers select from available players without a draft room flow.",
  },
  {
    question: "How is scoring calculated? (Goals, Assists, SofaScore bonus)",
    answer:
      "ULM core points are simple: Goals = 1 point, Assists = 1 point. Bonus points come from SofaScore ratings: 7.5+ gives +2, 7.0 to 7.4 gives +1, and below 7.0 gives no bonus.",
  },
  {
    question: "How do Predictions work? (scoring, 0-0 rule, one scorer limit)",
    answer:
      "Each prediction supports one scoreline plus one goal scorer. Exact score + correct scorer gives 2 points, correct scorer only gives 1 point, and correct outcome only gives 1 point. For 0-0, no scorer is allowed and the no-scorer rule is applied automatically.",
  },
  {
    question: "Can I trade players? What items are allowed?",
    answer:
      "Yes. Trade offers can include players and optional football-related physical items only, such as jerseys, match tickets, scarves, or memorabilia. Non-football items are blocked by validation.",
  },
  {
    question: "How does the Assistant Manager work? Can I change or fire it?",
    answer:
      "Your Assistant Manager helps with lineup strategy, briefings, and recommendations across ULM tools. You can remove your current assistant from settings, then appoint a new one when policy timing allows.",
  },
  {
    question: "When can I fire my Assistant?",
    answer:
      "You can fire your assistant mid-season. Appointment of a new assistant is restricted to the halfway point to the next season, keeping league decisions stable and fair.",
  },
  {
    question: "How do I become a commissioner?",
    answer:
      "When creating a private league, enable commissioner control and assign yourself as commissioner. Commissioners can review trades, manage participants, and update league-specific rules.",
  },
  {
    question: "What leagues can I play in? (World Cup, Big 5, All 5 or individual)",
    answer:
      "ULM supports World Cup and Big 5 leagues. Big 5 can be configured as all five competitions together or specific individual leagues depending on your setup.",
  },
  {
    question: "How are ranks and standings calculated?",
    answer:
      "Standings are ranked by total points first. Position updates reflect scoring events, bonuses, and league-specific progression over each matchday.",
  },
  {
    question: "Is there real-time points updating?",
    answer:
      "The interface is designed for live momentum, with frequent refresh behavior and dynamic rank sections. Final point tallies are confirmed once underlying fixture and performance updates are settled.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the support contact at info@metronventures.com for account help, league issues, and template questions.",
  },
] as const;

export default function FaqPage() {
  return (
    <MainLayout>
      <section className="space-y-5 sm:space-y-6">
        <Card className="rounded-3xl border-border/70 bg-card/90 py-6 shadow-soft">
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="text-3xl font-bold tracking-tight text-forest sm:text-4xl">
              Frequently Asked Questions
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-charcoal/75 sm:text-base">
              Everything you need to know about Ultimate League Manager
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-xl text-forest">FAQ</CardTitle>
            <CardDescription>Tap any question to expand the answer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border/70 bg-offwhite p-4 shadow-soft"
              >
                <summary className="cursor-pointer list-none pr-7 text-sm font-semibold text-forest marker:content-none">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="float-right text-gold transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/85">{item.answer}</p>
              </details>
            ))}
          </CardContent>
        </Card>

      </section>
    </MainLayout>
  );
}
