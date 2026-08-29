import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, username')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: admins });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'กรุณากรอก Username และ Password' }, { status: 400 });
    }

    // Check if username already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('username', username)
      .single();

    if (existingAdmin) {
      return NextResponse.json({ success: false, error: 'มีชื่อผู้ใช้นี้ในระบบแล้ว' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error: insertError } = await supabase
      .from('admins')
      .insert([{ username, password: hashedPassword }]);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: 'สร้างผู้ดูแลระบบเรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing admin ID' }, { status: 400 });
    }

    // Prevent deleting the main 'admin' account if we want to be safe
    const { data: adminToDelete } = await supabase
      .from('admins')
      .select('username')
      .eq('id', id)
      .single();
    
    if (adminToDelete?.username === 'admin') {
       return NextResponse.json({ success: false, error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้ (admin)' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
