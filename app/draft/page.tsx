import Link from "next/link";

import { MainLayout } from "@/components/layout/MainLayout";
import { DraftBoardClient } from "@/components/draft/DraftBoardClient";
import { getDraftBoardData } from "@/lib/draft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DraftPage() {
  const data = await getDraftBoardData();

  if (!data) {
    return (
      <MainLayout>
        <section className="space-y-5 sm:space-y-6">
          <Card className="rounded-3xl border-border/70 bg-card/90 py-7 shadow-soft">
            <CardHeader className="px-6">
              <CardTitle className="text-forest">Draft Board</CardTitle>
              <CardDescription>
                You are not currently in a Draft Mode league.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <p className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm text-charcoal/75">
                Join or create a Draft Mode league in My Leagues to unlock the full draft board.
              </p>
              <div className="mt-4">
                <Link href="/leagues">
                  <Button className="h-10 rounded-2xl bg-sage text-forest hover:bg-sage/80">
                    Go to My Leagues
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DraftBoardClient data={data} />
    </MainLayout>
  );
}
