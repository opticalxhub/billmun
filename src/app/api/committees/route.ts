import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('committees')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch committees', details: error.message }, { status: 500 });
  }
}