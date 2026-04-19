import Link from "next/link";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MyLeaguesPage() {
  return (
    <MainLayout>
      <section className="space-y-5 demo-fade-in">
        <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
          <CardHeader className="px-6">
            <CardTitle className="text-forest">My Leagues</CardTitle>
            <CardDescription>
              Your private mini-leagues, side games, and market actions in one calm command center.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 sm:grid-cols-3">
            <article className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="font-semibold text-forest">Predictions League</p>
              <p className="mt-1 text-sm text-charcoal/70">
                Weekly score calls and fun rank races.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="font-semibold text-forest">Trade Market</p>
              <p className="mt-1 text-sm text-charcoal/70">
                Commissioner-approved football-only agreements.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-offwhite p-4">
              <p className="font-semibold text-forest">World Cup Hub</p>
              <p className="mt-1 text-sm text-charcoal/70">
                Knockout ladder and global competition pulse.
              </p>
            </article>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-0 bg-transparent px-6">
            <Link href="/predictions">
              <Button className="h-10 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                Open Predictions
              </Button>
            </Link>
            <Link href="/trades">
              <Button variant="outline" className="h-10 rounded-2xl">
                Open Trade Market
              </Button>
            </Link>
            <Link href="/worldcup">
              <Button variant="outline" className="h-10 rounded-2xl">
                Open World Cup Hub
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </section>
    </MainLayout>
  );
}
