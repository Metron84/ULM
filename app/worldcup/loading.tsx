import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingWorldCup() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6 sm:px-8">
      <Skeleton className="h-44 rounded-3xl" />
      <Skeleton className="h-14 rounded-3xl" />
      <Skeleton className="h-96 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </main>
  );
}
