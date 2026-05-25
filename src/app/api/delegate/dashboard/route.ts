import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserContext } from '@/lib/auth-context';
import { getDelegateDashboardData } from '@/lib/delegate-dashboard';
import { jsonPrivateNoStore } from '@/lib/http';
import { reportError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const delegateDashboardQuerySchema = z.object({
  userId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) {
      return jsonPrivateNoStore({ error: authError || 'Unauthorized' }, { status: authStatus || 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = delegateDashboardQuerySchema.safeParse({
      userId: searchParams.get('userId') ?? undefined,
    });
    if (!parsedQuery.success) {
      return jsonPrivateNoStore({ error: 'Invalid dashboard query' }, { status: 400 });
    }

    const dashboardData = await getDelegateDashboardData(context, parsedQuery.data.userId);
    if (!dashboardData) {
      return jsonPrivateNoStore({ error: 'User not found' }, { status: 404 });
    }

    return jsonPrivateNoStore(dashboardData);
  } catch (err: unknown) {
    reportError(err, { route: '/api/delegate/dashboard', method: 'GET' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}
