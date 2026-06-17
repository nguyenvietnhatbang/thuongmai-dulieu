import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query(
      `SELECT e.id, e.code, e.exported_at as "exportedAt", e.export_format as "exportFormat", e.file_name as "fileName", e.status, u.full_name as "createdBy"
       FROM app.receivable_exports e
       LEFT JOIN app.users u ON e.created_by = u.id
       ORDER BY e.exported_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: res.rows
    });
  } catch (error: any) {
    console.error('API Receivable Exports GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
