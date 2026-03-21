import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, password, fullName, dateOfBirth, grade, phoneNumber,
      emergencyContactName, emergencyContactRelation, emergencyContactPhone,
      dietaryRestrictions, preferredCommittee, allocatedCountry, department,
    } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Create auth user with email auto-confirmed (bypasses email verification)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user?.id) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    // Check if auto-approve is enabled
    let initialStatus = 'PENDING';
    const { data: confSettings } = await supabaseAdmin
      .from('conference_settings')
      .select('auto_approve_registrations')
      .eq('id', '1')
      .single();
    if (confSettings?.auto_approve_registrations) {
      initialStatus = 'APPROVED';
    }

    // Step 2: Create profile in users table
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      password_hash: '',
      date_of_birth: dateOfBirth,
      grade,
      phone_number: phoneNumber,
      emergency_contact_name: emergencyContactName,
      emergency_contact_relation: emergencyContactRelation,
      emergency_contact_phone: emergencyContactPhone,
      dietary_restrictions: dietaryRestrictions || null,
      preferred_committee: department === 'DELEGATE' ? preferredCommittee : null,
      allocated_country: department === 'DELEGATE' ? allocatedCountry : null,
      role: department,
      status: initialStatus,
    });

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
