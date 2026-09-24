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

      // ตรวจสอบรหัสผ่าน (รองรับทั้ง bcrypt hash และ plaintext เดิม พร้อมอัปเกรดเป็น bcrypt อัตโนมัติ)
      let isMatch = false;
      const isBcryptHash = admin.password && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$') || admin.password.startsWith('$2y$'));

      if (isBcryptHash) {
        isMatch = await bcrypt.compare(password, admin.password);
      } else {
        // ตรวจสอบแบบ Plaintext เดิม
        isMatch = (password === admin.password);
        if (isMatch) {
          // อัปเกรดเป็น Bcrypt Hash ลงฐานข้อมูลเพื่อความปลอดภัย
          try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await supabase.from('admins').update({ password: hashedPassword }).eq('id', admin.id);
          } catch (e) {
            console.error('Failed to auto-hash admin password:', e);
          }
        }
      }

      if (!isMatch) {
        return NextResponse.json({ error: 'ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง!' }, { status: 401 });
      }

      // Set cookie using JWT
      await createSession({ role: 'admin', id: admin.id, name: admin.username });

      // Don't send password back to client
      delete admin.password;
      return NextResponse.json({ success: true, role: 'admin', data: admin });
    }

    return NextResponse.json({ error: 'Invalid login type' }, { status: 400 });

  } catch (error: any) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: error?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}