import { cn } from "@/lib/utils";

type LoadingProps = {
  label?: string;
  className?: string;
  fullscreen?: boolean;
};

export function Loading({
  label = "Loading",
  className,
  fullscreen = false,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-3 text-muted-foreground",
        fullscreen && "min-h-[60vh]",
        className,
      )}
    >
      <span className="relative inline-flex h-10 w-10">
        <span className="absolute inset-0 rounded-full border-2 border-sage-200" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        <span className="absolute inset-2 rounded-full bg-sage-50" />
      </span>
      <span className="text-sm font-medium tracking-wide">{label}…</span>
    </div>
  );
}

export default Loading;
