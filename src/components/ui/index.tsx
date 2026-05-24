import * as React from "react";

/* ─────────────────────────────────────────────────────────────────────
   BILLMUN shared UI primitives — aligned to the design system
   ───────────────────────────────────────────────────────────────────── */

/* ── Card ─────────────────────────────────────────────────────────── */
export const Card = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "2px",
      padding: "20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
      ...style,
    }}
    {...props}
  />
);

/* ── PaperCard — polaroid/aged paper style (corkboard) ─────────────── */
export const PaperCard = ({
  className,
  style,
  rotate = "0deg",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rotate?: string }) => (
  <div
    className={`relative ${className ?? ""}`}
    style={{
      backgroundColor: "var(--paper-aged)",
      border: "1px solid var(--paper-border)",
      borderRadius: "2px",
      padding: "20px",
      boxShadow: "0 6px 28px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.35)",
      transform: `rotate(${rotate})`,
      ...style,
    }}
    {...props}
  />
);

/* ── SectionLabel ─────────────────────────────────────────────────── */
export const SectionLabel = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={className}
    style={{
      fontFamily: "var(--font-barlow-condensed)",
      fontSize: "20px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "var(--text-primary)",
      marginBottom: "16px",
      ...style,
    }}
    {...props}
  />
);

/* ── MonoLabel — section label in monospace style ─────────────────── */
export const MonoLabel = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={className}
    style={{
      fontFamily: "var(--font-mono)",
      fontSize: "9px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      color: "var(--text-tertiary)",
      marginBottom: "8px",
      ...style,
    }}
    {...props}
  />
);

/* ── Input ────────────────────────────────────────────────────────── */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, style, onFocus, onBlur, ...props }, ref) => (
  <input
    ref={ref}
    className={className}
    style={{
      display: "flex",
      height: "40px",
      width: "100%",
      borderRadius: "3px",
      border: "1px solid var(--border-input)",
      backgroundColor: "var(--bg-card)",
      padding: "0 12px",
      fontSize: "14px",
      color: "var(--text-primary)",
      fontFamily: "var(--font-barlow)",
      outline: "none",
      transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
      ...style,
    }}
    onFocus={(e) => {
      e.target.style.borderColor = "var(--rust-500)";
      e.target.style.boxShadow = "0 0 0 1px var(--rust-700)";
      onFocus?.(e);
    }}
    onBlur={(e) => {
      e.target.style.borderColor = "var(--border-input)";
      e.target.style.boxShadow = "none";
      onBlur?.(e);
    }}
    {...props}
  />
));
Input.displayName = "Input";

/* ── Select ──────────────────────────────────────────────────────── */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, style, ...props }, ref) => (
  <select
    ref={ref}
    className={className}
    style={{
      display: "flex",
      height: "40px",
      width: "100%",
      flex: 1,
      borderRadius: "3px",
      border: "1px solid var(--border-input)",
      backgroundColor: "var(--bg-card)",
      padding: "0 12px",
      fontSize: "14px",
      color: "var(--text-primary)",
      fontFamily: "var(--font-barlow)",
      outline: "none",
      cursor: "pointer",
      ...style,
    }}
    {...props}
  />
));
Select.displayName = "Select";

/* ── Textarea ─────────────────────────────────────────────────────── */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, style, onFocus, onBlur, ...props }, ref) => (
  <textarea
    ref={ref}
    className={className}
    style={{
      width: "100%",
      borderRadius: "3px",
      border: "1px solid var(--border-input)",
      backgroundColor: "var(--bg-card)",
      padding: "10px 12px",
      fontSize: "14px",
      color: "var(--text-primary)",
      fontFamily: "var(--font-barlow)",
      outline: "none",
      transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
      resize: "vertical",
      ...style,
    }}
    onFocus={(e) => {
      e.target.style.borderColor = "var(--rust-500)";
      e.target.style.boxShadow = "0 0 0 1px var(--rust-700)";
      onFocus?.(e);
    }}
    onBlur={(e) => {
      e.target.style.borderColor = "var(--border-input)";
      e.target.style.boxShadow = "none";
      onBlur?.(e);
    }}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ── FormLabel ────────────────────────────────────────────────────── */
export const FormLabel = ({
  className,
  style,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={`block ${className ?? ""}`}
    style={{
      fontFamily: "var(--font-barlow-condensed)",
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "var(--text-secondary)",
      marginBottom: "6px",
      ...style,
    }}
    {...props}
  />
);

/* ── FormGroup ────────────────────────────────────────────────────── */
export const FormGroup = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`space-y-2 ${className ?? ""}`} {...props} />
);

/* ── ErrorMessage ─────────────────────────────────────────────────── */
export const ErrorMessage = ({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={className}
    style={{
      fontFamily: "var(--font-barlow)",
      fontSize: "12px",
      color: "var(--status-rejected-text)",
      marginTop: "4px",
      ...style,
    }}
    {...props}
  />
);

/* ── Badge ────────────────────────────────────────────────────────── */
type BadgeVariant = "default" | "approved" | "pending" | "rejected" | "suspended" | "warning" | "rust";

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  approved:  { backgroundColor: "var(--status-approved-bg)",  color: "var(--status-approved-text)",  border: "1px solid var(--status-approved-border)"  },
  pending:   { backgroundColor: "var(--status-pending-bg)",   color: "var(--status-pending-text)",   border: "1px solid var(--status-pending-border)"   },
  rejected:  { backgroundColor: "var(--status-rejected-bg)",  color: "var(--status-rejected-text)",  border: "1px solid var(--status-rejected-border)"  },
  suspended: { backgroundColor: "var(--status-rejected-bg)",  color: "var(--status-rejected-text)",  border: "1px solid var(--status-rejected-border)"  },
  warning:   { backgroundColor: "var(--status-warning-bg)",   color: "var(--status-warning-text)",   border: "1px solid var(--status-warning-border)"   },
  rust:      { backgroundColor: "var(--rust-900)",             color: "var(--rust-300)",              border: "1px solid var(--rust-700)"                },
  default:   { backgroundColor: "var(--bg-raised)",            color: "var(--text-secondary)",        border: "1px solid var(--border-subtle)"           },
};

export const Badge = ({
  className,
  children,
  variant = "default",
  style,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) => (
  <span
    className={`inline-flex items-center ${className ?? ""}`}
    style={{
      borderRadius: "2px",
      padding: "2px 8px",
      fontFamily: "var(--font-barlow-condensed)",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      ...BADGE_STYLES[variant],
      ...style,
    }}
    {...props}
  >
    {children}
  </span>
);

/* ── Modal ────────────────────────────────────────────────────────── */
export function Modal({
  isOpen,
  onClose,
  children,
  className,
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className={`relative w-full h-full md:h-auto md:max-w-xl overflow-y-auto ${className ?? ""}`}
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-emphasized)",
          borderRadius: "2px",
          padding: "24px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose ? (
          <button
            className="absolute top-4 right-4 p-1 transition-colors z-10"
            onClick={onClose}
            aria-label="Close"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
        <div className="pt-6 md:pt-0">{children}</div>
      </div>
    </div>
  );
}

export * from "./button";
