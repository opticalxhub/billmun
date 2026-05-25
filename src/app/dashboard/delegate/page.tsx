import { redirect } from 'next/navigation';
import { getRequestUserContext } from '@/lib/auth-context';
import { getDelegateDashboardData } from '@/lib/delegate-dashboard';
import DelegateDashboardClient from './delegate-dashboard-client';
import type {
  CommitteeAssignmentSummary,
  CommitteeSessionSummary,
  CommitteeSummary,
  PortalUserSummary,
} from '@/types/portal';

export interface DelegateContext {
  user: PortalUserSummary;
  assignment: CommitteeAssignmentSummary | null;
  committee: CommitteeSummary | null;
  session: CommitteeSessionSummary | null;
  settings: any | null;
  stats: {
    documents: number;
    aiToday: number;
    speeches: number;
    blocs: number;
  };
  activity: Array<{
    id: string;
    action: string;
    performed_at: string;
  }>;
  refreshData: () => Promise<void>;
}

export default async function DelegateDashboardPage() {
  const { context } = await getRequestUserContext();

  if (!context) {
    redirect('/login');
  }

  const initialData = await getDelegateDashboardData(context);

  return <DelegateDashboardClient initialData={initialData} emergencyAccess={context.emergency} />;
}
