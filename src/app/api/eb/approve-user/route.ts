import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEBContext } from '@/lib/eb-auth';

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
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        status: approve ? 'APPROVED' : 'REJECTED',
        approved_at: approve ? new Date().toISOString() : null,
        approved_by_id: approverId,
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create notification
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: approve ? 'Application Approved' : 'Application Rejected',
      message: approve 
        ? 'Your BILLMUN registration has been approved. You can now access your dashboard.' 
        : 'Your BILLMUN registration was unfortunately rejected.',
      type: approve ? 'SUCCESS' : 'ERROR',
    });

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: approverId,
      action: approve ? 'APPROVED_USER' : 'REJECTED_USER',
      target_type: 'USER',
      target_id: userId,
      metadata: { email: targetUser.email }
    });

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