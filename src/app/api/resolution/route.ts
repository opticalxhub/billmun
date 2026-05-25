import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRequestUserContext } from '@/lib/auth-context';
import { jsonPrivateNoStore } from '@/lib/http';
import { reportError } from '@/lib/logger';
import { sanitizeText, UUID_SCHEMA } from '@/lib/security';

export const dynamic = 'force-dynamic';

const resolutionSelect =
  'id, user_id, committee_id, title, topic, co_sponsors, is_manual, manual_content, created_at, updated_at';

const createResolutionSchema = z.object({
  action: z.literal('create').optional(),
  committee_id: UUID_SCHEMA.optional().nullable(),
  title: z.string().optional(),
  topic: z.string().optional(),
  co_sponsors: z.array(z.string()).max(50).optional().default([]),
});

const addClauseSchema = z.object({
  action: z.literal('add_clause'),
  resolution_id: UUID_SCHEMA,
  type: z.enum(['PREAMBULATORY', 'OPERATIVE']),
  opening_phrase: z.string(),
  content: z.string().optional(),
  order_index: z.number().int().min(0).optional().default(0),
  parent_clause_id: UUID_SCHEMA.optional().nullable(),
});

const deleteClauseSchema = z.object({
  action: z.literal('delete_clause'),
  clause_id: UUID_SCHEMA,
  resolution_id: UUID_SCHEMA.optional().nullable(),
});

const moveClauseSchema = z.object({
  action: z.literal('move_clause'),
  clause_id: UUID_SCHEMA,
  swap_clause_id: UUID_SCHEMA,
  new_order: z.number().int().min(0),
  swap_order: z.number().int().min(0),
});

const patchResolutionSchema = z.object({
  id: UUID_SCHEMA,
  title: z.string().optional(),
  topic: z.string().optional(),
  co_sponsors: z.array(z.string()).max(50).optional(),
  is_manual: z.boolean().optional(),
  manual_content: z.string().optional(),
});

function sanitizeSponsorList(values: string[] | undefined) {
  return (values || [])
    .map((value) => sanitizeText(value, 120))
    .filter((value): value is string => Boolean(value));
}

// GET – list resolutions for authenticated user
export async function GET(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error: authError }, { status: authStatus || 401 });

    const { data, error } = await supabaseAdmin
      .from('resolutions')
      .select(resolutionSelect)
      .eq('user_id', context.userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return jsonPrivateNoStore(data || []);
  } catch (err: unknown) {
    reportError(err, { route: '/api/resolution', method: 'GET' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST – create a new resolution or perform an action
export async function POST(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error: authError }, { status: authStatus || 401 });

    const body = await req.json();
    const action = body.action as string | undefined;

    if (!action || action === 'create') {
      const parsedBody = createResolutionSchema.safeParse(body);
      if (!parsedBody.success) {
        return jsonPrivateNoStore({ error: 'Invalid resolution payload' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('resolutions')
        .insert({
          user_id: context.userId,
          committee_id: parsedBody.data.committee_id || null,
          title: sanitizeText(parsedBody.data.title, 200) || 'Untitled Resolution',
          topic: sanitizeText(parsedBody.data.topic, 200) || '',
          co_sponsors: sanitizeSponsorList(parsedBody.data.co_sponsors),
        })
        .select(resolutionSelect)
        .single();

      if (error) throw error;
      return jsonPrivateNoStore(data);
    }

    if (action === 'add_clause') {
      const parsedBody = addClauseSchema.safeParse(body);
      if (!parsedBody.success) {
        return jsonPrivateNoStore({ error: 'Invalid clause payload' }, { status: 400 });
      }
      const { resolution_id, type, opening_phrase, content, order_index, parent_clause_id } = parsedBody.data;

      const { data: res } = await supabaseAdmin
        .from('resolutions')
        .select('user_id')
        .eq('id', resolution_id)
        .maybeSingle();
      if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
        return jsonPrivateNoStore({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('resolution_clauses')
        .insert({
          resolution_id,
          type,
          opening_phrase: sanitizeText(opening_phrase, 120),
          content: sanitizeText(content, 4000) || '',
          order_index,
          parent_clause_id: parent_clause_id || null,
        })
        .select('id, resolution_id, type, opening_phrase, content, order_index, parent_clause_id')
        .single();

      if (error) throw error;
      return jsonPrivateNoStore(data);
    }

    if (action === 'delete_clause') {
      const parsedBody = deleteClauseSchema.safeParse(body);
      if (!parsedBody.success) {
        return jsonPrivateNoStore({ error: 'Invalid clause deletion payload' }, { status: 400 });
      }
      const { clause_id, resolution_id } = parsedBody.data;

      if (resolution_id) {
        const { data: res } = await supabaseAdmin
          .from('resolutions')
          .select('user_id')
          .eq('id', resolution_id)
          .single();
        if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
          return jsonPrivateNoStore({ error: 'Forbidden' }, { status: 403 });
        }
      }

      const { error } = await supabaseAdmin
        .from('resolution_clauses')
        .delete()
        .eq('id', clause_id);

      if (error) throw error;
      return jsonPrivateNoStore({ ok: true });
    }

    if (action === 'move_clause') {
      const parsedBody = moveClauseSchema.safeParse(body);
      if (!parsedBody.success) {
        return jsonPrivateNoStore({ error: 'Invalid clause reorder payload' }, { status: 400 });
      }
      const { clause_id, swap_clause_id, new_order, swap_order } = parsedBody.data;

      await supabaseAdmin.from('resolution_clauses').update({ order_index: new_order }).eq('id', clause_id);
      await supabaseAdmin.from('resolution_clauses').update({ order_index: swap_order }).eq('id', swap_clause_id);

      return jsonPrivateNoStore({ ok: true });
    }

    return jsonPrivateNoStore({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    reportError(err, { route: '/api/resolution', method: 'POST' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH – update resolution metadata
export async function PATCH(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error: authError }, { status: authStatus || 401 });

    const parsedBody = patchResolutionSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return jsonPrivateNoStore({ error: 'Invalid resolution update payload' }, { status: 400 });
    }
    const { id, title, topic, co_sponsors, is_manual, manual_content } = parsedBody.data;

    const { data: res } = await supabaseAdmin
      .from('resolutions')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
      return jsonPrivateNoStore({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = sanitizeText(title, 200) || 'Untitled Resolution';
    if (topic !== undefined) updates.topic = sanitizeText(topic, 200) || '';
    if (co_sponsors !== undefined) updates.co_sponsors = sanitizeSponsorList(co_sponsors);
    if (is_manual !== undefined) updates.is_manual = is_manual;
    if (manual_content !== undefined) updates.manual_content = sanitizeText(manual_content, 20000) || '';

    const { error } = await supabaseAdmin
      .from('resolutions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return jsonPrivateNoStore({ ok: true });
  } catch (err: unknown) {
    reportError(err, { route: '/api/resolution', method: 'PATCH' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE – delete a resolution
export async function DELETE(req: NextRequest) {
  try {
    const { context, error: authError, status: authStatus } = await getRequestUserContext();
    if (!context) return jsonPrivateNoStore({ error: authError }, { status: authStatus || 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !UUID_SCHEMA.safeParse(id).success) {
      return jsonPrivateNoStore({ error: 'Missing id' }, { status: 400 });
    }

    const { data: res } = await supabaseAdmin
      .from('resolutions')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (!res || (res.user_id !== context.userId && !isPrivileged(context.role))) {
      return jsonPrivateNoStore({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('resolutions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return jsonPrivateNoStore({ ok: true });
  } catch (err: unknown) {
    reportError(err, { route: '/api/resolution', method: 'DELETE' });
    return jsonPrivateNoStore({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── helpers ──
function isPrivileged(role: string) {
  return ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'CHAIR', 'CO_CHAIR'].includes(role);
}
