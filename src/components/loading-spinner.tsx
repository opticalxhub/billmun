import React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────
   LoadingSpinner — rust-accented spinning ring
   ───────────────────────────────────────────────────────────────────── */
interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  sm:  { outer: 16, border: 2 },
  md:  { outer: 28, border: 2 },
  lg:  { outer: 40, border: 2 },
  xl:  { outer: 56, border: 3 },
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const { outer, border } = SIZE_MAP[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-6", className)}>
      <div style={{ position: "relative", width: outer, height: outer }}>
        {/* Track */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${border}px solid var(--border-subtle)`,
          }}
        />
        {/* Spinning arc */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${border}px solid transparent`,
            borderTopColor: "var(--rust-400)",
            animation: "billmun-spin 0.85s linear infinite",
          }}
        />
      </div>
      <style>{`@keyframes billmun-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <LoadingSpinner size="xl" />
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "var(--text-tertiary)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        LOADING...
      </p>
    </div>
  );
}

export function QueryErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 p-12 text-center", className)}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "var(--status-rejected-bg)",
          border: "1px solid var(--status-rejected-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "18px",
            fontWeight: 800,
            color: "var(--status-rejected-text)",
          }}
        >
          !
        </span>
      </div>
      <div>
        <p
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "14px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-primary)",
          }}
        >
          Something went wrong
        </p>
        <p
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginTop: "4px",
          }}
        >
          {message || "Failed to load data. Please try again."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-raised)",
            border: "1px solid var(--border-emphasized)",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
