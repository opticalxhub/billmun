import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { runOnUserApproved } from '@/lib/automation';

export async function POST(request: NextRequest) {
  try {
    const {
      email, password, full_name, date_of_birth, grade, phone_number,
      emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
      dietary_restrictions, preferred_committee, allocated_country, department
    } = await request.json();

    const { data: settings } = await supabaseAdmin.from('conference_settings').select('registration_open, auto_approve_registrations').eq('id', '1').maybeSingle();

    if (settings && !settings.registration_open) {
      return NextResponse.json({ error: 'Registrations are currently closed.' }, { status: 403 });
    }

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password and full name are required' }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    const { data: existingProfile } = await supabaseAdmin.from('users').select('id').eq('email', emailNorm).maybeSingle();
    if (existingProfile) {
      return NextResponse.json(
        { error: 'This email is already registered. Please try logging in instead.' },
        { status: 400 },
      );
    }

    if (['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(department) && (!preferred_committee || preferred_committee === '')) {
      console.log('Validation failed: department=', department, 'preferred_committee=', preferred_committee);
      return NextResponse.json({ error: 'Committee selection is required for your role' }, { status: 400 });
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNorm,
      password,
      email_confirm: false,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'This email is already registered. Please try logging in instead.' }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // 2. Create user profile in 'users' table
    const autoApprove = settings?.auto_approve_registrations;
    const password_hash = await bcrypt.hash(password, 12);

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: emailNorm,
      full_name,
      password_hash,
      role: department,
      status: autoApprove ? 'APPROVED' : 'PENDING',
      date_of_birth,
      grade,
      phone_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      dietary_restrictions,
      preferred_committee: ['DELEGATE', 'CHAIR', 'CO_CHAIR', 'ADMIN'].includes(department) ? preferred_committee : null,
      allocated_country: department === 'DELEGATE' ? allocated_country : null,
    });

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (autoApprove) {
      try {
        await (supabaseAdmin as { auth: { admin: { updateUserById: (id: string, p: { email_confirm: boolean }) => Promise<unknown> } } }).auth.admin.updateUserById(authData.user.id, {
          email_confirm: true,
        });
      } catch {
        /* ignore */
      }
      await runOnUserApproved(authData.user.id, authData.user.id);
    }

    // 3. Auto-assign committee assignment if preferred_committee is provided (for ADMIN/CHAIR)
    if (['ADMIN', 'CHAIR', 'CO_CHAIR'].includes(department) && preferred_committee) {
      const pref = preferred_committee.trim();
      const prefU = pref.toUpperCase();
      const { data: committees } = await supabaseAdmin.from('committees').select('id, name, abbreviation');
      const committee = committees?.find((c) => {
        const abbr = (c.abbreviation as string | null | undefined)?.toUpperCase();
        return (
          c.name === pref ||
          (abbr && abbr === prefU) ||
          (abbr && prefU.includes(abbr)) ||
          pref.includes(c.name) ||
          c.name.includes(pref)
        );
      });
      
      if (committee) {
        await supabaseAdmin.from('committee_assignments').insert({
          user_id: authData.user.id,
          committee_id: committee.id
        });
      }
    } else if (autoApprove && department === 'DELEGATE' && preferred_committee) {
      const pref = preferred_committee.trim();
      const prefU = pref.toUpperCase();
      const { data: committees } = await supabaseAdmin.from('committees').select('id, name, abbreviation');
      const committee = committees?.find((c) => {
        const abbr = (c.abbreviation as string | null | undefined)?.toUpperCase();
        return (
          c.name === pref ||
          (abbr && abbr === prefU) ||
          (abbr && prefU.includes(abbr)) ||
          pref.includes(c.name) ||
          c.name.includes(pref)
        );
      });
      if (committee) {
        await supabaseAdmin.from('committee_assignments').insert({
          user_id: authData.user.id,
          committee_id: committee.id,
          country: allocated_country
        });
      }
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
