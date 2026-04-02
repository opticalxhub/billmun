import { NextRequest, NextResponse, after } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { runOnUserApproved } from '@/lib/automation';

/** bcryptjs is CPU-heavy; 10 rounds is a common production default and much faster than 12. */
const BCRYPT_ROUNDS = 10;

function isDuplicateAuthUserError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { message?: string; code?: string; status?: number };
  if (e.code === 'email_exists') return true;
  const msg = (e.message ?? '').toLowerCase();
  return (
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('user already exists') ||
    msg.includes('email address has already')
  );
}

type CommitteeRow = { id: string; name: string; abbreviation: string | null };

function matchCommittee(committees: CommitteeRow[], preferred: string) {
  const pref = preferred.trim();
  const prefU = pref.toUpperCase();
  return committees.find((c) => {
    const abbr = c.abbreviation?.toUpperCase();
    return (
      c.name === pref ||
      (abbr && abbr === prefU) ||
      (abbr && prefU.includes(abbr)) ||
      pref.includes(c.name) ||
      c.name.includes(pref)
    );
  });
}

export async function POST(request: NextRequest) {
  try {
    const {
      email, password, full_name, date_of_birth, grade, phone_number,
      emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
      dietary_restrictions, preferred_committee, allocated_country, department
    } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password and full name are required' }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    const [{ data: settings }, { data: existingProfile }] = await Promise.all([
      supabaseAdmin.from('conference_settings').select('registration_open, auto_approve_registrations').eq('id', '1').maybeSingle(),
      supabaseAdmin.from('users').select('id').eq('email', emailNorm).maybeSingle(),
    ]);

    if (settings && !settings.registration_open) {
      return NextResponse.json({ error: 'Registrations are currently closed.' }, { status: 403 });
    }

    const ALLOWED_SELF_REGISTER_ROLES = ['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN', 'MEDIA', 'PRESS', 'SECURITY', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'];
    const safeDepartment = ALLOWED_SELF_REGISTER_ROLES.includes(department) ? department : 'DELEGATE';

    if (existingProfile) {
      return NextResponse.json(
        { error: 'This email is already registered. Please try logging in instead.' },
        { status: 400 },
      );
    }

    if (['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(safeDepartment) && !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(safeDepartment) && (!preferred_committee || preferred_committee === '')) {
      return NextResponse.json({ error: 'Committee selection is required for your role' }, { status: 400 });
    }

    const [authResult, password_hash] = await Promise.all([
      supabaseAdmin.auth.admin.createUser({
        email: emailNorm,
        password,
        email_confirm: false,
      }),
      bcrypt.hash(password, BCRYPT_ROUNDS),
    ]);

    const { data: authData, error: authError } = authResult;

    if (authError) {
      if (isDuplicateAuthUserError(authError)) {
        return NextResponse.json(
          { error: 'This email is already registered. Please try logging in instead.' },
          { status: 409 },
        );
      }
      console.error('[register] auth error:', authError);
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    const autoApprove = settings?.auto_approve_registrations;

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: emailNorm,
      full_name,
      password_hash,
      role: safeDepartment,
      status: autoApprove ? 'APPROVED' : 'PENDING',
      date_of_birth,
      grade,
      phone_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      dietary_restrictions,
      preferred_committee: (['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(safeDepartment) && !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(safeDepartment)) ? preferred_committee : null,
      allocated_country: safeDepartment === 'DELEGATE' ? allocated_country : null,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('[register] profile error:', profileError);
      return NextResponse.json({ error: 'Registration failed' }, { status: 400 });
    }

    const wantsCommitteeRow =
      !!preferred_committee &&
      ['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(safeDepartment) &&
      !['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(safeDepartment);

    if (wantsCommitteeRow) {
      const { data: committees } = await supabaseAdmin.from('committees').select('id, name, abbreviation');
      const committee = matchCommittee((committees || []) as CommitteeRow[], String(preferred_committee));
      if (committee) {
        if (['ADMIN', 'CHAIR', 'CO_CHAIR'].includes(safeDepartment)) {
          await supabaseAdmin.from('committee_assignments').insert({
            user_id: authData.user.id,
            committee_id: committee.id,
          });
        } else if (safeDepartment === 'DELEGATE') {
          await supabaseAdmin.from('committee_assignments').insert({
            user_id: authData.user.id,
            committee_id: committee.id,
            country: allocated_country,
          });
        }
      }
    }

    if (autoApprove) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
          email_confirm: true,
        });
      } catch {
        /* ignore */
      }
      const uid = authData.user.id;
      const runApproval = async () => {
        try {
          await runOnUserApproved(uid, uid);
        } catch (e) {
          console.error('[register] runOnUserApproved:', e);
        }
      };
      try {
        after(runApproval);
      } catch {
        void runApproval();
      }
    }

    const response = NextResponse.json({ success: true, userId: authData.user.id });
    response.headers.set('RateLimit-Limit', '5');
    response.headers.set('RateLimit-Remaining', '4');
    response.headers.set('RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 300));
    return response;
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
