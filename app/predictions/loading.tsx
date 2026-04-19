import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPredictions() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6 sm:px-8">
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-80 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </main>
  );
}
