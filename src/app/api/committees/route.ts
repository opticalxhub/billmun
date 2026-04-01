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
    console.error("[committees] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}