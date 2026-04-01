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
import EBSecurityPage from "./security/page";
import CommunicationsPage from "./communications/page";
import SettingsPage from "./settings/page";
import EBAuditLogPage from "./audit/page";
import EBInternalWorkspacePage from "./internal-workspace/page";
import EBWhatsAppPage from "./whatsapp/page";
import EBReportsPage from "./reports/page";
import EBSchedulePage from "./schedule/page";
import ConferenceControlPage from "./conference/page";
import EBMediaPRPage from "./media-pr/page";
import EBContactPage from "./contact/page";

function EBDashInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);

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
      case 'registrations': return <RegistrationsDashPage />;
      case 'live-monitor': return <LiveMonitorPage />;
      case 'committees': return <CommitteesDashPage />;
      case 'documents': return <EBDocumentsPage />;
      case 'security': return <EBSecurityPage />;
      case 'communications': return <CommunicationsPage />;
      case 'contact': return <EBContactPage />;
      case 'media-pr': return <EBMediaPRPage />;
      case 'settings': return <SettingsPage />;
      case 'audit': return <EBAuditLogPage />;
      case 'internal-workspace': return <EBInternalWorkspacePage />;
      case 'whatsapp': return <EBWhatsAppPage />;
      case 'reports': return <EBReportsPage />;
      case 'schedule': return <EBSchedulePage />;
      case 'conference': return <ConferenceControlPage />;
      default: return <EBDashOverview />;
    }
  };

  return (
    <EBLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </EBLayout>
  );
}

export default function EBDashMain() {
  return (
    <Suspense fallback={<DashboardLoadingState type="overview" />}>
      <EBDashInner />
    </Suspense>
  );
}
