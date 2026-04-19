import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TabPlaceholderProps = {
  title: string;
  description: string;
};

export function TabPlaceholder({ title, description }: TabPlaceholderProps) {
  return (
    <MainLayout>
      <section className="flex min-h-[65vh] items-center justify-center">
        <Card className="w-full max-w-2xl rounded-3xl border-border/70 bg-card/90 py-7 text-center shadow-soft">
          <CardHeader className="space-y-3 px-8">
            <Badge variant="outline" className="mx-auto rounded-xl border-gold/40 text-gold">
              Expanding soon
            </Badge>
            <CardTitle className="text-2xl text-forest">{title}</CardTitle>
          </CardHeader>
          <CardContent className="px-8 text-sm text-charcoal/75 sm:text-base">
            {description}
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  );
}

export default TabPlaceholder;
