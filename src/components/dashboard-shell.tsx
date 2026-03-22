import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingSpinner } from "./loading-spinner";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
}: {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}) {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="font-jotia text-4xl uppercase tracking-tight text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-text-dimmed">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {rightContent}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 h-10 text-[10px] font-bold uppercase tracking-widest text-status-rejected-text bg-status-rejected-bg/10 border border-status-rejected-border/20 rounded-button hover:bg-status-rejected-bg/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
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
    <div className="sticky top-0 z-40 bg-bg-base/95 backdrop-blur-0 border-b border-border-subtle mt-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`h-10 px-3 text-[10px] font-semibold uppercase tracking-widest transition-colors border rounded-input ${
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

export function DashboardAnimatedTabPanel({
  activeKey,
  children,
}: {
  activeKey: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
