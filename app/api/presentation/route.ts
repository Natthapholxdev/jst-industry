import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('presentation_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    
    // Parse payload if it's a string (to match old sqlite behavior if needed, though Supabase handles JSON natively)
    let parsedData = data;
    if (data && typeof data.payload === 'string') {
      try {
        parsedData = { ...data, payload: JSON.parse(data.payload) };
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Protect this route: only admin can push state
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { is_active, view_mode, title, payload } = body;

    const { error } = await supabase
      .from('presentation_state')
      .update({
        is_active: is_active ? true : false,
        view_mode: view_mode || null,
        title: title || null,
        payload: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
