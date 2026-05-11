import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-card bg-muted",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4 shadow-card",
        className
      )}
    >
      <Skeleton className="mb-3 h-4 w-3/4" />
      <Skeleton className="mb-2 h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function SkeletonGroup({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Skeleton className="mb-1 h-8 w-32 rounded-card" />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonChat({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2",
            i % 2 === 0 ? "justify-start" : "justify-end"
          )}
        >
          <Skeleton
            className={cn(
              "h-12 rounded-bubble",
              i % 2 === 0 ? "w-56" : "w-44"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonGroup, SkeletonChat };
