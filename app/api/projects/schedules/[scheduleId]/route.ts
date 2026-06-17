import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateProjectSchedule, deleteProjectSchedule } from '@/features/projects/services/project.service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleId } = await params;
    const body = await request.json();

    const updated = await updateProjectSchedule(scheduleId, body, user.id);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Lịch trình đã được cập nhật!'
    });
  } catch (error: any) {
    console.error('API Project Schedule PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleId } = await params;
    const deleted = await deleteProjectSchedule(scheduleId, user.id);

    return NextResponse.json({
      success: true,
      deleted,
      message: 'Đã xóa lịch trình thành công!'
    });
  } catch (error: any) {
    console.error('API Project Schedule DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
