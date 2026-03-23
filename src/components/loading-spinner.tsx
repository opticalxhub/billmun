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

export function QueryErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-12 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-status-rejected-bg border border-status-rejected-border flex items-center justify-center">
        <span className="text-status-rejected-text text-xl font-bold">!</span>
      </div>
      <div>
        <p className="text-text-primary font-semibold text-sm">Something went wrong</p>
        <p className="text-text-dimmed text-xs mt-1">{message || "Failed to load data. Please try again."}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors min-h-[36px]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
