import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAssistant() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-6 py-6 sm:px-8">
      <Skeleton className="h-32 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </main>
  );
}
