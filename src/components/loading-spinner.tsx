import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-t-text-primary border-r-transparent border-b-text-primary/30 border-l-transparent",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 bg-bg-base z-[100] flex items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );
}
