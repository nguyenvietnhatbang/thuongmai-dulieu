import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { runReminderSystemTriggers } from '@/features/customer-care/services/care.service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = user.roles.includes('system_management') || await hasPermission('receivables.update_status.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await runReminderSystemTriggers();

    return NextResponse.json({
      success: true,
      message: 'Trạng thái công nợ và chăm sóc khách hàng đã được đồng bộ và cập nhật thành công!'
    });
  } catch (error: any) {
    console.error('API Trigger Reminders POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
