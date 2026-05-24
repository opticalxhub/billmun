import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { ReportIssueModal } from "./report-issue-modal";

/* ─────────────────────────────────────────────────────────────────────
   DashboardLoadingState — scanline-style loading with rust pulse
   ───────────────────────────────────────────────────────────────────── */
export function DashboardLoadingState({
  type = "default",
}: {
  type?: "default" | "overview" | "list" | "table";
}) {
  if (type === "overview") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <PulseSpinner />
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="flex-1 flex flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm p-4"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "var(--border-subtle)",
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 12, backgroundColor: "var(--border-subtle)", borderRadius: 2, width: "70%" }} />
                <div style={{ height: 10, backgroundColor: "var(--border-subtle)", borderRadius: 2, width: "45%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="flex-1 p-6">
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "16px" }}>
            <div
              style={{
                height: 16,
                backgroundColor: "var(--border-subtle)",
                borderRadius: 2,
                width: "28%",
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: "var(--border-subtle)",
                  borderRadius: 2,
                  animation: "pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ height: 12, backgroundColor: "var(--border-subtle)", borderRadius: 2, width: "60%", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.08}s` }} />
                <div style={{ height: 10, backgroundColor: "var(--border-subtle)", borderRadius: 2, width: "35%", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.08 + 0.05}s` }} />
              </div>
              <div style={{ width: 64, height: 28, backgroundColor: "var(--border-subtle)", borderRadius: 2, animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.08}s` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Default — full page centered spinner */
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <PulseSpinner />
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-tertiary)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        AUTHENTICATING...
      </p>
    </div>
  );
}

/* Internal pulsing rust spinner */
function PulseSpinner() {
  return (
    <div className="relative w-10 h-10">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "2px solid var(--border-subtle)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "2px solid transparent",
          borderTopColor: "var(--rust-400)",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DashboardErrorState
   ───────────────────────────────────────────────────────────────────── */
export function DashboardErrorState({ message }: { message: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "24px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-emphasized)",
          borderRadius: "2px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "14px",
            color: "var(--text-primary)",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DashboardHeader — top bar used across all role dashboards
   ───────────────────────────────────────────────────────────────────── */
export function DashboardHeader({
  title,
  subtitle,
  rightContent,
  committeeName,
  user,
}: {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  committeeName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* Left — title block */}
      <div className="min-w-0">
        {user?.full_name ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "var(--text-rust)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            {String(user.full_name).split(" ").pop()}
          </p>
        ) : null}
        <h1
          className="truncate"
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)",
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
            textTransform: "uppercase",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className="mt-1 truncate"
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <ReportIssueModal user={user} committeeName={committeeName} />
        )}
        {user && <NotificationBell userId={String(user.id)} />}

        <div
          style={{ width: "1px", height: "24px", backgroundColor: "var(--border-subtle)" }}
        />

        {rightContent}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 h-9 transition-all"
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--status-rejected-text)",
            backgroundColor: "var(--status-rejected-bg)",
            border: "1px solid var(--status-rejected-border)",
            borderRadius: "3px",
          }}
          aria-label="Log out"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DashboardTabBar — horizontal tab navigation row
   ───────────────────────────────────────────────────────────────────── */
export function DashboardTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
  rightContent,
}: {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  rightContent?: React.ReactNode;
}) {
  return (
    <div
      className="sticky top-0 z-40 backdrop-blur-sm"
      style={{
        backgroundColor: "rgba(10, 9, 7, 0.95)",
        borderBottom: "1px solid var(--border-subtle)",
        marginTop: "1px",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <nav
          className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 flex-wrap"
          aria-label="Dashboard tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onChange(tab)}
                aria-selected={isActive}
                role="tab"
                className="shrink-0 h-9 px-3 transition-all whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  borderRadius: "3px",
                  border: isActive
                    ? "1px solid var(--rust-600)"
                    : "1px solid var(--border-subtle)",
                  color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                  backgroundColor: isActive ? "var(--rust-900)" : "transparent",
                }}
              >
                {tab}
              </button>
            );
          })}
        </nav>
        {rightContent ? (
          <div className="flex items-center justify-end">{rightContent}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   DashboardAnimatedTabPanel — animated content switcher
   ───────────────────────────────────────────────────────────────────── */
class TabErrorBoundary extends React.Component<
  { activeKey: string; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { activeKey: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: { activeKey: string }) {
    if (prevProps.activeKey !== this.props.activeKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle
            className="w-10 h-10"
            style={{ color: "var(--status-rejected-text)" }}
          />
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "14px",
              color: "var(--text-primary)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Error loading this tab
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-secondary)",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 transition-colors"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border-emphasized)",
              borderRadius: "3px",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function DashboardAnimatedTabPanel({
  activeKey,
  children,
}: {
  activeKey: string;
  children: React.ReactNode;
}) {
  return (
    <TabErrorBoundary activeKey={activeKey}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full"
        >
          {children ?? (
            <div className="py-20 flex justify-center">
              <PulseSpinner />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </TabErrorBoundary>
  );
}

/* Re-export PulseSpinner for use in tab panels */
function PulseSpinnerExported() {
  return (
    <div className="relative w-8 h-8">
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: "2px solid var(--border-subtle)" }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "2px solid transparent",
          borderTopColor: "var(--rust-400)",
          animation: "spin 0.9s linear infinite",
        }}
      />
    </div>
  );
}
export { PulseSpinnerExported as DashboardSpinner };
