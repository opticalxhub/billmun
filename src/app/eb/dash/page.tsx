'use client';

import React, { Suspense, useState, useEffect } from "react";
import { EBLayout } from "@/components/eb-layout";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLoadingState } from "@/components/dashboard-shell";

// Import all sub-pages as components
import EBDashOverview from "./overview/page";
import RegistrationsDashPage from "./registrations/page";
import LiveMonitorPage from "./live-monitor/page";
import CommitteesDashPage from "./committees/page";
import EBDocumentsPage from "./documents/page";
import CommunicationsPage from "./communications/page";
import SettingsPage from "./settings/page";
import EBAuditLogPage from "./audit/page";
import EBInternalWorkspacePage from "./internal-workspace/page";
import EBWhatsAppPage from "./whatsapp/page";
import EBReportsPage from "./reports/page";
import EBSchedulePage from "./schedule/page";
import ConferenceControlPage from "./conference/page";
import EBContactPage from "./contact/page";
import InteractiveOnboarding from "@/components/interactive-onboarding";
import { supabase } from "@/lib/supabase";

function EBDashInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);
  const [user, setUser] = useState<{ id: string; full_name: string; has_completed_onboarding: boolean; role: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('users')
          .select('id, full_name, has_completed_onboarding, role')
          .eq('id', data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              setUser(profile as any);
              if (!profile.has_completed_onboarding && profile.id !== '00000000-0000-0000-0000-000000000000') {
                setShowOnboarding(true);
              }
            }
          });
      }
    });
  }, []);

  // Sync state with URL
  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/eb/dash?tab=${tabId}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <EBDashOverview />;
      case 'registrations': return (
        <div className="space-y-6">
          <RegistrationsDashPage />
          <EBAuditLogPage />
        </div>
      );
      case 'committees': return (
        <div className="space-y-6">
          <CommitteesDashPage />
          <LiveMonitorPage />
          <EBSchedulePage />
        </div>
      );
      case 'documents': return <EBDocumentsPage />;
      case 'communications': return (
        <div className="space-y-6">
          <CommunicationsPage />
          <EBWhatsAppPage />
          <EBContactPage />
        </div>
      );
      case 'settings': return (
        <div className="space-y-6">
          <SettingsPage />
          <ConferenceControlPage />
          <EBReportsPage />
          <EBInternalWorkspacePage />
        </div>
      );
      default: return <EBDashOverview />;
    }
  };

  return (
    <>
      <EBLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {renderContent()}
      </EBLayout>
      {showOnboarding && user && (
        <InteractiveOnboarding
          userRole={user.role}
          userName={user.full_name || 'Executive Member'}
          dashboardType="eb"
          onComplete={async () => {
            setShowOnboarding(false);
            try {
              await supabase.from('users').update({ has_completed_onboarding: true }).eq('id', user.id);
            } catch {}
          }}
        />
      )}
    </>
  );
}

export default function EBDashMain() {
  return (
    <Suspense fallback={<DashboardLoadingState type="overview" />}>
      <EBDashInner />
    </Suspense>
  );
}
