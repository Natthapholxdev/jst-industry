import { NextResponse } from 'next/server';
import { getDb } from '@/lib/sqlite';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET() {
  try {
    const db = await getDb();
    const row = await db.get(`SELECT * FROM presentation_state WHERE id = 1`);
    return NextResponse.json({ success: true, data: row });
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
    const db = await getDb();

    await db.run(
      `UPDATE presentation_state SET is_active = ?, view_mode = ?, title = ?, payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
      [is_active ? 1 : 0, view_mode || null, title || null, payload ? JSON.stringify(payload) : null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
