import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingRoster() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6 sm:px-8">
      <Skeleton className="h-36 rounded-3xl" />
      <Skeleton className="h-[520px] rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-12 rounded-3xl" />
        <Skeleton className="h-12 rounded-3xl" />
      </div>
    </main>
  );
}
