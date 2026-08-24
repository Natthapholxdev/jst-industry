import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-server';

// GET all leaves (or by employee)
export async function GET(request: Request) {
  // ตรวจสอบสิทธิ์ (Auth check)
  const user: any = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');

    // ถ้าไม่ใช่แอดมิน และพยายามดูข้อมูลคนอื่น ให้บังคับดูได้แค่ของตัวเอง
    let queryEmpId = employee_id;
    if (user.role !== 'admin') {
      queryEmpId = user.id.toString();
    }

    let query = supabase.from('leave_requests').select(`
      *,
      employees (emp_code, full_name, department)
    `).order('created_at', { ascending: false });

    if (queryEmpId) {
      query = query.eq('employee_id', queryEmpId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET Leaves Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

// POST new leave request
export async function POST(request: Request) {
  // ตรวจสอบสิทธิ์ (Auth check)
  const user: any = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { employee_id, leave_type, start_date, end_date, reason } = body;

    // บังคับให้พนักงานสร้างใบลาได้เฉพาะของตัวเองเท่านั้น
    if (user.role !== 'admin' && user.id.toString() !== employee_id.toString()) {
        return NextResponse.json({ error: "Forbidden: Cannot create leave for others" }, { status: 403 });
    }

    if (!employee_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json({ error: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด' }, { status: 400 });
    }

    const { data, error } = await supabase.from('leave_requests').insert([
      { employee_id, leave_type, start_date, end_date, reason, status: 'Pending' }
    ]).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("POST Leaves Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

// PUT to update leave status (Approve/Reject)
export async function PUT(request: Request) {
  // ตรวจสอบสิทธิ์ (Auth check)
  const user: any = await getUserFromRequest(request);
  
  // บังคับว่าต้องเป็น Admin เท่านั้นถึงจะอนุมัติ/ปฏิเสธใบลาได้
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data, error } = await supabase.from('leave_requests')
      .update({ status })
      .eq('id', id)
      .select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PUT Leaves Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}
