import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    // Whitelist allowed fields
    const allowedFields = ['emp_code', 'full_name', 'position', 'department', 'status', 'shift_id', 'weekly_day_off', 'fingerprint_id', 'phone', 'address', 'start_date', 'note'];
    const sanitized: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) sanitized[field] = body[field];
    }
    const { error } = await supabase.from('employees').insert([sanitized]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    // Whitelist allowed fields
    const allowedFields = ['emp_code', 'full_name', 'position', 'department', 'status', 'shift_id', 'weekly_day_off', 'fingerprint_id', 'phone', 'address', 'start_date', 'note'];
    const sanitized: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) sanitized[field] = body[field];
    }
    const { error } = await supabase.from('employees').update(sanitized).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}
