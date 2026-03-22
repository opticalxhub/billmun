import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEBContext } from '@/lib/eb-auth';
import { runOnUserApproved, runOnUserRejected } from '@/lib/automation';

export async function POST(request: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getEBContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { userId, approve } = body;
    const approverId = context.ebUserId;

    if (!userId || typeof approve !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, preferred_committee, allocated_country')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(
        approve
          ? {
              status: 'APPROVED' as const,
              approved_at: new Date().toISOString(),
              approved_by_id: approverId,
              updated_at: new Date().toISOString(),
            }
          : {
              status: 'REJECTED' as const,
              approved_at: null,
              approved_by_id: null,
              updated_at: new Date().toISOString(),
            },
      )
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (approve) {
      void runOnUserApproved(userId, approverId);
    } else {
      void runOnUserRejected(
        userId,
        targetUser.email,
        targetUser.full_name,
        undefined,
      );
    }

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: approverId,
        action: approve ? 'APPROVED_USER' : 'REJECTED_USER',
        target_type: 'USER',
        target_id: userId,
        metadata: { email: targetUser.email }
      });
    } catch (auditErr) {
      console.error('Audit logging failed:', auditErr);
    }

    // If the user is approved, ensure their Supabase auth user is email-confirmed.
    if (approve) {
      try {
        await (supabaseAdmin as any).auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
      } catch (confirmErr: any) {
        console.error('Failed to confirm user email on approval:', confirmErr?.message ?? confirmErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}