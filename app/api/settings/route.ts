import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-server';

// ดึงการตั้งค่า
export async function GET(request: Request) {
  // ตรวจสอบสิทธิ์ (Auth check)
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // เราจะใช้ ID = 1 เป็นค่าเริ่มต้นของระบบเสมอ
    const { data, error } = await supabase
      .from('shift_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // ถ้าไม่พบข้อมูล ให้คืนค่าว่างเปล่ากลับไปเพื่อให้หน้าเว็บโชว์ค่า Default
        return NextResponse.json(null);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}

// บันทึก/อัปเดตการตั้งค่า
export async function POST(request: Request) {
  const user: any = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    const settings = await request.json();

    const { error } = await supabase
      .from('shift_settings')
      .upsert({
        id: 1, // บังคับอัปเดตแถวที่ 1 เสมอ
        shift_name: settings.shift_name,
        prevent_double_scan_mins: Number(settings.prevent_double_scan_mins),
        morning_in_end: settings.morning_in_end,
        lunch_out_end: settings.lunch_out_end,
        afternoon_in_end: settings.afternoon_in_end,
        evening_out_end: settings.evening_out_end,
        ot_in_end: settings.ot_in_end
      }, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST Settings Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากระบบ' }, { status: 500 });
  }
}