import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // 1. Check Database Connection
    const { error } = await supabaseAdmin.from('conference_settings').select('id').limit(1).maybeSingle();
    
    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        database: 'disconnected',
        timestamp: new Date().toISOString() 
      }, { status: 503 });
    }

    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}
