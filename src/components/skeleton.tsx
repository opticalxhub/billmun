import React from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-center p-4 min-h-[40px]", className)}
      {...props}
    >
      <LoadingSpinner size="sm" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 border border-border-subtle rounded-card bg-bg-card flex items-center justify-center min-h-[160px]">
      <LoadingSpinner size="md" />
    </div>
  );
}

export const SkeletonRow = React.memo(() => {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border-subtle last:border-0">
      <div className="h-10 w-10 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-bg-raised/10 rounded" />
        <div className="h-3 w-1/4 bg-bg-raised/5 rounded" />
      </div>
    </div>
  );
});

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="relative h-48 w-full rounded-card overflow-hidden border border-border-subtle mb-8 flex items-center justify-center bg-bg-raised/10">
      <LoadingSpinner size="lg" />
    </div>
  );
}
