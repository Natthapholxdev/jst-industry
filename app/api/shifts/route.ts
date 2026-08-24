import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-server';

// GET all shifts
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabase.from('shifts').select('*').order('id', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET Shifts Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

// POST new shift
export async function POST(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });

  try {
    const body = await request.json();
    const { name_th, time_in, time_out, ot_start_time } = body;

    const { data, error } = await supabase.from('shifts').insert([
      { name_th, time_in, time_out, ot_start_time }
    ]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("POST Shifts Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

// PUT to update shift
export async function PUT(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, name_th, time_in, time_out, ot_start_time } = body;

    const { data, error } = await supabase.from('shifts').update(
      { name_th, time_in, time_out, ot_start_time }
    ).eq('id', id).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PUT Shifts Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

// DELETE shift
export async function DELETE(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Shifts Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}
