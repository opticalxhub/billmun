import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingSpinner } from "./loading-spinner";
import { LogOut, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { ReportIssueModal } from "./report-issue-modal";

export function DashboardLoadingState({ type = "default" }: { type?: "default" | "overview" | "list" | "table" }) {
  if (type === "overview" || type === "list" || type === "table") {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${type === 'table' ? 'py-20 h-full' : 'min-h-[400px]'} animate-in fade-in duration-500`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
      <LoadingSpinner size="xl" />
    </div>
  );
}

export function DashboardErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
      <div className="max-w-lg w-full p-6 border border-border-subtle rounded-card bg-bg-card">
        <p className="text-sm text-text-primary">{message}</p>
      </div>
    </div>
  );
}

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
  user?: any;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-jotia text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-text-primary truncate">{title}</h1>
        {subtitle ? <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-text-dimmed truncate">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {user && <ReportIssueModal user={user} committeeName={committeeName} />}
          {user && <NotificationBell userId={user.id} />}
        </div>
        <div className="h-6 w-px bg-border-subtle mx-1 sm:mx-2" />
        <div className="flex items-center gap-2 sm:gap-3">
          {rightContent}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 h-9 sm:h-10 text-[10px] font-bold uppercase tracking-widest text-status-rejected-text bg-status-rejected-bg/10 border border-status-rejected-border/20 rounded-button hover:bg-status-rejected-bg/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="sticky top-0 z-40 bg-bg-base/95 backdrop-blur-sm border-b border-border-subtle mt-4 sm:mt-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`shrink-0 h-9 sm:h-10 px-2.5 sm:px-3 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest transition-colors border rounded-input whitespace-nowrap ${
                activeTab === tab
                  ? "border-text-primary text-text-primary bg-bg-card"
                  : "border-border-subtle text-text-dimmed hover:text-text-primary hover:border-border-emphasized"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        {rightContent ? <div className="flex items-center justify-end">{rightContent}</div> : null}
      </div>
    </div>
  );
}

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
          <AlertTriangle className="w-10 h-10 text-status-rejected-text" />
          <p className="text-text-primary font-jotia text-sm">Something went wrong loading this tab.</p>
          <p className="text-text-dimmed font-jotia text-xs max-w-md text-center">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-bg-raised border border-border-subtle rounded-button text-text-primary hover:bg-bg-hover transition-colors"
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full"
        >
          {children || <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>}
        </motion.div>
      </AnimatePresence>
    </TabErrorBoundary>
  );
}
