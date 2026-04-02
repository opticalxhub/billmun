import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUserContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

// GET – list resolutions for authenticated user
export async function GET(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const { data, error } = await supabaseAdmin
      .from('resolutions')
      .select('*')
      .eq('user_id', context.userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('[resolution GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST – create a new resolution or perform an action
export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const body = await req.json();
    const action = body.action as string | undefined;

    // ── Create resolution ──
    if (!action || action === 'create') {
      const { data, error } = await supabaseAdmin
        .from('resolutions')
        .insert({
          user_id: context.userId,
          committee_id: body.committee_id || null,
          title: body.title || 'Untitled Resolution',
          topic: body.topic || '',
          co_sponsors: body.co_sponsors || [],
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // ── Add clause ──
    if (action === 'add_clause') {
      const { resolution_id, type, opening_phrase, content, order_index, parent_clause_id } = body;
      if (!resolution_id || !type || !opening_phrase) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Verify ownership
      const { data: res } = await supabaseAdmin
        .from('resolutions')
        .select('user_id')
        .eq('id', resolution_id)
        .maybeSingle();
      if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('resolution_clauses')
        .insert({
          resolution_id,
          type,
          opening_phrase,
          content: content || '',
          order_index: order_index ?? 0,
          parent_clause_id: parent_clause_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // ── Delete clause ──
    if (action === 'delete_clause') {
      const { clause_id, resolution_id } = body;
      if (!clause_id) return NextResponse.json({ error: 'Missing clause_id' }, { status: 400 });

      // Verify ownership
      if (resolution_id) {
        const { data: res } = await supabaseAdmin
          .from('resolutions')
          .select('user_id')
          .eq('id', resolution_id)
          .single();
        if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const { error } = await supabaseAdmin
        .from('resolution_clauses')
        .delete()
        .eq('id', clause_id);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // ── Move clause (reorder) ──
    if (action === 'move_clause') {
      const { clause_id, swap_clause_id, new_order, swap_order } = body;
      if (!clause_id || !swap_clause_id) {
        return NextResponse.json({ error: 'Missing clause IDs' }, { status: 400 });
      }

      await supabaseAdmin.from('resolution_clauses').update({ order_index: new_order }).eq('id', clause_id);
      await supabaseAdmin.from('resolution_clauses').update({ order_index: swap_order }).eq('id', swap_clause_id);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[resolution POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH – update resolution metadata
export async function PATCH(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const body = await req.json();
    const { id, title, topic, co_sponsors, is_manual, manual_content } = body;

    if (!id) return NextResponse.json({ error: 'Missing resolution id' }, { status: 400 });

    // Verify ownership
    const { data: res } = await supabaseAdmin
      .from('resolutions')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (topic !== undefined) updates.topic = topic;
    if (co_sponsors !== undefined) updates.co_sponsors = co_sponsors;
    if (is_manual !== undefined) updates.is_manual = is_manual;
    if (manual_content !== undefined) updates.manual_content = manual_content;

    const { error } = await supabaseAdmin
      .from('resolutions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[resolution PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE – delete a resolution
export async function DELETE(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return NextResponse.json({ error: authError }, { status: authStatus || 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Verify ownership
    const { data: res } = await supabaseAdmin
      .from('resolutions')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('resolutions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[resolution DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── helpers ──
function isPrivileged(role: string) {
  return ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'CHAIR', 'CO_CHAIR'].includes(role);
}
