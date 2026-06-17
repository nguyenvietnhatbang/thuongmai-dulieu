import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateProjectNote } from '@/features/projects/services/project.service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 });
    }

    const updated = await updateProjectNote(noteId, status, user.id);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Ghi chú nội bộ đã được cập nhật!'
    });
  } catch (error: any) {
    console.error('API Project Note PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
