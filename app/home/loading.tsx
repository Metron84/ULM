import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingHome() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6 sm:px-8">
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-40 rounded-3xl lg:col-span-3" />
      </div>
      <Skeleton className="h-56 rounded-3xl" />
    </main>
  );
}
