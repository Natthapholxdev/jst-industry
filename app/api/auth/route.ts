import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession } from '@/lib/auth-server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, type, empCode } = body;

    // Type 'admin' uses username & password
    if (type === 'admin') {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, username, password')
        .eq('username', username)
        .single();

      if (error || !admin) {
        return NextResponse.json({ error: 'ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง!' }, { status: 401 });
      }

      // Compare password (also fallback to plaintext if not matched yet)
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        if (password !== admin.password) {
           return NextResponse.json({ error: 'ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง!' }, { status: 401 });
        }
      }

      // Set cookie using JWT
      await createSession({ role: 'admin', id: admin.id, name: admin.username });

      // Don't send password back to client
      delete admin.password;
      return NextResponse.json({ success: true, role: 'admin', data: admin });
    }

    return NextResponse.json({ error: 'Invalid login type' }, { status: 400 });

  } catch (error: any) {
    // ซ่อนรายละเอียด Error ไม่ให้หลุดไปที่ Client
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}